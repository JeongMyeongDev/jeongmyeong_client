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
  background: #f5f5f5;
  padding: 0 14px 90px;

  @media (max-width: 375px) {
    padding: 0 12px 78px;
  }
`;

const TopSpacing = styled.div`
  height: 62px;

  @media (max-width: 375px) {
    height: 44px;
  }
`;

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;

  @media (max-width: 375px) {
    gap: 12px;
  }
`;

const Avatar = styled.div`
  width: 148px;
  height: 148px;
  border-radius: 50%;
  background: #d4d4d6;
  flex-shrink: 0;

  @media (max-width: 375px) {
    width: 112px;
    height: 112px;
  }
`;

const NameWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Name = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2f3238;
`;

const SubText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8f8f8f;
`;

const AuthActionRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
`;

const SignUpButton = styled.button`
  flex: 1;
  height: 54px;
  border-radius: 999px;
  border: 1.5px solid #1b1b1b;
  background: #f5f5f5;
  color: #2f3238;
  font-size: 18px;
  font-weight: 700;

  @media (max-width: 375px) {
    height: 48px;
    font-size: 16px;
  }
`;

const LoginButton = styled.button`
  flex: 1;
  height: 54px;
  border-radius: 999px;
  border: none;
  background: #2dcd97;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;

  @media (max-width: 375px) {
    height: 48px;
    font-size: 16px;
  }
`;

const ProfileEditCard = styled.section`
  background: #efefef;
  border-radius: 24px;
  padding: 16px;
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
  font-size: 14px;
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
  border-radius: 24px;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MenuItem = styled.button`
  text-align: left;
  border: none;
  background: transparent;
  color: #8f8f8f;
  font-size: 14px;
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
  margin: 32px auto 0;
  border: none;
  background: transparent;
  color: #d84c4c;
  font-size: 18px;
  text-decoration: underline;
  text-underline-offset: 4px;

  &:disabled {
    opacity: 0.6;
  }
`;

export default ProfilePage;
