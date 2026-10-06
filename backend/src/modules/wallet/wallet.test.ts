import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import { createWalletService } from './wallet.service';
import { rupeesToPaise } from './wallet.money';
import type { LedgerInsert, WalletRepository } from './wallet.repository';
import type { IWalletLedger } from './wallet.model';

/** In-memory repo with the same atomic guard + unique idempotency key as the Mongo implementation. */
function fakeRepo(startPaise = 0) {
  let balance = startPaise;
  const ledger: IWalletLedger[] = [];
  const repo: WalletRepository = {
    async findLedgerByKey(_c, key) {
      return ledger.find((l) => l.idempotencyKey === key) ?? null;
    },
    async creditBalance(_c, amount) {
      balance += amount;
      return balance;
    },
    async debitBalanceIfEnough(_c, amount) {
      if (balance < amount) return null;
      balance -= amount;
      return balance;
    },
    async insertLedger(e: LedgerInsert) {
      if (e.idempotencyKey && ledger.some((l) => l.idempotencyKey === e.idempotencyKey)) throw Object.assign(new Error('dup'), { code: 11000 });
      const row = { _id: new Types.ObjectId(), ...e, createdAt: new Date() } as unknown as IWalletLedger;
      ledger.push(row);
      return row;
    },
    async getBalance() {
      return balance;
    },
    async listLedger(_c, page, limit) {
      return { rows: ledger.slice((page - 1) * limit, page * limit), total: ledger.length };
    },
  };
  return { repo, ledger, balance: () => balance };
}

const C = 'a'.repeat(24);

test('rupeesToPaise: rejects zero, negative, NaN, strings, >2 decimals, over-limit', () => {
  assert.equal(rupeesToPaise(10.5), 1050);
  for (const bad of [0, -5, NaN, Infinity, '10', null, 1.005, 1_000_000]) {
    assert.throws(() => rupeesToPaise(bad), { code: 'INVALID_AMOUNT' }, String(bad));
  }
});

test('credit then debit updates balance and writes a ledger row each', async () => {
  const { repo, ledger } = fakeRepo();
  const w = createWalletService(repo);
  const c = await w.credit({ customerId: C, amount: 500, type: 'refund_credit', description: 'Refund BK-1' });
  assert.equal(c.balance, 500);
  const d = await w.debit({ customerId: C, amount: 120.5, type: 'debit', description: 'Booking BK-2' });
  assert.equal(d.balance, 379.5);
  assert.equal(ledger.length, 2);
  assert.equal(ledger[1].balanceAfterPaise, 37950);
});

test('debit larger than balance -> 409 INSUFFICIENT_BALANCE, balance untouched, no ledger row', async () => {
  const { repo, ledger, balance } = fakeRepo(10_000);
  const w = createWalletService(repo);
  await assert.rejects(w.debit({ customerId: C, amount: 100.01, type: 'debit', description: 'x' }), { statusCode: 409, code: 'INSUFFICIENT_BALANCE' });
  assert.equal(balance(), 10_000);
  assert.equal(ledger.length, 0);
});

test('balance can never go negative under concurrent debits', async () => {
  const { repo, balance } = fakeRepo(10_000); // ₹100
  const w = createWalletService(repo);
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => w.debit({ customerId: C, amount: 30, type: 'debit', description: `d${i}` })));
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  assert.equal(ok, 3); // 3 x ₹30 fit in ₹100, the other 7 are refused
  assert.equal(balance(), 1_000);
  assert.ok(balance() >= 0);
});

test('idempotency key: the same refund credited twice only moves money once', async () => {
  const { repo, ledger, balance } = fakeRepo();
  const w = createWalletService(repo);
  const a = await w.credit({ customerId: C, amount: 250, type: 'refund_credit', description: 'Refund', idempotencyKey: 'refund:b1' });
  const b = await w.credit({ customerId: C, amount: 250, type: 'refund_credit', description: 'Refund', idempotencyKey: 'refund:b1' });
  assert.equal(a.replayed, false);
  assert.equal(b.replayed, true);
  assert.equal(balance(), 25_000);
  assert.equal(ledger.length, 1);
});

test('racing duplicates with one key: balance is rolled back, only one ledger row survives', async () => {
  const { repo, ledger, balance } = fakeRepo();
  const w = createWalletService(repo);
  await Promise.all(Array.from({ length: 5 }, () => w.credit({ customerId: C, amount: 100, type: 'referral_reward', description: 'Referral', idempotencyKey: 'ref:u9' })));
  assert.equal(ledger.length, 1);
  assert.equal(balance(), 10_000);
});

test('type guards: credit() refuses debit type and vice versa', async () => {
  const w = createWalletService(fakeRepo().repo);
  await assert.rejects(w.credit({ customerId: C, amount: 1, type: 'debit', description: 'x' }), { code: 'VALIDATION_ERROR' });
  await assert.rejects(w.debit({ customerId: C, amount: 1, type: 'credit', description: 'x' }), { code: 'VALIDATION_ERROR' });
});

test('getWallet returns rupees + paged ledger', async () => {
  const { repo } = fakeRepo();
  const w = createWalletService(repo);
  await w.credit({ customerId: C, amount: 99.99, type: 'credit', description: 'Top-up' });
  const res = await w.getWallet(C, 1, 20);
  assert.equal(res.balance, 99.99);
  assert.equal(res.ledger.total, 1);
  assert.equal(res.ledger.items[0].type, 'credit');
});
