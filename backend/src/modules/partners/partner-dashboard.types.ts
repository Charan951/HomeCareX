import type { KycDocumentStatus, KycDocumentType, KycStatus } from './partner-dashboard.constants';

/** Contract for the KYC module (Vaishnavi). Dates are ISO strings on the wire. */
export interface KycDocumentDto {
  id: string;
  type: KycDocumentType;
  url: string;
  status: KycDocumentStatus;
  reviewNote?: string;
  uploadedAt: string;
}

export interface KycDto {
  status: KycStatus;
  documents: KycDocumentDto[];
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
}

export interface PartnerDto {
  id: string;
  userId: string;
  categories: string[];
  skills: string[];
  serviceRadiusKm: number;
  ratingAvg: number;
  ratingCount: number;
  trainingCompleted: boolean;
  kyc: KycDto;
}

/** Body of "submit KYC" (partner -> not_started/rejected -> submitted). */
export interface SubmitKycInput {
  documents: { type: KycDocumentType; url: string; storageKey?: string }[];
}

/** Body of admin review actions (submitted -> in_review -> approved/rejected, approved <-> suspended). */
export interface ReviewKycInput {
  to: Extract<KycStatus, 'in_review' | 'approved' | 'rejected' | 'suspended'>;
  note?: string;
}
export interface ActiveJobDto {
  id: string;
  service: string;
  customer: string;
  address: string;
  status: 'en_route' | 'arrived' | 'in_progress';
  scheduledAt: string;
}

/** GET /api/v1/partner/dashboard -> data */
export interface PartnerDashboardDto {
  newJobs: number;
  todayJobs: number;
  completedJobs: number;
  todayEarnings: number;
  rating: number;
  acceptanceRate: number;
  completionRate: number;
  activeJob: ActiveJobDto | null;
}