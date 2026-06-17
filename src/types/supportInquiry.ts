export type SupportInquiryCategory = 'BUG' | 'ACCOUNT' | 'DEBATE' | 'REPORT' | 'ETC';

export type SupportInquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportInquiry {
  id: string;
  userId: string;
  user?: { id: string; nickname: string; email?: string };
  category: SupportInquiryCategory;
  title: string;
  content: string;
  status: SupportInquiryStatus;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CreateSupportInquiryPayload {
  category?: SupportInquiryCategory;
  title: string;
  content: string;
}

export interface UpdateSupportInquiryPayload {
  status?: SupportInquiryStatus;
  adminReply?: string;
}
