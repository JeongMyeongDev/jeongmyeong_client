import { ROUTES } from './routes';

export const TEMPORARY_MAIN_CATEGORY_LABELS = [
  '전체',
  '예술',
  '생활',
  '요리',
  '게임',
  '스포츠',
  '정치',
] as const;

export const NAV_LABELS = {
  HOME: '홈',
  DEBATE_ROOM: '토론방',
  ARCHIVE: '아카이브',
  MY_DEBATES: '내 토론',
  PROFILE: '프로필',
  NOTIFICATIONS: '알림',
  DEFINITIONS: '정의 검색',
} as const;

export const SIDE_DRAWER_ITEMS = [
  { label: NAV_LABELS.HOME, path: ROUTES.HOME },
  { label: NAV_LABELS.DEBATE_ROOM, path: ROUTES.DEBATE_ROOM },
  { label: NAV_LABELS.ARCHIVE, path: ROUTES.DEBATE_ARCHIVE },
  { label: NAV_LABELS.MY_DEBATES, path: ROUTES.MY_DEBATES },
  { label: NAV_LABELS.PROFILE, path: ROUTES.PROFILE },
] as const;
