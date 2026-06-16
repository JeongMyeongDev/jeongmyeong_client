export type ReportTargetType = 'DEBATE' | 'POST' | 'COMMENT' | 'CONSENSUS' | 'USER';
export type ReportReason =
  | 'SPAM'
  | 'ABUSE'
  | 'HATE'
  | 'SEXUAL'
  | 'VIOLENCE'
  | 'MISINFORMATION'
  | 'OFF_TOPIC'
  | 'ETC';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'ACTION_TAKEN' | 'REJECTED' | 'DUPLICATE';
export type SanctionType =
  | 'WARNING'
  | 'WRITE_RESTRICTION'
  | 'DEBATE_CREATE_RESTRICTION'
  | 'TEMP_SUSPENSION'
  | 'PERMANENT_SUSPENSION';
export type SanctionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type ContentAction = 'NONE' | 'HIDE' | 'DELETE' | 'RESTORE';

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  debateId?: string | null;
  reason: ReportReason;
  detail?: string | null;
  targetContentSnapshot?: string | null;
  status: ReportStatus;
  handledById?: string | null;
  handledAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  reporter?: { id: string; nickname: string; email?: string };
  sanctions?: Sanction[];
}

export interface Sanction {
  id: string;
  userId: string;
  reportId?: string | null;
  moderatorId: string;
  type: SanctionType;
  status: SanctionStatus;
  reason: string;
  startsAt: string;
  endsAt?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
  createdAt: string;
  acknowledgements?: Array<{ acknowledgedAt: string }>;
}
