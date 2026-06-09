export type DebateType = 'FREE' | 'CONSENSUS' | 'PROS_CONS';
export type DebateStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';
export type PostStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';
export type SelectionSource = 'POST' | 'COMMENT';
export type ConsensusStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';
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
  tagMaps?: Array<{ tag: DebateTag }>;
  creator?: {
    id: string;
    nickname: string;
  };
  definitions?: DebateDefinition[];
}

export interface DebateDefinition {
  id: string;
  term: string;
  content: string;
  createdAt?: string;
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
}

export interface ConsensusVote {
  id: string;
  consensusId: string;
  userId: string;
  voteType: ConsensusVoteType;
  comment?: string | null;
  updatedAt: string;
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
