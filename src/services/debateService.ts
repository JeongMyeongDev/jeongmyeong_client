import api from './api';
import type {
  Consensus,
  CreatedPost,
  Debate,
  DebateMessage,
  SelectionSource,
  SelectionTarget,
} from '../types/debate';

export interface CreateDebateRequest {
  title: string;
  description: string;
  debateType: 'FREE' | 'CONSENSUS' | 'PROS_CONS';
  tags?: string[];
  closeConditionType?: 'TIME_LIMIT' | 'MANUAL' | 'TARGET_REACHED';
  closeAt?: string;
}

export interface CreateChildDebateRequest {
  title: string;
  description: string;
  debateType?: 'FREE' | 'CONSENSUS' | 'PROS_CONS';
  tags?: string[];
}

export interface ListDebatesParams {
  keyword?: string;
  tag?: string;
  type?: 'FREE' | 'CONSENSUS' | 'PROS_CONS';
  status?: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'archivedAt' | 'updatedAt';
  direction?: 'asc' | 'desc';
}

interface DebateListResponse {
  success: boolean;
  debates: Debate[];
  page: number;
  limit: number;
  totalCount: number;
}

interface DebateDetailResponse {
  success: boolean;
  debate: Debate;
}

interface ArchiveDebateResponse {
  success: boolean;
  debate: Pick<Debate, 'id' | 'status' | 'archivedAt'>;
}

interface JoinDebateResponse {
  success: boolean;
  participantCount: number;
}

interface DebatePostsResponse {
  success: boolean;
  posts: DebateMessage[];
  page: number;
  limit: number;
  totalCount: number;
}

export interface CreatePostRequest {
  content: string;
}

interface CreatePostResponse {
  success: boolean;
  post: CreatedPost;
}

export interface CreateSelectionTargetRequest {
  sourceType: SelectionSource;
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
}

interface CreateSelectionTargetResponse {
  success: boolean;
  selectionTarget: SelectionTarget;
}

export interface CreateConsensusRequest {
  title: string;
  content: string;
  selectionTargetId: string;
}

interface CreateConsensusResponse {
  success: boolean;
  consensus: Consensus;
}

export const debateService = {
  getList: (params?: ListDebatesParams) => api.get<DebateListResponse>('/debates', { params }),
  getById: (id: string) => api.get<DebateDetailResponse>(`/debates/${id}`),
  create: (data: CreateDebateRequest) => api.post<DebateDetailResponse>('/debates', data),
  join: (id: string) => api.post<JoinDebateResponse>(`/debates/${id}/participants`),
  archive: (id: string) => api.post<ArchiveDebateResponse>(`/debates/${id}/archive`),
  getMessages: (id: string, params?: Pick<ListDebatesParams, 'page' | 'limit'>) =>
    api.get<DebatePostsResponse>(`/debates/${id}/posts`, { params }),
  createPost: (id: string, data: CreatePostRequest) =>
    api.post<CreatePostResponse>(`/debates/${id}/posts`, data),
  createSelectionTarget: (id: string, data: CreateSelectionTargetRequest) =>
    api.post<CreateSelectionTargetResponse>(`/debates/${id}/selection-targets`, data),
  createConsensus: (id: string, data: CreateConsensusRequest) =>
    api.post<CreateConsensusResponse>(`/debates/${id}/consensuses`, data),
  createChildDebateFromSelection: (selectionTargetId: string, data: CreateChildDebateRequest) =>
    api.post<DebateDetailResponse>(`/selection-targets/${selectionTargetId}/child-debates`, data),
  getArchived: (params?: Omit<ListDebatesParams, 'status'>) =>
    api.get<DebateListResponse>('/debates/archive', { params }),
};
