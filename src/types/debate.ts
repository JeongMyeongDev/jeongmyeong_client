export type DebateType = 'FREE' | 'CONSENSUS' | 'PROS_CONS';
export type DebateStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';
export type PostStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';
export type SelectionSource = 'POST' | 'COMMENT';
export type ConsensusStatus = 'OPEN' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'ARCHIVED';
export type ConsensusVoteType = 'APPROVE' | 'REJECT' | 'COMMENT';

export interface DebateTag {
  id: string;
  name: string;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  debateType: DebateType;
  status: DebateStatus;
  createdAt?: string;
  archivedAt?: string | null;
  participantCount?: number;
  tagMaps?: Array<{ tag: DebateTag }>;
  creator?: {
    id: string;
    nickname: string;
  };
}

export interface DebateMessage {
  id: string;
  debateId: string;
  content: string;
  status: PostStatus;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
}

export interface CreatedPost {
  id: string;
  debateId: string;
  authorId: string;
  content: string;
  status: PostStatus;
  createdAt?: string;
}

export interface UpdatedPost {
  id: string;
  content: string;
  updatedAt: string;
}

export interface DeletedPost {
  id: string;
  status: PostStatus;
  deletedAt: string;
}

export interface SelectionTarget {
  id: string;
  debateId: string;
  creatorId: string;
  sourceType: SelectionSource;
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  createdAt?: string;
}

export interface Consensus {
  id: string;
  debateId: string;
  selectionTargetId: string | null;
  creatorId: string;
  title: string;
  content: string;
  status: ConsensusStatus;
  resultSummary?: string | null;
  createdAt?: string;
  updatedAt?: string;
  selectionTarget?: Pick<SelectionTarget, 'id' | 'selectedText'>;
  creator?: {
    id: string;
    nickname: string;
  };
  approveCount?: number;
  rejectCount?: number;
  commentCount?: number;
}

export interface ConsensusVote {
  id: string;
  consensusId: string;
  userId: string;
  voteType: ConsensusVoteType;
  comment?: string | null;
  createdAt?: string;
  updatedAt: string;
  user?: {
    id: string;
    nickname: string;
  };
}

export interface Definition {
  id: string;
  term: string;
  content: string;
  scope: 'IN_DEBATE' | 'GLOBAL_REFERENCE';
  status: 'ACTIVE' | 'ARCHIVED';
  sourceDebateId: string;
  sourceConsensusId?: string | null;
  selectionTargetId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sourceDebate?: {
    id: string;
    title: string;
  };
  sourceConsensus?: {
    id: string;
    title: string;
    status: ConsensusStatus;
  } | null;
  selectionTarget?: {
    id: string;
    selectedText: string;
  } | null;
}

export interface CommentSelection {
  selectedText: string;
  startOffset: number;
  endOffset: number;
}

export interface Comment {
  id: string;
  debateId: string;
  postId: string;
  parentCommentId: string | null;
  authorId?: string;
  content: string;
  status: PostStatus;
  createdAt?: string;
  author?: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
  _count?: {
    replies: number;
  };
}
