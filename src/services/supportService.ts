import api from './api';
import type { ApiResponse } from '../types/api';
import type {
  CreateSupportInquiryPayload,
  SupportInquiry,
  UpdateSupportInquiryPayload,
} from '../types/supportInquiry';

export const supportService = {
  createInquiry: (payload: CreateSupportInquiryPayload) =>
    api.post<ApiResponse<{ message: string; inquiry: SupportInquiry }>>(
      '/support-inquiries',
      payload,
    ),
  getMyInquiries: () =>
    api.get<ApiResponse<{ inquiries: SupportInquiry[] }>>('/support-inquiries/my'),
  getAdminInquiries: () =>
    api.get<ApiResponse<{ inquiries: SupportInquiry[] }>>('/admin/support-inquiries'),
  updateAdminInquiry: (id: string, payload: UpdateSupportInquiryPayload) =>
    api.patch<ApiResponse<{ inquiry: SupportInquiry }>>(
      `/admin/support-inquiries/${id}`,
      payload,
    ),
};
