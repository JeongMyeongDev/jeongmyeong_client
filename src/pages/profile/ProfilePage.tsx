import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';

type MenuItem = { label: string; action: 'navigate' | 'toast'; value?: string };
const MENU_ITEMS: MenuItem[] = [
  { label: '내 토론', action: 'navigate', value: '/my-debates' },
  { label: '고객센터', action: 'toast' },
  { label: '알림설정', action: 'navigate', value: '/notifications' },
  { label: '개인/보안', action: 'toast' },
  { label: '공지사항', action: 'toast' },
  { label: '앱 정보', action: 'toast' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [profileError, setProfileError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const displayName = isAuthenticated ? user?.nickname ?? '사용자' : '사용자 이름';
  const helperText = isAuthenticated
    ? `${user?.nickname ?? '사용자'}님 환영합니다.`
    : '로그인을 먼저 진행해주세요.';

  useEffect(() => {
    setNickname(user?.nickname ?? '');
  }, [user?.nickname]);

  const handleUpdateProfile = async () => {
    if (!isAuthenticated || !user || !nickname.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const { data } = await userService.updateMe({ nickname: nickname.trim() });
      setUser({ ...user, ...data.user });
      setProfileError('');
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message;
        setProfileError(Array.isArray(message) ? message.join(', ') : message ?? '프로필 수정에 실패했습니다.');
      } else {
        setProfileError('프로필 수정에 실패했습니다.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.action === 'navigate' && item.value) {
      navigate(item.value);
    } else {
      showToast('준비 중입니다.');
    }
  };

  const handleLogout = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
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
      setIsSubmitting(false);
      navigate('/login');
    }
  };

  return (
    <Wrapper>
      <TopSpacing />

      <ProfileRow>
        <Avatar />
        <NameWrap>
          <Name>{displayName}</Name>
          <SubText>{helperText}</SubText>
        </NameWrap>
      </ProfileRow>

      {!isAuthenticated && (
        <AuthActionRow>
          <SignUpButton type="button" onClick={() => navigate('/signup')}>
            회원가입
          </SignUpButton>
          <LoginButton type="button" onClick={() => navigate('/login')}>
            로그인
          </LoginButton>
        </AuthActionRow>
      )}

      {isAuthenticated && (
        <ProfileEditCard>
          <ProfileInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
          />
          <SaveButton
            type="button"
            onClick={() => void handleUpdateProfile()}
            disabled={isSaving || !nickname.trim()}
          >
            {isSaving ? '저장 중...' : '프로필 저장'}
          </SaveButton>
          {profileError && <ErrorText>{profileError}</ErrorText>}
        </ProfileEditCard>
      )}

      <MenuCard>
        {MENU_ITEMS.map((item) => (
          <MenuItem key={item.label} onClick={() => handleMenuClick(item)}>
            {item.label}
          </MenuItem>
        ))}
      </MenuCard>

      {toastMessage && <Toast>{toastMessage}</Toast>}

      {isAuthenticated && (
        <LogoutButton type="button" onClick={handleLogout} disabled={isSubmitting}>
          로그아웃
        </LogoutButton>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: var(--color-bg);
  padding: 0 var(--page-x) var(--page-bottom);
`;

const TopSpacing = styled.div`
  height: var(--page-top);
`;

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(12px, 3.7vw, 16px);
  margin-bottom: clamp(16px, 4.2vw, 18px);
`;

const Avatar = styled.div`
  width: clamp(112px, 34.4vw, 148px);
  height: clamp(112px, 34.4vw, 148px);
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
`;

const NameWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Name = styled.h1`
  margin: 0;
  font-size: var(--title-sm);
  font-weight: 700;
  color: var(--color-text-main);
`;

const SubText = styled.p`
  margin: 0;
  font-size: var(--body-sm);
  color: var(--color-text-sub);
`;

const AuthActionRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
`;

const SignUpButton = styled.button`
  flex: 1;
  height: clamp(48px, 12.6vw, 54px);
  border-radius: 999px;
  border: 1.5px solid var(--color-text-main);
  background: transparent;
  color: var(--color-text-main);
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
`;

const LoginButton = styled.button`
  flex: 1;
  height: clamp(48px, 12.6vw, 54px);
  border-radius: 999px;
  border: none;
  background: var(--color-primary);
  color: #ffffff;
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
  transition: transform 0.2s, background-color 0.2s;

  &:active {
    transform: scale(0.98);
    background: var(--color-primary-hover);
  }
`;

const ProfileEditCard = styled.section`
  background: var(--color-surface);
  border-radius: var(--card-radius);
  padding: clamp(14px, 3.7vw, 16px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-sm);
`;

const ProfileInput = styled.input`
  height: 44px;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg);
  padding: 0 14px;
  font-size: var(--body-sm);
  outline: none;
  color: var(--color-text-main);
`;

const SaveButton = styled.button`
  height: 44px;
  border: none;
  border-radius: 999px;
  background: var(--color-primary);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  transition: transform 0.2s, background-color 0.2s;

  &:active {
    transform: scale(0.98);
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.65;
    transform: none;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #f04444;
`;

const MenuCard = styled.section`
  background: var(--color-surface);
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.7vw, 20px) clamp(16px, 4.2vw, 18px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-sm);
`;

const MenuItem = styled.button`
  text-align: left;
  border: none;
  background: transparent;
  color: var(--color-text-main);
  font-size: var(--body-sm);
  font-weight: 500;
  line-height: 1.45;
  padding: 8px 4px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.6;
  }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 999px;
  white-space: nowrap;
  z-index: 600;
  pointer-events: none;
`;

const LogoutButton = styled.button`
  display: block;
  margin: clamp(26px, 7.4vw, 32px) auto 0;
  border: none;
  background: transparent;
  color: #d84c4c;
  font-size: clamp(16px, 4.2vw, 18px);
  text-decoration: underline;
  text-underline-offset: 4px;

  &:disabled {
    opacity: 0.6;
  }
`;

export default ProfilePage;
