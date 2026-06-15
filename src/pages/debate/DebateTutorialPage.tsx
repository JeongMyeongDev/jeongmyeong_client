import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import logoSymbol from '../../assets/logo_symbol.svg';
import { debateService } from '../../services/debateService';
import type { Debate } from '../../types/debate';

type TutorialTarget = 'topic' | 'input' | 'reply' | 'selection' | 'enter';

type TutorialStep = {
  target: TutorialTarget;
  title: string;
  description: string;
  actionText: string;
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: 'topic',
    title: '토론 주제를 먼저 확인해요',
    description: '상단 카드에서 오늘 토론할 주제와 설명을 확인할 수 있어요.',
    actionText: '주제 카드를 눌러보세요',
  },
  {
    target: 'input',
    title: '내 의견을 입력해요',
    description: '아래 입력창을 눌러 내 생각을 의견으로 남길 수 있어요.',
    actionText: '입력창을 눌러보세요',
  },
  {
    target: 'reply',
    title: '댓글로 대화를 이어가요',
    description: '다른 사람의 의견에 답하고 싶을 때는 댓글 버튼을 눌러요.',
    actionText: '댓글 버튼을 눌러보세요',
  },
  {
    target: 'selection',
    title: '중요한 문장은 선택해요',
    description: '기준이 될 만한 문장을 선택해서 합의나 새 토론으로 확장할 수 있어요.',
    actionText: '초록 문장을 눌러보세요',
  },
  {
    target: 'enter',
    title: '이제 토론에 입장해요',
    description: '튜토리얼을 마쳤어요. 실제 토론방으로 들어가 의견을 남겨보세요.',
    actionText: '토론 시작하기를 눌러보세요',
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
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hintMessage, setHintMessage] = useState('');

  const currentStep = TUTORIAL_STEPS[stepIndex];
  const isActive = (target: TutorialTarget) => currentStep.target === target;

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

  const goNext = () => {
    setHintMessage('');

    if (currentStep.target === 'enter') {
      void handleEnterDebate();
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
  };

  const handleDimClick = () => {
    setHintMessage('밝게 강조된 부분을 눌러 다음 단계로 넘어가요.');
  };

  const topicTitle = debate?.title ?? '토론에 참여하기';
  const topicDescription =
    debate?.description ?? '토론 화면에서 의견을 남기고, 댓글을 달고, 중요한 문장을 선택하는 방법을 연습해볼게요.';

  return (
    <Wrapper>
      <Header>
        <IconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
        <Logo src={logoSymbol} alt="정명" />
        <SkipButton type="button" onClick={() => void handleEnterDebate()} disabled={isEntering || !debateId}>
          건너뛰기
        </SkipButton>
      </Header>

      <CoachFrame aria-label="토론 참여 튜토리얼">
        <TopicCard type="button" $active={isActive('topic')} onClick={isActive('topic') ? goNext : undefined}>
          <TopicLabel>토론 주제</TopicLabel>
          <TopicTitle>{topicTitle}</TopicTitle>
          <TopicDescription>{topicDescription}</TopicDescription>
        </TopicCard>

        <ThreadPreview>
          <QuestionBubble>당신은 이 주제에 대해 어떤 생각을 가지고 있나요?</QuestionBubble>

          <PostCard>
            <PostMeta>#1 과자좋아</PostMeta>
            <PostContent>
              저는 먼저 근거를 짧게 정리한 다음, 다른 사람 의견을 보며 생각을 확장해요.
              <SelectionText $active={isActive('selection')} onClick={isActive('selection') ? goNext : undefined}>
                기준이 되는 문장은 이렇게 선택할 수 있어요.
              </SelectionText>
            </PostContent>
            <ReplyButton type="button" $active={isActive('reply')} onClick={isActive('reply') ? goNext : undefined}>
              댓글 달기
            </ReplyButton>
          </PostCard>

          <ReplyPreview>
            <PostMeta>@과자좋아</PostMeta>
            <PostContent>상대 의견에 답하면 멘션과 함께 댓글 흐름이 이어져요.</PostContent>
          </ReplyPreview>
        </ThreadPreview>

        <InputBar $active={isActive('input')} onClick={isActive('input') ? goNext : undefined}>
          <HashButton type="button">#</HashButton>
          <FakeInput>입력창을 눌러 의견을 남겨보세요</FakeInput>
          <SendButton type="button">보내기</SendButton>
        </InputBar>

        <EnterButton type="button" $active={isActive('enter')} onClick={isActive('enter') ? goNext : undefined} disabled={isEntering || !debateId}>
          {isEntering ? '입장 중...' : '토론 시작하기'}
        </EnterButton>

        <DimLayer onClick={handleDimClick} />

        <CoachMark $placement={currentStep.target === 'input' || currentStep.target === 'enter' ? 'top' : 'bottom'}>
          <StepCounter>
            {stepIndex + 1}/{TUTORIAL_STEPS.length}
          </StepCounter>
          <CoachTitle>{currentStep.title}</CoachTitle>
          <CoachDescription>{currentStep.description}</CoachDescription>
          <CoachAction>{hintMessage || currentStep.actionText}</CoachAction>
        </CoachMark>
      </CoachFrame>

      {isLoading && <StatusText>튜토리얼을 준비하고 있어요...</StatusText>}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
    </Wrapper>
  );
};

