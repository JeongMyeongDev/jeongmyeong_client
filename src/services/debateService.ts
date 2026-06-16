import api from "./api";
import type {
  Consensus,
  CreatedPost,
  Debate,
  DebateMessage,
  DebateProgress,
  DebateStance,
  DebateUserStance,
  DefinitionReferenceInput,
  SelectionSource,
  SelectionTarget,
  StanceSummary,
} from "../types/debate";

// ─── Request Types ──────────────────────────────────────────

export interface CreateDebateRequest {
  title: string;
  description: string;
  debateType: "FREE" | "CONSENSUS" | "PROS_CONS";
  tagIds?: string[];
  closeConditionType?: "TIME_LIMIT" | "MANUAL" | "TARGET_REACHED";
  closeAt?: string;
}

export interface ListDebatesParams {
  keyword?: string;
  tag?: string;
  tagIds?: string;
  type?: "FREE" | "CONSENSUS" | "PROS_CONS";
  status?: "OPEN" | "CLOSED" | "ARCHIVED";
  page?: number;
  limit?: number;
  sort?: "createdAt" | "archivedAt" | "updatedAt";
  direction?: "asc" | "desc";
}

export interface CreatePostRequest {
  content: string;
  stance?: DebateStance;
  definitionReferences?: DefinitionReferenceInput[];
}

export interface CreateSelectionTargetRequest {
  sourceType: SelectionSource;
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
}

export interface CreateConsensusRequest {
  term: string;
  title: string;
  content: string;
  selectionTargetId: string;
}

export interface CreateChildDebateRequest {
  title: string;
  description: string;
  debateType?: "FREE" | "CONSENSUS" | "PROS_CONS";
  tagIds?: string[];
}

export interface CloseDebateRequest {
  resultSummary?: string;
}

// ─── Response Types ─────────────────────────────────────────

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

interface DebateProgressResponse {
  success: boolean;
  progress: DebateProgress;
}

interface DebateUserStanceResponse {
  success: boolean;
  stance: DebateUserStance | null;
  summary?: StanceSummary;
}

interface DebateStanceSummaryResponse {
  success: boolean;
  summary: StanceSummary;
}

interface JoinDebateResponse {
  success: boolean;
  participant: {
    id: string;
    debateId: string;
    userId: string;
    joinedAt: string;
    lastReadAt?: string | null;
    roleInDebate: "CREATOR" | "PARTICIPANT" | "MODERATOR";
    user: {
      id: string;
      nickname: string;
      profileImage?: string | null;
    };
  };
  participantCount: number;
}

interface ArchiveDebateResponse {
  success: boolean;
  debate: Pick<Debate, "id" | "status" | "archivedAt" | "closedAt">;
}

interface DebatePostsResponse {
  success: boolean;
  posts: DebateMessage[];
  page: number;
  limit: number;
  totalCount: number;
}

interface CreatePostResponse {
  success: boolean;
  post: CreatedPost;
}

interface CreateSelectionTargetResponse {
  success: boolean;
  selectionTarget: SelectionTarget;
}

interface SelectionTargetListResponse {
  success: boolean;
  selectionTargets: SelectionTarget[];
}

interface CreateConsensusResponse {
  success: boolean;
  consensus: Consensus;
}

interface ConsensusListResponse {
  success: boolean;
  consensuses: Consensus[];
}

interface ChildDebateListResponse {
  success: boolean;
  childDebates: Debate[];
}

interface ParentDebateResponse {
  success: boolean;
  parentDebate: Debate | null;
  selectedText: string | null;
  sourceSelectionTarget?: SelectionTarget | null;
}

interface CreateChildDebateResponse {
  success: boolean;
  childDebate: Debate;
  selectedText: string;
  sourceSelectionTarget: SelectionTarget;
  parentDebate: Debate;
}

// ─── Service ────────────────────────────────────────────────

export const debateService = {
  // 목록
  getList: (params?: ListDebatesParams) =>
    api.get<DebateListResponse>("/debates", { params }),
  getArchived: (params?: Omit<ListDebatesParams, "status">) =>
    api.get<DebateListResponse>("/debates/archive", { params }),
  getMyDebates: (params?: ListDebatesParams) =>
    api.get<DebateListResponse>("/debates/my", { params }),
  getBookmarks: (params?: ListDebatesParams) =>
    api.get<DebateListResponse>("/debates/bookmarks", { params }),

  // 상세
  getById: (id: string) => api.get<DebateDetailResponse>(`/debates/${id}`),
  getProgress: (id: string) =>
    api.get<DebateProgressResponse>(`/debates/${id}/progress`),
  getMyStance: (id: string) =>
    api.get<DebateUserStanceResponse>(`/debates/${id}/my-stance`),
  updateStance: (id: string, stance: DebateStance) =>
    api.patch<DebateUserStanceResponse>(`/debates/${id}/stance`, { stance }),
  getStanceSummary: (id: string) =>
    api.get<DebateStanceSummaryResponse>(`/debates/${id}/stance-summary`),
  getChildDebates: (id: string) =>
    api.get<ChildDebateListResponse>(`/debates/${id}/child-debates`),
  getParent: (id: string) =>
    api.get<ParentDebateResponse>(`/debates/${id}/parent`),

  // 생성 / 참여 / 아카이브
  create: (data: CreateDebateRequest) =>
    api.post<DebateDetailResponse>("/debates", data),
  join: (id: string) =>
    api.post<JoinDebateResponse>(`/debates/${id}/participants`),
  close: (id: string, data?: CloseDebateRequest) =>
    api.patch<ArchiveDebateResponse>(`/debates/${id}/close`, data ?? {}),
  archive: (id: string) =>
    api.patch<ArchiveDebateResponse>(`/debates/${id}/archive`),

  // 북마크 / 구독
  bookmark: (id: string) => api.post(`/debates/${id}/bookmark`),
  unbookmark: (id: string) => api.delete(`/debates/${id}/bookmark`),
  subscribe: (id: string) => api.post(`/debates/${id}/subscription`),
  unsubscribe: (id: string) => api.delete(`/debates/${id}/subscription`),

  // 의견 (Posts)
  getMessages: (id: string, params?: Pick<ListDebatesParams, "page" | "limit">) =>
    api.get<DebatePostsResponse>(`/debates/${id}/posts`, { params }),
  createPost: (id: string, data: CreatePostRequest) =>
    api.post<CreatePostResponse>(`/debates/${id}/posts`, data),

  // 선택 영역 / 합의안
  getSelectionTargets: (id: string) =>
    api.get<SelectionTargetListResponse>(`/debates/${id}/selection-targets`),
  createSelectionTarget: (id: string, data: CreateSelectionTargetRequest) =>
    api.post<CreateSelectionTargetResponse>(`/debates/${id}/selection-targets`, data),
  getConsensuses: (id: string) =>
    api.get<ConsensusListResponse>(`/debates/${id}/consensuses`),
  createConsensus: (id: string, data: CreateConsensusRequest) =>
    api.post<CreateConsensusResponse>(`/debates/${id}/consensuses`, data),
  createChildDebate: (selectionTargetId: string, data: CreateChildDebateRequest) =>
    api.post<CreateChildDebateResponse>(
      `/selection-targets/${selectionTargetId}/child-debates`,
      data,
    ),
};
