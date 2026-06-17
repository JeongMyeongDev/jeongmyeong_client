import type { ConsensusStatus, DebateStance, DebateStatus, DebateType } from '../types/debate';

export const DEBATE_TYPE_LABELS: Record<DebateType, string> = {
  FREE: '자유토론',
  CONSENSUS: '합의토론',
  PROS_CONS: '찬반토론',
};

export const SHORT_DEBATE_TYPE_LABELS: Record<DebateType, string> = {
  FREE: '자유',
  CONSENSUS: '합의',
  PROS_CONS: '찬반',
};

export const DEBATE_STATUS_LABELS: Record<DebateStatus, string> = {
  OPEN: '진행중',
  CLOSED: '종료',
  ARCHIVED: '아카이브',
};

export const CONSENSUS_STATUS_LABELS: Record<ConsensusStatus, string> = {
  OPEN: '진행 중',
  APPROVED: '기준 정의 확정',
  REJECTED: '반려',
  CLOSED: '종료',
};

export const STANCE_LABELS: Record<DebateStance, string> = {
  PRO: '찬성',
  CON: '반대',
  NEUTRAL: '중립',
};

export const ALL_DEBATE_FILTER_LABEL = '전체';

export const DEBATE_TYPE_FILTER_ITEMS = [
  ALL_DEBATE_FILTER_LABEL,
  DEBATE_TYPE_LABELS.PROS_CONS,
  DEBATE_TYPE_LABELS.CONSENSUS,
  DEBATE_TYPE_LABELS.FREE,
] as const;

export const DEBATE_TYPE_FILTER_MAP: Partial<Record<string, DebateType>> = {
  [DEBATE_TYPE_LABELS.PROS_CONS]: 'PROS_CONS',
  [DEBATE_TYPE_LABELS.CONSENSUS]: 'CONSENSUS',
  [DEBATE_TYPE_LABELS.FREE]: 'FREE',
};

export const DEFAULT_DEBATE_TYPE: DebateType = 'FREE';
export const DEFAULT_CLOSE_CONDITION_TYPE = 'MANUAL' as const;
export const DEFAULT_CHILD_DEBATE_TYPE: DebateType = 'FREE';
