import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  Consensus,
  ConsensusVote,
  ConsensusVoteType,
  Definition,
} from "../types/debate";

export interface CreateSelectionConsensusRequest {
  term: string;
  title: string;
  content: string;
}

export interface VoteConsensusRequest {
  voteType: ConsensusVoteType;
  comment?: string;
}

interface FinalizeConsensusResponse {
  message: string;
  consensus: Consensus;
  definition?: Definition;
}

export const consensusService = {
  getById: (consensusId: string) =>
    api.get<ApiResponse<{ consensus: Consensus }>>(`/consensuses/${consensusId}`),
  createFromSelectionTarget: (
    selectionTargetId: string,
    data: CreateSelectionConsensusRequest,
  ) =>
    api.post<ApiResponse<{ consensus: Consensus }>>(
      `/selection-targets/${selectionTargetId}/consensuses`,
      data,
    ),
  vote: (consensusId: string, data: VoteConsensusRequest) =>
    api.post<ApiResponse<{ vote: ConsensusVote; consensus: Consensus | null }>>(`/consensuses/${consensusId}/votes`, data),
  approve: (consensusId: string) =>
    api.patch<ApiResponse<FinalizeConsensusResponse>>(`/consensuses/${consensusId}/approve`),
  reject: (consensusId: string) =>
    api.patch<ApiResponse<FinalizeConsensusResponse>>(`/consensuses/${consensusId}/reject`),
  close: (consensusId: string) =>
    api.patch<ApiResponse<FinalizeConsensusResponse>>(`/consensuses/${consensusId}/close`),
};
