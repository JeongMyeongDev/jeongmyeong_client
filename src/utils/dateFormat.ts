import { MESSAGES } from '../constants/messages';

export const formatDateLabel = (createdAt?: string) => {
  if (!createdAt) return MESSAGES.NO_DATE_INFO;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return MESSAGES.NO_DATE_INFO;
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}`;
};

export const formatRelativeTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return MESSAGES.NO_DATE_INFO;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
};
