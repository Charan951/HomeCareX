// import { Schema, model } from 'mongoose';

// const AuditLogSchema = new Schema({}, { timestamps: true });

// export const AuditLogModel = model('AuditLog', AuditLogSchema);
// export default AuditLogModel;

import { Schema, model } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actor: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    entity: {
      type: String,
      required: true,
      trim: true,
    },

    entityId: {
      type: String,
      required: true,
      trim: true,
    },

    before: {
      type: Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: Schema.Types.Mixed,
      default: null,
    },

    ip: {
      type: String,
      required: true,
      trim: true,
    },

    result: {
      type: String,
      enum: ["Success", "Failed"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AuditLogModel = model("AuditLog", AuditLogSchema);

export default AuditLogModel;
