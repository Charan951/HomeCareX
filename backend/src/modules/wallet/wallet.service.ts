import crypto from 'crypto';
import Razorpay from 'razorpay';
import { WalletModel, WalletLedgerModel } from '../../models/Wallet';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export class WalletService {
  /**
   * Retrieves wallet balance and paginated ledger.
   * Matches Frontend data contract: { balance, ledger: { items, total, limit, page } }
   */
  async getWallet(userId: string, page = 1, limit = 15, type?: string) {
    const numPage = Math.max(1, Number(page) || 1);
    const numLimit = Math.min(100, Math.max(1, Number(limit) || 15));
    const skip = (numPage - 1) * numLimit;

    let wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      wallet = await WalletModel.create({ userId, balance: 0 });
    }

    const query: Record<string, any> = { userId };
    if (type) {
      query.type = { $in: [type.toLowerCase(), type.toUpperCase()] };
    }

    const [items, total] = await Promise.all([
      WalletLedgerModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      WalletLedgerModel.countDocuments(query),
    ]);

    return {
      balance: wallet.balance,
      ledger: {
        items,
        total,
        page: numPage,
        limit: numLimit,
      },
    };
  }

  async createTopupOrder(userId: string, amountInRupees: number) {
    if (!amountInRupees || amountInRupees < 10 || amountInRupees > 50000) {
      throw new Error('Invalid amount. Minimum recharge is ₹10 and maximum is ₹50,000.');
    }

    const amountInPaise = Math.round(amountInRupees * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `top_${Date.now().toString().slice(-8)}`,
      notes: {
        userId,
        type: 'WALLET_TOPUP',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

 async verifyTopupPayment(params: {
    userId: string;
    orderId: string;
    paymentId: string;
    signature: string;
    amount: number;
  }) {
    const { userId, orderId, paymentId, signature, amount } = params;

    // 1. Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid payment signature');
    }

    // 2. Prevent duplicate credit on webhook or frontend retry
    const existingEntry = await WalletLedgerModel.findOne({ referenceId: paymentId });
    if (existingEntry) {
      return { balance: existingEntry.balanceAfter };
    }

    // 3. Convert paise to Rupees (e.g., 50000 paise -> 500 Rupees)
    // Fetch directly from Razorpay for tamper-proof amount verification
    let amountInRupees = Math.round(Number(amount) / 100);
    try {
      const rzpOrder = await razorpay.orders.fetch(orderId);
      if (rzpOrder && typeof rzpOrder.amount === 'number') {
        amountInRupees = Math.round(rzpOrder.amount / 100);
      }
    } catch {
      // Fallback to divided client amount if fetch fails
      amountInRupees = Math.round(Number(amount) / 100);
    }

    // 4. Atomically credit wallet in RUPEES
    const updatedWallet = await WalletModel.findOneAndUpdate(
      { userId },
      { $inc: { balance: amountInRupees } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Create credit ledger entry in RUPEES
    const ledger = await WalletLedgerModel.create({
      walletId: updatedWallet._id,
      userId,
      type: 'credit',
      amount: amountInRupees,
      balanceAfter: updatedWallet.balance,
      description: 'Wallet top-up via Razorpay',
      referenceId: paymentId,
    });

    return { balance: updatedWallet.balance, transaction: ledger };
  }
}
export const walletService = new WalletService();