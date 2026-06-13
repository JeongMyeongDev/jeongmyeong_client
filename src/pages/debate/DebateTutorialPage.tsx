import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import iconChat from '../../assets/icon_chat.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import { debateService } from '../../services/debateService';
import type { Debate } from '../../types/debate';

const GUIDE_ITEMS = [
  {
    step: '01',
    title: '의견을 먼저 남겨요',
    description: '아래 입력창에 내 생각을 적으면 토론 흐름에 의견 카드가 추가돼요.',
  },
  {
    step: '02',
    title: '댓글로 이어서 대화해요',
    description: '다른 사람의 의견을 누르면 답글을 달 수 있고, 멘션으로 누구에게 답하는지 보여줘요.',
  },
  {
    step: '03',
    title: '중요한 문장은 선택해요',
    description: '토론 중 기준이 될 문장을 선택하면 합의나 새 토론으로 확장할 수 있어요.',
  },
];

const BackIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2.2">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const DebateTutorialPage = () => {
  const navigate = useNavigate();
  const { id: debateId } = useParams();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!debateId) {
      setIsLoading(false);
      setErrorMessage('토론 정보를 찾을 수 없습니다.');
      return;
    }

    let isCurrent = true;

    const loadDebate = async () => {
      try {
        const { data } = await debateService.getById(debateId);
        if (isCurrent) {
          setDebate(data.debate);
          setErrorMessage('');
        }
      } catch {
        if (isCurrent) {
          setErrorMessage('토론 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void loadDebate();

    return () => {
      isCurrent = false;
    };
  }, [debateId]);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(', ');
    }
    return '토론 입장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  };

  const handleEnterDebate = async () => {
    if (!debateId || isEntering) return;

    setIsEntering(true);
    setErrorMessage('');
    try {
      await debateService.join(debateId);
      navigate(`/debate/${debateId}`, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsEntering(false);
    }
  };

  return (
    <Wrapper>
      <Header>
        <IconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
        <Logo src={logoSymbol} alt="정명" />
        <HeaderSpacer />
      </Header>

      <Hero>
        <Eyebrow>토론 참여 튜토리얼</Eyebrow>
        <Title>{debate?.title ?? '토론에 참여하기'}</Title>
        <Description>
          {debate?.description ?? '토론 화면에서 의견을 남기고, 답글을 달고, 중요한 문장을 선택하는 방법을 알려드릴게요.'}
        </Description>
      </Hero>

      <PreviewCard>
        <PreviewTop>
          <PreviewLabel>토론 화면 미리보기</PreviewLabel>
          <PreviewIcon src={iconChat} alt="" />
        </PreviewTop>
        <MessageCard $active>
          <MessageMeta>#1 사용자 이름</MessageMeta>
          <MessageText>내 의견을 입력하면 이렇게 토론 흐름에 표시돼요.</MessageText>
        </MessageCard>
        <ReplyCard>
          <MessageMeta>@사용자이름</MessageMeta>
          <MessageText>댓글은 대화처럼 이어지고, 답글 대상은 멘션으로 보여요.</MessageText>
        </ReplyCard>
      </PreviewCard>

      <GuideList>
        {GUIDE_ITEMS.map((item) => (
          <GuideCard key={item.step}>
            <Step>{item.step}</Step>
            <GuideTextWrap>
              <GuideTitle>{item.title}</GuideTitle>
              <GuideDescription>{item.description}</GuideDescription>
            </GuideTextWrap>
          </GuideCard>
        ))}
      </GuideList>

      {isLoading && <StatusText>튜토리얼을 준비하고 있어요...</StatusText>}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      <BottomAction>
        <EnterButton type="button" onClick={() => void handleEnterDebate()} disabled={isEntering || !debateId}>
          {isEntering ? '입장 중...' : '토론 시작하기'}
        </EnterButton>
      </BottomAction>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: clamp(20px, 5.6vw, 24px) var(--page-x) calc(clamp(92px, 24vw, 104px) + env(safe-area-inset-bottom));
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: var(--tap-size) 1fr var(--tap-size);
  align-items: center;
  margin-bottom: clamp(20px, 6vw, 26px);
`;

const IconButton = styled.button`
  width: var(--tap-size);
  height: var(--tap-size);
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  justify-self: center;
`;

const HeaderSpacer = styled.div``;

const Hero = styled.section`
  margin-bottom: clamp(16px, 4.7vw, 20px);
`;

const Eyebrow = styled.p`
  margin: 0 0 8px;
  color: #2dcd97;
  font-size: var(--body-sm);
  font-weight: 800;
`;

const Title = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: var(--title-md);
  font-weight: 800;
  line-height: 1.3;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const Description = styled.p`
  margin: 10px 0 0;
  color: #8f8f8f;
  font-size: var(--body-md);
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const PreviewCard = styled.section`
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: clamp(16px, 4.7vw, 20px);
  box-shadow: 0 12px 24px rgba(48, 48, 48, 0.05);
  margin-bottom: clamp(16px, 4.7vw, 20px);
`;

const PreviewTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const PreviewLabel = styled.p`
  margin: 0;
  color: #2f3238;
  font-size: var(--body-md);
  font-weight: 800;
`;

const PreviewIcon = styled.img`
  width: clamp(46px, 13vw, 56px);
  height: clamp(46px, 13vw, 56px);
`;

const MessageCard = styled.div<{ $active?: boolean }>`
  border-radius: 18px;
  background: ${({ $active }) => ($active ? '#ecfff8' : '#f7f7f7')};
  border: 1px solid ${({ $active }) => ($active ? '#c8f7e6' : '#eeeeee')};
  padding: 12px 14px;
`;

const ReplyCard = styled(MessageCard)`
  width: calc(100% - clamp(28px, 8.4vw, 36px));
  margin: 10px 0 0 auto;
  background: #f9f9f9;
`;

const MessageMeta = styled.p`
  margin: 0 0 6px;
  color: #aeaeae;
  font-size: var(--body-sm);
  font-weight: 700;
`;

const MessageText = styled.p`
  margin: 0;
  color: #3d3f45;
  font-size: var(--body-sm);
  line-height: 1.45;
  word-break: keep-all;
`;

const GuideList = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GuideCard = styled.article`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 20px;
  background: #ffffff;
  padding: 14px;
`;

const Step = styled.span`
  min-width: clamp(38px, 10.2vw, 44px);
  height: clamp(30px, 7.9vw, 34px);
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--body-sm);
  font-weight: 800;
`;

const GuideTextWrap = styled.div`
  min-width: 0;
`;

const GuideTitle = styled.h2`
  margin: 0;
  color: #2f3238;
  font-size: var(--body-md);
  font-weight: 800;
`;

const GuideDescription = styled.p`
  margin: 6px 0 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
  word-break: keep-all;
`;

const StatusText = styled.p`
  margin: 14px 0 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  text-align: center;
`;

const ErrorText = styled.p`
  margin: 14px 0 0;
  color: #f04444;
  font-size: var(--body-sm);
  text-align: center;
`;

const BottomAction = styled.div`
  position: fixed;
  left: 50%;
  bottom: 0;
  width: min(100%, var(--app-max-width));
  transform: translateX(-50%);
  padding: clamp(12px, 3.7vw, 16px) var(--page-x) max(clamp(12px, 3.7vw, 16px), env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, #f5f5f5 28%, #f5f5f5 100%);
`;

const EnterButton = styled.button`
  width: 100%;
  height: clamp(50px, 13vw, 56px);
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--title-sm);
  font-weight: 800;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default DebateTutorialPage;
