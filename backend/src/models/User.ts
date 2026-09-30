import { Schema, model, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['admin', 'customer', 'partner'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES: UserRole[] = ['admin'];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'customer', index: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    /** Bumped on logout / password change to invalidate every refresh token. */
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof UserSchema>;
export const UserModel = model('User', UserSchema);
export default UserModel;
