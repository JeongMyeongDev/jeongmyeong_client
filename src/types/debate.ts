export type DebateType = "FREE" | "CONSENSUS" | "PROS_CONS";
export type DebateStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type PostStatus = "VISIBLE" | "HIDDEN" | "DELETED";
export type SelectionSource = "POST" | "COMMENT";
export type ConsensusStatus = "OPEN" | "APPROVED" | "REJECTED" | "CLOSED";
export type ConsensusVoteType = "APPROVE" | "REJECT" | "COMMENT";
export type DefinitionScope = "IN_DEBATE" | "GLOBAL_REFERENCE";
export type DefinitionStatus = "ACTIVE" | "ARCHIVED";

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
  tagMaps?: Array<{ tag: DebateTag }>;
  creator?: {
    id: string;
    nickname: string;
  };
  definitions?: DebateDefinition[];
  participantCount?: number;
}

export interface DebateDefinition {
  id: string;
  term: string;
  content: string;
  scope?: DefinitionScope;
  status?: DefinitionStatus;
  sourceDebateId?: string;
  sourceConsensusId?: string | null;
  selectionTargetId?: string | null;
  createdAt?: string;
  sourceDebate?: {
    id: string;
    title: string;
  };
  sourceConsensus?: {
    id: string;
    title: string;
    status: ConsensusStatus;
  } | null;
  creator?: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
}

export type Definition = DebateDefinition;

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
  creatorId?: string;
  sourceType: SelectionSource;
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  creator?: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
  createdAt?: string;
}

export interface Consensus {
  id: string;
  debateId: string;
  selectionTargetId: string | null;
  creatorId: string;
  term: string;
  title: string;
  content: string;
  status: ConsensusStatus;
  resultSummary?: string | null;
  approvedAt?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  approveCount?: number;
  rejectCount?: number;
  commentCount?: number;
  myVote?: ConsensusVote | null;
  creator?: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
  selectionTarget?: SelectionTarget;
  votes?: ConsensusVote[];
}

export interface ConsensusVote {
  id: string;
  consensusId: string;
  userId: string;
  voteType: ConsensusVoteType;
  comment?: string | null;
  updatedAt: string;
  user?: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
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
