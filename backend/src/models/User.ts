import { Schema, model } from 'mongoose';

const UserSchema = new Schema({}, { timestamps: true });

export const UserModel = model('User', UserSchema);
export default UserModel;
