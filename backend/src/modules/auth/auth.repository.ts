import { UserModel } from '../../models/User';

export const authRepository = {
  findByEmailWithPassword: (email: string) => UserModel.findOne({ email }).select('+passwordHash'),
  findById: (id: string) => UserModel.findById(id),
  existsByEmailOrPhone: (email: string, phone?: string) =>
    UserModel.exists(phone ? { $or: [{ email }, { phone }] } : { email }),
  create: (data: { name: string; email: string; phone?: string; passwordHash: string; role: string; referralCode?: string }) =>
    UserModel.create(data),
};
