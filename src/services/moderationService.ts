import api from './api';
import type { ApiResponse } from '../types/api';
import type {
  ContentAction,
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  Sanction,
  SanctionType,
} from '../types/moderation';

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail?: string;
}

export interface ListReportsParams {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  limit?: number;
}

export interface ApplyReportActionRequest {
  contentAction: ContentAction;
  resolutionNote?: string;
  sanctionType?: SanctionType;
  sanctionReason?: string;
  sanctionEndsAt?: string;
}

export interface CreateSanctionRequest {
  reportId?: string;
  type: SanctionType;
  reason: string;
  startsAt?: string;
  endsAt?: string;
}

export const moderationService = {
  createReport: (data: CreateReportRequest) =>
    api.post<ApiResponse<{ message: string; report: Report }>>('/reports', data),
  getMyReports: (params?: ListReportsParams) =>
    api.get<ApiResponse<{ reports: Report[]; totalCount: number }>>('/me/reports', { params }),
  getMySanctions: () =>
    api.get<ApiResponse<{ sanctions: Sanction[] }>>('/me/sanctions'),
  acknowledgeSanction: (sanctionId: string) =>
    api.patch<ApiResponse<{ message: string }>>(`/me/sanctions/${sanctionId}/acknowledge`),
  getAdminReports: (params?: ListReportsParams) =>
    api.get<ApiResponse<{ reports: Report[]; totalCount: number }>>('/admin/reports', { params }),
  getAdminReport: (id: string) =>
    api.get<ApiResponse<{ report: Report }>>(`/admin/reports/${id}`),
  reviewReport: (id: string, resolutionNote?: string) =>
    api.patch<ApiResponse<{ report: Report }>>(`/admin/reports/${id}/review`, { resolutionNote }),
  rejectReport: (id: string, resolutionNote?: string) =>
    api.patch<ApiResponse<{ message: string; report: Report }>>(`/admin/reports/${id}/reject`, { resolutionNote }),
  applyReportAction: (id: string, data: ApplyReportActionRequest) =>
    api.post<ApiResponse<{ message: string; report: Report; sanction?: Sanction | null }>>(
      `/admin/reports/${id}/actions`,
      data,
    ),
  getUserSanctions: (userId: string) =>
    api.get<ApiResponse<{ sanctions: Sanction[] }>>(`/admin/users/${userId}/sanctions`),
  createSanction: (userId: string, data: CreateSanctionRequest) =>
    api.post<ApiResponse<{ sanction: Sanction }>>(`/admin/users/${userId}/sanctions`, data),
  revokeSanction: (id: string, revokeReason?: string) =>
    api.patch<ApiResponse<{ sanction: Sanction }>>(`/admin/sanctions/${id}/revoke`, { revokeReason }),
};
