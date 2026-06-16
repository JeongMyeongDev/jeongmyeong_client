const DELETED_USER_NICKNAME_PATTERN = /^deleted_user_[a-z0-9]+_\d+$/i;

export const isDeletedUserNickname = (nickname?: string | null) =>
  Boolean(nickname && DELETED_USER_NICKNAME_PATTERN.test(nickname));

export const getDisplayNickname = (
  nickname?: string | null,
  fallback = '사용자',
) => {
  if (isDeletedUserNickname(nickname)) return '탈퇴한 사용자';
  const trimmed = nickname?.trim();
  return trimmed || fallback;
};

export const getNicknameInitial = (nickname?: string | null) =>
  getDisplayNickname(nickname)[0] ?? '사';
