import { Schema, model } from 'mongoose';

const AuditLogSchema = new Schema({}, { timestamps: true });

export const AuditLogModel = model('AuditLog', AuditLogSchema);
export default AuditLogModel;
