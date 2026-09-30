export const PARTNER_STATUSES = ['pending', 'active', 'suspended', 'deactivated'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const KYC_STATUSES = ['not_submitted', 'submitted', 'in_review', 'approved', 'rejected'] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const KYC_DOCUMENT_TYPES = ['id_proof', 'address_proof', 'skill_certificate', 'background_check'] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export const KYC_DOCUMENT_STATUSES = ['pending', 'verified', 'rejected'] as const;