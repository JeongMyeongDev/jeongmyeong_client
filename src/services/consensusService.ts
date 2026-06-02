import api from './api';
import type { Consensus, ConsensusStatus, ConsensusVote, ConsensusVoteType } from '../types/debate';

export interface CreateSelectionConsensusRequest {
  title: string;
  content: string;
}

interface CreateConsensusResponse {
  success: boolean;
  consensus: Consensus;
}

interface ConsensusListResponse {
  success: boolean;
  consensuses: Consensus[];
}

interface ConsensusDetailResponse {
  success: boolean;
  consensus: Consensus;
}

interface ConsensusVotesResponse {
  success: boolean;
  votes: ConsensusVote[];
}

export interface VoteConsensusRequest {
  voteType: ConsensusVoteType;
  comment?: string;
}

interface VoteConsensusResponse {
  success: boolean;
  vote: ConsensusVote;
}

export interface UpdateConsensusStatusRequest {
  status: Extract<ConsensusStatus, 'APPROVED' | 'REJECTED' | 'CLOSED'>;
  resultSummary?: string;
  saveAsGlobalDefinition?: boolean;
}

export const consensusService = {
  getByDebate: (debateId: string, status?: ConsensusStatus) =>
    api.get<ConsensusListResponse>(`/debates/${debateId}/consensuses`, { params: { status } }),
  getById: (consensusId: string) =>
    api.get<ConsensusDetailResponse>(`/consensuses/${consensusId}`),
  getVotes: (consensusId: string) =>
    api.get<ConsensusVotesResponse>(`/consensuses/${consensusId}/votes`),
  createFromSelectionTarget: (selectionTargetId: string, data: CreateSelectionConsensusRequest) =>
    api.post<CreateConsensusResponse>(`/selection-targets/${selectionTargetId}/consensuses`, data),
  vote: (consensusId: string, data: VoteConsensusRequest) =>
    api.post<VoteConsensusResponse>(`/consensuses/${consensusId}/votes`, data),
  updateStatus: (consensusId: string, data: UpdateConsensusStatusRequest) =>
    api.patch<ConsensusDetailResponse>(`/consensuses/${consensusId}/status`, data),
};
