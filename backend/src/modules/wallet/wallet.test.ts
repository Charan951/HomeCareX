
import type { WalletRepository } from "./wallet.repository";
import { walletRepository } from "./wallet.repository";
import { rupeesToPaise } from "./wallet.money";

type CreditType = "credit" | "refund_credit" | "referral_reward";
type DebitType = "debit";

interface CreditInput {
  customerId: string;
  amount: number;
  type: CreditType;
  description: string;
  idempotencyKey?: string;
}

interface DebitInput {
  customerId: string;
  amount: number;
  type: DebitType;
  description: string;
  idempotencyKey?: string;
}

interface WalletError extends Error {
  statusCode?: number;
  code?: string;
}

function createError(
  message: string,
  code: string,
  statusCode = 400
): WalletError {
  const error = new Error(message) as WalletError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function paiseToRupees(paise: number): number {
  return paise / 100;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export class WalletService {
  constructor(
    private readonly repo: WalletRepository = walletRepository
  ) {}

  async credit(input: CreditInput) {
    if (
      input.type !== "credit" &&
      input.type !== "refund_credit" &&
      input.type !== "referral_reward"
    ) {
      throw createError(
        `Invalid credit wallet transaction type: ${input.type}`,
        "VALIDATION_ERROR",
        400
      );
    }

    const amountPaise = rupeesToPaise(input.amount);

    /*
     * Idempotency fast-path.
     *
     * If this transaction has already been applied, return the current
     * balance without crediting the wallet again.
     */
    if (input.idempotencyKey) {
      const existing = await this.repo.findLedgerByKey(
        input.customerId,
        input.idempotencyKey
      );

      if (existing) {
        const balancePaise = await this.repo.getBalance(input.customerId);

        return {
          balance: paiseToRupees(balancePaise),
          ledger: existing,
          replayed: true,
        };
      }
    }

    /*
     * Credit first, then create the ledger record.
     *
     * The unique idempotency-key constraint protects against two concurrent
     * requests both passing the initial findLedgerByKey() check.
     */
    const balanceAfterPaise = await this.repo.creditBalance(
      input.customerId,
      amountPaise
    );

    try {
      const ledger = await this.repo.insertLedger({
        customerId: input.customerId,
        amountPaise,
        balanceAfterPaise,
        type: input.type,
        description: input.description,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        balance: paiseToRupees(balanceAfterPaise),
        ledger,
        replayed: false,
      };
    } catch (error) {
      /*
       * Another concurrent request may have inserted the same idempotency
       * key after our initial check. Undo this request's credit.
       */
      if (input.idempotencyKey && isDuplicateKeyError(error)) {
        const rolledBackBalance = await this.repo.debitBalanceIfEnough(
          input.customerId,
          amountPaise
        );

        if (rolledBackBalance === null) {
          throw createError(
            "Unable to roll back duplicate wallet credit",
            "WALLET_ROLLBACK_FAILED",
            500
          );
        }

        const existing = await this.repo.findLedgerByKey(
          input.customerId,
          input.idempotencyKey
        );

        return {
          balance: paiseToRupees(rolledBackBalance),
          ledger: existing,
          replayed: true,
        };
      }

      /*
       * Ledger creation failed for a non-idempotency reason. Roll back the
       * balance change so balance and ledger cannot diverge.
       */
      await this.repo.debitBalanceIfEnough(
        input.customerId,
        amountPaise
      );

      throw error;
    }
  }

  async debit(input: DebitInput) {
    if (input.type !== "debit") {
      throw createError(
        `Invalid debit wallet transaction type: ${input.type}`,
        "VALIDATION_ERROR",
        400
      );
    }

    const amountPaise = rupeesToPaise(input.amount);

    if (input.idempotencyKey) {
      const existing = await this.repo.findLedgerByKey(
        input.customerId,
        input.idempotencyKey
      );

      if (existing) {
        const balancePaise = await this.repo.getBalance(input.customerId);

        return {
          balance: paiseToRupees(balancePaise),
          ledger: existing,
          replayed: true,
        };
      }
    }

    /*
     * debitBalanceIfEnough() must perform the balance check and decrement
     * atomically in the repository.
     */
    const balanceAfterPaise = await this.repo.debitBalanceIfEnough(
      input.customerId,
      amountPaise
    );

    if (balanceAfterPaise === null) {
      throw createError(
        "Insufficient wallet balance",
        "INSUFFICIENT_BALANCE",
        409
      );
    }

    try {
      const ledger = await this.repo.insertLedger({
        customerId: input.customerId,
        amountPaise,
        balanceAfterPaise,
        type: input.type,
        description: input.description,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        balance: paiseToRupees(balanceAfterPaise),
        ledger,
        replayed: false,
      };
    } catch (error) {
      /*
       * Put the debited amount back if writing the ledger fails.
       */
      await this.repo.creditBalance(
        input.customerId,
        amountPaise
      );

      if (input.idempotencyKey && isDuplicateKeyError(error)) {
        const existing = await this.repo.findLedgerByKey(
          input.customerId,
          input.idempotencyKey
        );

        const balancePaise = await this.repo.getBalance(input.customerId);

        return {
          balance: paiseToRupees(balancePaise),
          ledger: existing,
          replayed: true,
        };
      }

      throw error;
    }
  }

  async getWallet(
    customerId: string,
    page = 1,
    limit = 20
  ) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));

    const [balancePaise, ledgerResult] = await Promise.all([
      this.repo.getBalance(customerId),
      this.repo.listLedger(customerId, safePage, safeLimit),
    ]);

    return {
      balance: paiseToRupees(balancePaise),

      ledger: {
        items: ledgerResult.rows.map((row) => ({
          ...row,
          amount:
            "amountPaise" in row && typeof row.amountPaise === "number"
              ? paiseToRupees(row.amountPaise)
              : undefined,

          balanceAfter:
            "balanceAfterPaise" in row &&
            typeof row.balanceAfterPaise === "number"
              ? paiseToRupees(row.balanceAfterPaise)
              : undefined,
        })),

        total: ledgerResult.total,
        page: safePage,
        limit: safeLimit,
      },
    };
  }
}

/**
 * Factory used by tests and anywhere that needs to inject a custom
 * WalletRepository.
 */
export function createWalletService(
  repo: WalletRepository
): WalletService {
  return new WalletService(repo);
}