const activeSpotlight = css`
  position: relative;
  z-index: 5;
  pointer-events: auto;
  box-shadow: 0 0 0 4px rgba(45, 205, 151, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0);
  animation: pulseSpotlight 1.2s ease-in-out infinite;
`;

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: clamp(20px, 5.6vw, 24px) var(--page-x) clamp(22px, 6vw, 26px);

  @keyframes pulseSpotlight {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.015);
    }
  }
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: var(--tap-size) 1fr auto;
  align-items: center;
  margin-bottom: clamp(16px, 4.7vw, 20px);
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

const SkipButton = styled.button`
  min-width: 64px;
  height: 34px;
  border: none;
  background: transparent;
  color: #8f8f8f;
  font-size: var(--body-sm);
  font-weight: 700;

  &:disabled {
    opacity: 0.5;
  }
`;

const CoachFrame = styled.main`
  position: relative;
  min-height: calc(100dvh - clamp(86px, 24vw, 104px));
  border-radius: clamp(28px, 8.4vw, 36px);
  background: #ffffff;
  padding: clamp(16px, 4.7vw, 20px);
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(40, 40, 40, 0.08);
`;

const DimLayer = styled.button`
  position: absolute;
  inset: 0;
  z-index: 3;
  border: none;
  background: rgba(20, 20, 20, 0.72);
`;

const TopicCard = styled.button<{ $active: boolean }>`
  width: 100%;
  border: none;
  text-align: left;
  border-radius: 22px;
  background: #f7f7f7;
  padding: clamp(16px, 4.7vw, 20px);
  margin-bottom: clamp(14px, 3.7vw, 16px);
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  ${({ $active }) => $active && activeSpotlight}
`;

const TopicLabel = styled.p`
  margin: 0 0 8px;
  color: #2dcd97;
  font-size: var(--body-sm);
  font-weight: 800;
`;

const TopicTitle = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: var(--title-md);
  font-weight: 800;
  line-height: 1.3;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const TopicDescription = styled.p`
  margin: 8px 0 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ThreadPreview = styled.section`
  position: relative;
  min-height: clamp(340px, 82vw, 420px);
`;

const QuestionBubble = styled.div`
  width: 100%;
  border-radius: 22px;
  background: #f5f5f5;
  padding: 18px 16px;
  color: #9b9b9b;
  font-size: var(--body-sm);
  text-align: center;
  margin-bottom: 22px;
`;

const PostCard = styled.article`
  border-radius: 18px;
  background: #f8f8f8;
  padding: 14px;
  margin-bottom: 12px;
`;

const ReplyPreview = styled(PostCard)`
  width: calc(100% - clamp(32px, 10vw, 44px));
  margin-left: auto;
  background: #fbfbfb;
`;

const PostMeta = styled.p`
  margin: 0 0 8px;
  color: #aeaeae;
  font-size: var(--body-sm);
  font-weight: 700;
`;

const PostContent = styled.p`
  margin: 0;
  color: #3d3f45;
  font-size: var(--body-sm);
  line-height: 1.55;
  word-break: keep-all;
`;

const SelectionText = styled.span<{ $active: boolean }>`
  display: inline;
  border-radius: 8px;
  color: ${({ $active }) => ($active ? '#0aa971' : '#2dcd97')};
  background: ${({ $active }) => ($active ? '#e6fff5' : 'transparent')};
  font-weight: 800;
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  ${({ $active }) => $active && activeSpotlight}
`;

const ReplyButton = styled.button<{ $active: boolean }>`
  height: 34px;
  margin-top: 12px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1.5px solid #2dcd97;
  background: #ffffff;
  color: #2dcd97;
  font-size: var(--body-sm);
  font-weight: 800;
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  ${({ $active }) => $active && activeSpotlight}
`;

const InputBar = styled.div<{ $active: boolean }>`
  display: grid;
  grid-template-columns: 38px 1fr 58px;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  border-radius: 999px;
  background: #f3f3f3;
  padding: 6px;
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  ${({ $active }) => $active && activeSpotlight}
`;

const HashButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  color: #9f9f9f;
  font-size: 18px;
  font-weight: 800;
`;

const FakeInput = styled.div`
  min-width: 0;
  color: #b0b0b0;
  font-size: var(--body-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SendButton = styled.button`
  height: 36px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--body-sm);
  font-weight: 800;
`;

const EnterButton = styled.button<{ $active: boolean }>`
  width: 100%;
  height: clamp(50px, 13vw, 56px);
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--title-sm);
  font-weight: 800;
  margin-top: 14px;
  cursor: ${({ $active }) => ($active ? 'pointer' : 'default')};
  ${({ $active }) => $active && activeSpotlight}

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CoachMark = styled.aside<{ $placement: 'top' | 'bottom' }>`
  position: absolute;
  left: clamp(18px, 5.6vw, 24px);
  right: clamp(18px, 5.6vw, 24px);
  z-index: 6;
  border-radius: 24px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);

  ${({ $placement }) =>
    $placement === 'top'
      ? css`
          top: clamp(18px, 5.6vw, 24px);
        `
      : css`
          bottom: clamp(20px, 6vw, 26px);
        `}
`;

const StepCounter = styled.p`
  margin: 0 0 8px;
  color: #2dcd97;
  font-size: var(--body-sm);
  font-weight: 800;
`;

const CoachTitle = styled.h2`
  margin: 0;
  color: #2f3238;
  font-size: var(--title-sm);
  font-weight: 900;
`;

const CoachDescription = styled.p`
  margin: 8px 0 12px;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
  word-break: keep-all;
`;

const CoachAction = styled.p`
  margin: 0;
  color: #2dcd97;
  font-size: var(--body-md);
  font-weight: 900;
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

export default DebateTutorialPage;
