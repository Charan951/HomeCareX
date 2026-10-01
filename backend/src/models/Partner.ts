import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  KYC_DOCUMENT_STATUSES,
  KYC_DOCUMENT_TYPES,
  KYC_STATUSES,
} from '../modules/partners/partner-dashboard.constants';

const KycDocumentSchema = new Schema(
  {
    type: { type: String, enum: KYC_DOCUMENT_TYPES, required: true },
    url: { type: String, required: true },
    storageKey: { type: String },
    status: { type: String, enum: KYC_DOCUMENT_STATUSES, default: 'pending' },
    reviewNote: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

/** Partner profile. One per partner User (userId). Contract for onboarding + dashboard modules. */
const PartnerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    skills: [{ type: String, trim: true }],
    serviceRadiusKm: { type: Number, default: 10, min: 1, max: 100 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    /** Counters maintained by matching/booking services; rates are derived from these. */
    stats: {
      offersReceived: { type: Number, default: 0, min: 0 },
      offersAccepted: { type: Number, default: 0, min: 0 },
      jobsAssigned: { type: Number, default: 0, min: 0 },
      jobsCompleted: { type: Number, default: 0, min: 0 },
    },
    kyc: {
      status: { type: String, enum: KYC_STATUSES, default: 'not_started', index: true },
      documents: { type: [KycDocumentSchema], default: [] },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String },
      suspensionReason: { type: String },
    },
    trainingCompleted: { type: Boolean, default: false },
    /** Never store the full account number here; keep it with the payout provider. */
    bankDetails: {
      accountHolder: { type: String },
      accountLast4: { type: String, match: /^\d{4}$/ },
      ifsc: { type: String, uppercase: true },
      upiId: { type: String },
    },
  },
  { timestamps: true },
);

export type Partner = InferSchemaType<typeof PartnerSchema>;
export const PartnerModel = model('Partner', PartnerSchema);
export default PartnerModel;