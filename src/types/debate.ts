export type DebateSide = 'PROS' | 'CONS';

export type DebateStatus = 'WAITING' | 'IN_PROGRESS' | 'ENDED';

export interface Debate {
  id: string;
  title: string;
  topic: string;
  status: DebateStatus;
  prosCount: number;
  consCount: number;
  createdAt: string;
  createdBy: string;
}

export interface DebateMessage {
  id: string;
  debateId: string;
  senderId: string;
  senderNickname: string;
  side: DebateSide;
  content: string;
  createdAt: string;
}
