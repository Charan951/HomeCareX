/** Partner verification (KYC) status. This is the single source of truth for whether a partner may take jobs. */
export const KYC_STATUSES = ['not_started', 'submitted', 'in_review', 'approved', 'rejected', 'suspended'] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

/** Human labels for UI and emails. */
export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  not_started: 'Not Started',
  submitted: 'Submitted',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const KYC_DOCUMENT_TYPES = ['id_proof', 'address_proof', 'skill_certificate', 'background_check'] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

/** A partner can only submit once these are uploaded. */
export const REQUIRED_KYC_DOCUMENTS: KycDocumentType[] = ['id_proof', 'address_proof'];

export const KYC_DOCUMENT_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type KycDocumentStatus = (typeof KYC_DOCUMENT_STATUSES)[number];

/** Only approved partners can go online and receive job offers. */
export const CAN_TAKE_JOBS: KycStatus[] = ['approved'];