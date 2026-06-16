export type DebateType = "FREE" | "CONSENSUS" | "PROS_CONS";
export type DebateStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type DebateStance = "PRO" | "CON" | "NEUTRAL";
export type PostStatus = "VISIBLE" | "HIDDEN" | "DELETED";
export type SelectionSource = "POST" | "COMMENT";
export type ConsensusStatus = "OPEN" | "APPROVED" | "REJECTED" | "CLOSED";
export type ConsensusVoteType = "APPROVE" | "REJECT" | "COMMENT";
export type DefinitionScope = "IN_DEBATE" | "GLOBAL_REFERENCE";
export type DefinitionStatus = "ACTIVE" | "ARCHIVED";
export type DefinitionReferenceType = "DEBATE_STANDARD" | "GLOBAL_REFERENCE";

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
  parentDebateId?: string | null;
  sourceSelectionTargetId?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  archivedAt?: string | null;

  resultSummary?: string | null;
  stanceDistribution?: StanceSummary | null;

  tags?: DebateTag[];
  tagMaps?: Array<{ tag: DebateTag }>;
  creator?: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
  participants?: Array<{
    id: string;
    joinedAt?: string;
    roleInDebate?: "CREATOR" | "PARTICIPANT" | "MODERATOR";
    user: {
      id: string;
      nickname: string;
      profileImage?: string | null;
    };
  }>;
  definitions?: DebateDefinition[];
  participantCount?: number;
  isBookmarked?: boolean;
  isSubscribed?: boolean;
  isParticipant?: boolean;
  myParticipant?: {
    id: string;
    debateId: string;
    userId: string;
    joinedAt?: string;
    lastReadAt?: string | null;
    roleInDebate?: "CREATOR" | "PARTICIPANT" | "MODERATOR";
    user: {
      id: string;
      nickname: string;
      profileImage?: string | null;
    };
  } | null;
  sourceSelectionTarget?: SelectionTarget;

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
  terms?: Array<{
    id: string;
    normalizedTerm: string;
    originalTerm: string;
  }>;
}

export type Definition = DebateDefinition;

export interface DefinitionReference {
  id: string;
  debateId: string;
  postId?: string | null;
  commentId?: string | null;
  definitionId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  referenceType: DefinitionReferenceType;
  createdAt?: string;
  definition: Definition;
}

export interface DefinitionReferenceInput {
  definitionId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  referenceType: DefinitionReferenceType;
}

export interface DebateMessage {
  id: string;
  debateId: string;
  content: string;
  stance?: DebateStance | null;
  status: PostStatus;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    nickname: string;
    profileImage?: string | null;
  };
  definitionReferences?: DefinitionReference[];
}

export interface CreatedPost {
  id: string;
  debateId: string;
  authorId: string;
  content: string;
  stance?: DebateStance | null;
  status: PostStatus;
  createdAt?: string;
  definitionReferences?: DefinitionReference[];
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

export interface DebateParentResponse {
  parentDebate: Debate | null;
  selectedText: string | null;
  sourceSelectionTarget?: SelectionTarget | null;
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

export interface DebateProgress {
  isBlocked: boolean;
  blockingType: "CONSENSUS" | "CHILD_DEBATE" | "BOTH" | null;
  blockingConsensus?: Pick<Consensus, "id" | "term" | "title" | "status" | "createdAt"> & {
    selectionTarget?: Pick<SelectionTarget, "id" | "selectedText"> | null;
  } | null;
  blockingChildDebate?: Pick<Debate, "id" | "title" | "status" | "createdAt"> & {
    sourceSelectionTarget?: Pick<SelectionTarget, "id" | "selectedText"> | null;
  } | null;
}

export interface DebateUserStance {
  id: string;
  debateId: string;
  userId: string;
  stance: DebateStance;
  updatedAt?: string;
}

export interface StanceSummary {
  PRO: number;
  CON: number;
  NEUTRAL: number;
  total: number;
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
  definitionReferences?: DefinitionReference[];
}
