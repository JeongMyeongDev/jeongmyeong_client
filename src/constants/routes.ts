export const ROUTES = {
  HOME: '/',
  DEBATE_ROOM: '/debate-room',
  DEBATE_CREATE: '/debate/create',
  DEBATE_ARCHIVE: '/debate/archive',
  DEBATE_DETAIL: '/debate/:id',
  DEBATE_INFO: '/debate/:id/info',
  DEFINITIONS: '/definitions',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_SETTINGS: '/notification-settings',
  MY_DEBATES: '/my-debates',
  PARTICIPATED_DEBATES: '/participated-debates',
  MY_SANCTIONS: '/my-sanctions',
  ADMIN_REPORTS: '/admin/reports',
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
} as const;

export const debateThreadPath = (id: string) => `/debate/${id}`;
export const debateInfoPath = (id: string) => `/debate/${id}/info`;
export const loginExpiredPath = () => `${ROUTES.LOGIN}?expired=1`;

export const shouldHideBottomNav = (pathname: string) => {
  const isDebateThread = /^\/debate\/(?!archive$|create$)[^/]+$/.test(pathname);
  return (
    pathname.startsWith(ROUTES.DEBATE_CREATE) ||
    pathname === ROUTES.ADMIN_REPORTS ||
    pathname.endsWith('/info') ||
    pathname === ROUTES.ONBOARDING ||
    isDebateThread
  );
};
