import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LoadingContent } from '../../components/common/LoadingContent';
import { userService } from '../../services/userService';

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingUI, setShowLoadingUI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoadingUI(true), 200);

    const loadSettings = async () => {
      setErrorMessage('');

      try {
        const { data } = await userService.getMySettings();
        setNotificationsEnabled(data.notificationsEnabled);
      } catch (error) {
        const message = isAxiosError(error) ? error.response?.data?.message : null;
        setErrorMessage(
          typeof message === 'string' ? message : '알림 설정을 불러오지 못했습니다.',
        );
      } finally {
        window.clearTimeout(timer);
        setIsLoading(false);
        setShowLoadingUI(false);
      }
    };

    void loadSettings();

    return () => window.clearTimeout(timer);
  }, []);

  const handleToggle = async () => {
    if (isLoading || isSaving) return;

    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data } = await userService.updateMySettings({
        notificationsEnabled: nextValue,
      });
      setNotificationsEnabled(data.notificationsEnabled);
      setSuccessMessage('알림 설정이 저장되었습니다.');
    } catch (error) {
      setNotificationsEnabled(!nextValue);
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      setErrorMessage(
        typeof message === 'string' ? message : '알림 설정 저장에 실패했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Wrapper>
      <TopBar>
        <BackButton type="button" onClick={() => navigate(-1)} aria-label="뒤로">
          <BackIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="20" y1="12" x2="4" y2="12" />
            <polyline points="10 6 4 12 10 18" />
          </BackIcon>
        </BackButton>
        <TopTitle>알림 설정</TopTitle>
      </TopBar>

      <LoadingContent
        isLoading={isLoading}
        showLoadingUI={showLoadingUI}
        skeleton={<SettingsSkeleton />}
      >
        <Content>
          <SettingsCard>
            <SettingText>
              <SettingTitle>알림 받기</SettingTitle>
              <SettingDescription>
                토론 활동과 관련된 알림을 받을지 설정합니다.
              </SettingDescription>
            </SettingText>
            <SwitchButton
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="알림 받기"
              $checked={notificationsEnabled}
              disabled={isSaving}
              onClick={() => void handleToggle()}
            >
              <SwitchKnob $checked={notificationsEnabled} />
            </SwitchButton>
          </SettingsCard>

          {isSaving && <FeedbackText>저장 중입니다...</FeedbackText>}
          {errorMessage && <FeedbackText $error>{errorMessage}</FeedbackText>}
          {successMessage && !errorMessage && <FeedbackText $success>{successMessage}</FeedbackText>}
        </Content>
      </LoadingContent>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 32px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  gap: 8px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #353535;
  flex-shrink: 0;
`;

const BackIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const TopTitle = styled.h1`
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
`;

const Content = styled.div`
  padding: 16px;
`;

const SettingsCard = styled.section`
  min-height: 76px;
  background: #fff;
  border-radius: var(--card-radius);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const SettingText = styled.div`
  min-width: 0;
`;

const SettingTitle = styled.h2`
  margin: 0;
  color: #2f3238;
  font-size: var(--body-md);
  font-weight: 700;
`;

const SettingDescription = styled.p`
  margin: 6px 0 0;
  color: #8f8f8f;
  font-size: var(--body-xs);
  line-height: 1.4;
`;

const SwitchButton = styled.button<{ $checked: boolean }>`
  width: 52px;
  height: 30px;
  border: none;
  border-radius: 999px;
  padding: 3px;
  background: ${({ $checked }) => ($checked ? '#2dcd97' : '#d7d7d7')};
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 160ms ease;

  &:disabled {
    opacity: 0.65;
    cursor: default;
  }
`;

const SwitchKnob = styled.span<{ $checked: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18);
  transform: translateX(${({ $checked }) => ($checked ? '22px' : '0')});
  transition: transform 160ms ease;
`;

const FeedbackText = styled.p<{ $error?: boolean; $success?: boolean }>`
  margin: 12px 2px 0;
  color: ${({ $error, $success }) => {
    if ($error) return '#f04444';
    if ($success) return '#2dcd97';
    return '#8f8f8f';
  }};
  font-size: 13px;
  font-weight: 600;
`;

const SettingsSkeleton = () => (
  <Content>
    <SkeletonCard>
      <SkeletonText>
        <SkeletonLine $width="96px" />
        <SkeletonLine $width="210px" />
      </SkeletonText>
      <SkeletonToggle />
    </SkeletonCard>
  </Content>
);

const SkeletonCard = styled.div`
  min-height: 76px;
  background: #fff;
  border-radius: var(--card-radius);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const SkeletonText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SkeletonLine = styled.div<{ $width: string }>`
  width: ${({ $width }) => $width};
  max-width: 100%;
  height: 14px;
  border-radius: 999px;
  background: #ececec;
`;

const SkeletonToggle = styled.div`
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: #ececec;
  flex-shrink: 0;
`;

export default NotificationSettingsPage;
