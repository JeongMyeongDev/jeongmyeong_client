import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import { usePageLoading } from '../../hooks/usePageLoading';
import { sanitizePlainText } from '../../utils/textSanitizer';

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
  const { isLoading, error, executeAsync } = usePageLoading();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [profileError, setProfileError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const displayName = isAuthenticated ? user?.nickname ?? '사용자' : '사용자 이름';
  const helperText = isAuthenticated
    ? `${user?.nickname ?? '사용자'}님 환영합니다.`
    : '로그인을 먼저 진행해주세요.';

  useEffect(() => {
    const timer = window.setTimeout(() => setNickname(user?.nickname ?? ''), 0);
    return () => window.clearTimeout(timer);
  }, [user?.nickname]);

  const handleUpdateProfile = async () => {
    if (!isAuthenticated || !user || !nickname.trim() || isLoading) return;

    const result = await executeAsync(async () => {
      const { data } = await userService.updateMe({ nickname: nickname.trim() });
      return data;
    });
    
    if (result) {
      setUser({ ...user, ...result.user });
      setProfileError('');
      setToastMessage('프로필이 저장되었습니다.');
      setTimeout(() => setToastMessage(''), 2500);
    } else if (error) {
      setProfileError(error);
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
    if (isLogoutLoading) return;

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
            onChange={(e) => setNickname(sanitizePlainText(e.target.value))}
            placeholder="닉네임"
            disabled={isLoading}
          />
          <SaveButton
            type="button"
            onClick={() => void handleUpdateProfile()}
            disabled={isLoading || !nickname.trim()}
          >
            {isLoading ? '저장 중...' : '프로필 저장'}
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
        <LogoutButton type="button" onClick={handleLogout} disabled={isLogoutLoading}>
          {isLogoutLoading ? '로그아웃 중...' : '로그아웃'}
        </LogoutButton>
      )}
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
  background: #d4d4d6;
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
  color: #2f3238;
`;

const SubText = styled.p`
  margin: 0;
  font-size: var(--body-sm);
  color: #8f8f8f;
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
  border: 1.5px solid #1b1b1b;
  background: #f5f5f5;
  color: #2f3238;
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
`;

const LoginButton = styled.button`
  flex: 1;
  height: clamp(48px, 12.6vw, 54px);
  border-radius: 999px;
  border: none;
  background: #2dcd97;
  color: #ffffff;
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
`;

const ProfileEditCard = styled.section`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: clamp(14px, 3.7vw, 16px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
`;

const ProfileInput = styled.input`
  height: 44px;
  border: 1.5px solid #c8c8c8;
  border-radius: 999px;
  background: #ffffff;
  padding: 0 14px;
  font-size: var(--body-sm);
  outline: none;
`;

const SaveButton = styled.button`
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;

  &:disabled {
    opacity: 0.65;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #f04444;
`;

const MenuCard = styled.section`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.7vw, 20px) clamp(16px, 4.2vw, 18px);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MenuItem = styled.button`
  text-align: left;
  border: none;
  background: transparent;
  color: #8f8f8f;
  font-size: var(--body-sm);
  font-weight: 500;
  line-height: 1.45;
  padding: 0;
  cursor: pointer;
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
