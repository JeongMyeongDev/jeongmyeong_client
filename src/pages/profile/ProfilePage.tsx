import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AccountManagementSection from '../../components/profile/AccountManagementSection';
import ProfileEditCard from '../../components/profile/ProfileEditCard';
import ProfileHeaderCard from '../../components/profile/ProfileHeaderCard';
import ProfileMenuRow from '../../components/profile/ProfileMenuRow';
import ProfileSection from '../../components/profile/ProfileSection';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import { sanitizePlainText } from '../../utils/textSanitizer';

type MenuRow = {
  label: string;
  action: () => void;
};

const TOAST_DURATION = 2500;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? '');
  const [profileError, setProfileError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname);
    setProfileImage(user.profileImage ?? '');
  }, [user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), TOAST_DURATION);
  };

  const handleStartEdit = () => {
    if (!user) return;
    setNickname(user.nickname);
    setProfileImage(user.profileImage ?? '');
    setProfileError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!user) return;
    setNickname(user.nickname);
    setProfileImage(user.profileImage ?? '');
    setProfileError('');
    setIsEditing(false);
  };

  const handleUpdateProfile = async () => {
    if (!user || isSaving) return;

    const sanitizedNickname = sanitizePlainText(nickname).trim();
    const trimmedProfileImage = profileImage.trim();

    if (!sanitizedNickname) {
      setProfileError('닉네임을 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setProfileError('');

    try {
      const { data } = await userService.updateMe({
        nickname: sanitizedNickname,
        profileImage: trimmedProfileImage || undefined,
      });
      setUser({ ...user, ...data.user });
      setIsEditing(false);
      showToast('프로필이 저장되었습니다.');
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      setProfileError(typeof message === 'string' ? message : '프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const activityRows = useMemo<MenuRow[]>(
    () => [
      { label: '내 토론', action: () => navigate(ROUTES.MY_DEBATES) },
      { label: '참여한 토론', action: () => navigate(ROUTES.PARTICIPATED_DEBATES) },
      { label: '알림', action: () => navigate(ROUTES.NOTIFICATIONS) },
      { label: '제재 내역', action: () => navigate(ROUTES.MY_SANCTIONS) },
    ],
    [navigate],
  );

  const settingRows = useMemo<MenuRow[]>(
    () => [
      { label: '알림 설정', action: () => navigate(ROUTES.NOTIFICATION_SETTINGS) },
      { label: '튜토리얼 다시 보기', action: () => navigate(ROUTES.ONBOARDING) },
    ],
    [navigate],
  );

  const adminRows = useMemo<MenuRow[]>(
    () => [{ label: '신고 관리', action: () => navigate(ROUTES.ADMIN_REPORTS) }],
    [navigate],
  );

  const handleLogout = async () => {
    if (isLogoutLoading || isDeleteLoading) return;

    setIsLogoutLoading(true);
    try {
      if (isAuthenticated) {
        await authService.logout();
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error(error);
      }
    } finally {
      localStorage.removeItem('accessToken');
      clearAuth();
      setIsLogoutLoading(false);
      navigate(ROUTES.LOGIN);
    }
  };

  const handleDeleteAccount = async () => {
    if (isLogoutLoading || isDeleteLoading) return;

    const confirmed = window.confirm(
      '정말 회원 탈퇴하시겠어요? 탈퇴 후에는 현재 계정으로 다시 로그인할 수 없습니다.',
    );
    if (!confirmed) return;

    setIsDeleteLoading(true);
    try {
      await userService.deleteMe();
      localStorage.removeItem('accessToken');
      clearAuth();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      showToast(typeof message === 'string' ? message : '회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <Wrapper>
        <TopSpacing />
        <FallbackText>로그인이 필요합니다.</FallbackText>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <TopSpacing />

      <ContentStack>
        <ProfileHeaderCard user={user} onEditClick={handleStartEdit} />

        {isEditing && (
          <ProfileEditCard
            nickname={nickname}
            profileImage={profileImage}
            isSaving={isSaving}
            errorMessage={profileError}
            onNicknameChange={(value) => setNickname(sanitizePlainText(value))}
            onProfileImageChange={setProfileImage}
            onCancel={handleCancelEdit}
            onSave={() => void handleUpdateProfile()}
          />
        )}

        <ProfileSection title="내 활동">
          {activityRows.map((row) => (
            <ProfileMenuRow key={row.label} label={row.label} onClick={row.action} />
          ))}
        </ProfileSection>

        <ProfileSection title="설정">
          {settingRows.map((row) => (
            <ProfileMenuRow key={row.label} label={row.label} onClick={row.action} />
          ))}
        </ProfileSection>

        {user.role === 'ADMIN' && (
          <ProfileSection title="관리자">
            {adminRows.map((row) => (
              <ProfileMenuRow key={row.label} label={row.label} onClick={row.action} />
            ))}
          </ProfileSection>
        )}

        <AccountManagementSection
          isLogoutLoading={isLogoutLoading}
          isDeleteLoading={isDeleteLoading}
          onLogout={() => void handleLogout()}
          onDeleteAccount={() => void handleDeleteAccount()}
        />
      </ContentStack>

      {toastMessage && <Toast>{toastMessage}</Toast>}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 0 var(--page-x) var(--page-bottom);
`;

const TopSpacing = styled.div`
  height: var(--page-top);
`;

const ContentStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 4.4vw, 20px);
`;

const FallbackText = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  text-align: center;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 999px;
  white-space: nowrap;
  z-index: 600;
  pointer-events: none;
`;

export default ProfilePage;
