import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { isAxiosError } from 'axios';
import { useAuth } from '../../hooks/useAuth';

type MissionKey =
  | 'concept'
  | 'types'
  | 'selection'
  | 'consensus'
  | 'child'
  | 'lifecycle'
  | 'finish';

const MISSIONS: Array<{ key: MissionKey; title: string }> = [
  { key: 'concept', title: '정명의 토론 방식' },
  { key: 'types', title: '토론 유형 익히기' },
  { key: 'selection', title: '문장 선택하기' },
  { key: 'consensus', title: '합의안 만들기' },
  { key: 'child', title: '하위 토론 열기' },
  { key: 'lifecycle', title: '토론 상태 이해하기' },
  { key: 'finish', title: '시작 준비' },
];

const TYPE_CARDS = [
  {
    key: 'FREE',
    title: '자유토론',
    text: '비동기 의견과 답글로 자유롭게 흐름을 이어갑니다.',
  },
  {
    key: 'CONSENSUS',
    title: '합의토론',
    text: '합의안과 승인된 기준 정의가 토론의 중심이 됩니다.',
  },
  {
    key: 'PROS_CONS',
    title: '찬반토론',
    text: '찬성, 반대, 중립 입장을 고르고 근거를 쌓아갑니다.',
  },
];

const LIFECYCLE_ITEMS = [
  { key: 'OPEN', title: 'OPEN', text: '작성과 선택 액션을 사용할 수 있습니다.' },
  { key: 'CLOSED', title: 'CLOSED', text: '종료된 토론은 읽기 전용입니다.' },
  { key: 'ARCHIVED', title: 'ARCHIVED', text: '보존된 기록이며 계속 읽기 전용입니다.' },
];

const TARGET_PHRASE = '인공지능의 책임은 개발자에게 있다';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return '온보딩 완료 처리에 실패했습니다. 다시 시도해 주세요.';
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { completeOnboarding, user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [conceptTapped, setConceptTapped] = useState(false);
  const [visitedTypes, setVisitedTypes] = useState<string[]>([]);
  const [selectionDone, setSelectionDone] = useState(false);
  const [selectionMenuShown, setSelectionMenuShown] = useState(false);
  const [consensusTitle, setConsensusTitle] = useState('');
  const [consensusContent, setConsensusContent] = useState('');
  const [consensusSubmitted, setConsensusSubmitted] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childSubmitted, setChildSubmitted] = useState(false);
  const [visitedStatuses, setVisitedStatuses] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMission = MISSIONS[stepIndex];
  const progressLabel = `${stepIndex + 1} / ${MISSIONS.length}`;

  useEffect(() => {
    if (user?.hasCompletedOnboarding) {
      navigate('/', { replace: true });
    }
  }, [navigate, user?.hasCompletedOnboarding]);

  const canGoNext = useMemo(() => {
    switch (currentMission.key) {
      case 'concept':
        return conceptTapped;
      case 'types':
        return visitedTypes.length === TYPE_CARDS.length;
      case 'selection':
        return selectionDone && selectionMenuShown;
      case 'consensus':
        return consensusSubmitted;
      case 'child':
        return childSubmitted;
      case 'lifecycle':
        return visitedStatuses.length === LIFECYCLE_ITEMS.length;
      case 'finish':
        return true;
    }
  }, [
    childSubmitted,
    conceptTapped,
    consensusSubmitted,
    currentMission.key,
    selectionDone,
    selectionMenuShown,
    visitedStatuses.length,
    visitedTypes.length,
  ]);

  const goNext = () => {
    if (!canGoNext) return;
    setStepIndex((value) => Math.min(value + 1, MISSIONS.length - 1));
  };

  const finishOnboarding = async () => {
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    try {
      await completeOnboarding();
      navigate('/', { replace: true });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectionMouseUp = () => {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && TARGET_PHRASE.includes(selectedText)) {
      setSelectionDone(true);
      setSelectionMenuShown(true);
    }
  };

  const toggleVisited = (value: string, setter: (next: string[]) => void, current: string[]) => {
    if (current.includes(value)) return;
    setter([...current, value]);
  };

  const autofillConsensus = () => {
    setConsensusTitle('AI 책임 주체에 대한 합의안');
    setConsensusContent('AI가 만든 결과의 책임은 설계, 배포, 운영에 관여한 주체가 함께 검토해야 합니다.');
  };

  const autofillChild = () => {
    setChildTitle('AI 책임은 누가 나누어 져야 할까?');
  };

  const renderMission = () => {
    switch (currentMission.key) {
      case 'concept':
        return (
          <>
            <GuideText>
              정명에서는 토론 중 중요한 표현을 선택해 합의안이나 하위 토론으로 이어갈 수 있습니다.
            </GuideText>
            <FakeDebateCard
              type="button"
              $active={conceptTapped}
              aria-label="예시 토론 카드 선택"
              onClick={() => setConceptTapped(true)}
            >
              <StatusBadge>진행중</StatusBadge>
              <CardTitle>AI 시대의 책임은 어디에 있을까?</CardTitle>
              <CardText>의견에서 핵심 표현을 선택하면 더 깊은 논의로 확장됩니다.</CardText>
            </FakeDebateCard>
          </>
        );
      case 'types':
        return (
          <>
            <GuideText>세 가지 토론 유형을 모두 눌러 차이를 확인해 보세요.</GuideText>
            <CardGrid>
              {TYPE_CARDS.map((card) => {
                const active = visitedTypes.includes(card.key);
                return (
                  <TypeCard
                    key={card.key}
                    type="button"
                    $active={active}
                    onClick={() => toggleVisited(card.key, setVisitedTypes, visitedTypes)}
                  >
                    <CardTitle>{card.title}</CardTitle>
                    <CardText>{card.text}</CardText>
                  </TypeCard>
                );
              })}
            </CardGrid>
          </>
        );
      case 'selection':
        return (
          <>
            <GuideText>
              데스크톱에서는 문장을 드래그하고, 모바일에서는 강조된 문장을 눌러 선택 메뉴를 열 수 있습니다.
            </GuideText>
            <FakePost onMouseUp={handleSelectionMouseUp}>
              <strong>예시 의견</strong>
              <p>
                AI 기술은 빠르게 확산되고 있습니다.{' '}
                <SelectionPhrase
                  type="button"
                  onClick={() => {
                    setSelectionDone(true);
                    setSelectionMenuShown(true);
                  }}
                >
                  {TARGET_PHRASE}
                </SelectionPhrase>
                는 문장은 별도 합의가 필요합니다.
              </p>
            </FakePost>
            {selectionMenuShown && (
              <FloatingMenu aria-label="선택 액션 메뉴">
                <MenuChip type="button">합의안</MenuChip>
                <MenuChip type="button">하위 토론</MenuChip>
                <MenuChip type="button">복사</MenuChip>
              </FloatingMenu>
            )}
          </>
        );
      case 'consensus':
        return (
          <>
            <GuideText>선택한 문장을 바탕으로 가짜 합의안을 제출해 보세요.</GuideText>
            <SheetLike>
              <Quote>“{TARGET_PHRASE}”</Quote>
              <Label>용어</Label>
              <ReadonlyInput>{TARGET_PHRASE}</ReadonlyInput>
              <Label htmlFor="consensus-title">제목</Label>
              <TextInput
                id="consensus-title"
                value={consensusTitle}
                onChange={(event) => setConsensusTitle(event.target.value)}
                placeholder="합의안 제목"
              />
              <Label htmlFor="consensus-content">내용</Label>
              <TextArea
                id="consensus-content"
                value={consensusContent}
                onChange={(event) => setConsensusContent(event.target.value)}
                placeholder="합의할 정의나 설명"
              />
              <ActionRow>
                <SecondaryButton type="button" onClick={autofillConsensus}>
                  예시 채우기
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={() => setConsensusSubmitted(true)}
                  disabled={!consensusTitle.trim() || !consensusContent.trim()}
                >
                  제출
                </PrimaryButton>
              </ActionRow>
            </SheetLike>
            {consensusSubmitted && (
              <ResultCard>
                <StatusBadge>합의안</StatusBadge>
                <CardTitle>{consensusTitle}</CardTitle>
                <CardText>
                  승인된 합의안은 토론의 기준 정의가 되고 나중에 검색하거나 글에 연결할 수 있습니다.
                </CardText>
              </ResultCard>
            )}
          </>
        );
      case 'child':
        return (
          <>
            <GuideText>하위 토론은 부모 토론을 멈추지 않고 세부 쟁점을 분리해 다룹니다.</GuideText>
            <SheetLike>
              <Quote>{TARGET_PHRASE}</Quote>
              <Label htmlFor="child-title">하위 토론 제목</Label>
              <TextInput
                id="child-title"
                value={childTitle}
                onChange={(event) => setChildTitle(event.target.value)}
                placeholder="하위 토론 제목"
              />
              <ActionRow>
                <SecondaryButton type="button" onClick={autofillChild}>
                  예시 채우기
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={() => setChildSubmitted(true)}
                  disabled={!childTitle.trim()}
                >
                  만들기
                </PrimaryButton>
              </ActionRow>
            </SheetLike>
            {childSubmitted && (
              <ResultCard>
                <StatusBadge>하위 토론</StatusBadge>
                <CardTitle>{childTitle}</CardTitle>
                <CardText>연결된 하위 토론은 원문 근거와 함께 부모 토론에 표시됩니다.</CardText>
              </ResultCard>
            )}
          </>
        );
      case 'lifecycle':
        return (
          <>
            <GuideText>
              상태를 모두 눌러 보세요. 선택 원본으로 쓰인 글과 댓글은 수정이 제한될 수 있습니다.
            </GuideText>
            <LifecycleRow>
              {LIFECYCLE_ITEMS.map((item, index) => {
                const active = visitedStatuses.includes(item.key);
                return (
                  <StatusCard
                    key={item.key}
                    type="button"
                    $active={active}
                    onClick={() => toggleVisited(item.key, setVisitedStatuses, visitedStatuses)}
                  >
                    <StatusNumber>{index + 1}</StatusNumber>
                    <CardTitle>{item.title}</CardTitle>
                    <CardText>{item.text}</CardText>
                  </StatusCard>
                );
              })}
            </LifecycleRow>
          </>
        );
      case 'finish':
        return (
          <>
            <GuideText>
              이제 정명에서 토론을 만들고, 선택하고, 합의하고, 기록으로 남길 준비가 끝났습니다.
            </GuideText>
            {error && <ErrorText>{error}</ErrorText>}
            <FinishActions>
              <PrimaryButton type="button" onClick={finishOnboarding} disabled={isSubmitting}>
                {isSubmitting ? '완료 중...' : '정명 시작하기'}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={finishOnboarding} disabled={isSubmitting}>
                건너뛰기
              </SecondaryButton>
            </FinishActions>
          </>
        );
    }
  };

  return (
    <Wrapper>
      <ProgressText>{progressLabel}</ProgressText>
      <Title>{currentMission.title}</Title>
      <MissionPanel>{renderMission()}</MissionPanel>
      {currentMission.key !== 'finish' && (
        <Footer>
          <NextButton type="button" onClick={goNext} disabled={!canGoNext}>
            다음
          </NextButton>
        </Footer>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: clamp(26px, 7vw, 34px) var(--page-x) max(24px, env(safe-area-inset-bottom));
`;

const ProgressText = styled.p`
  margin: 0 0 8px;
  color: #2dcd97;
  font-size: var(--body-sm);
  font-weight: 700;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 18px;
  color: #2f3238;
  font-size: var(--title-lg);
  text-align: center;
  line-height: 1.2;
`;

const MissionPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const GuideText = styled.p`
  margin: 0;
  color: #777777;
  font-size: var(--body-md);
  line-height: 1.45;
  word-break: keep-all;
`;

const FakeDebateCard = styled.button<{ $active: boolean }>`
  width: 100%;
  border: 2px solid ${({ $active }) => ($active ? '#2dcd97' : 'transparent')};
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 18px;
  text-align: left;
`;

const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TypeCard = styled.button<{ $active: boolean }>`
  width: 100%;
  min-height: 96px;
  border: 2px solid ${({ $active }) => ($active ? '#2dcd97' : '#ffffff')};
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 16px;
  text-align: left;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 26px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2dcd97;
  font-size: 12px;
  font-weight: 700;
  padding: 0 10px;
  margin-bottom: 10px;
`;

const CardTitle = styled.strong`
  display: block;
  color: #333333;
  font-size: var(--title-sm);
  line-height: 1.3;
  margin-bottom: 6px;
`;

const CardText = styled.span`
  display: block;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
`;

const FakePost = styled.div`
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 16px;
  color: #555555;
  font-size: var(--body-md);
  line-height: 1.6;

  p {
    margin: 10px 0 0;
  }
`;

const SelectionPhrase = styled.button`
  border: none;
  border-radius: 4px;
  background: #d8f5ec;
  color: #2d8f73;
  font: inherit;
  padding: 2px 4px;
`;

const FloatingMenu = styled.div`
  align-self: center;
  display: flex;
  gap: 8px;
  border-radius: 999px;
  background: #ffffff;
  padding: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
`;

const MenuChip = styled.button`
  min-height: 34px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--body-sm);
  font-weight: 700;
  padding: 0 12px;
`;

const SheetLike = styled.section`
  border-radius: 18px;
  background: #ffffff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Quote = styled.blockquote`
  margin: 0;
  border-left: 3px solid #2dcd97;
  padding-left: 10px;
  color: #777777;
  font-size: var(--body-sm);
  line-height: 1.4;
`;

const Label = styled.label`
  color: #555555;
  font-size: var(--body-sm);
  font-weight: 700;
`;

const ReadonlyInput = styled.div`
  min-height: 38px;
  border-radius: 8px;
  background: #f3f3f3;
  color: #777777;
  font-size: var(--body-sm);
  display: flex;
  align-items: center;
  padding: 0 12px;
`;

const TextInput = styled.input`
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f3f3f3;
  color: #333333;
  font-size: var(--body-sm);
  padding: 0 12px;
  outline: none;
`;

const TextArea = styled.textarea`
  min-height: 92px;
  border: none;
  border-radius: 8px;
  background: #f3f3f3;
  color: #333333;
  font-size: var(--body-sm);
  padding: 10px 12px;
  resize: vertical;
  outline: none;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  min-height: 44px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--body-sm);
  font-weight: 700;
  padding: 0 16px;

  &:disabled {
    opacity: 0.55;
  }
`;

const SecondaryButton = styled.button`
  min-height: 44px;
  border: none;
  border-radius: 999px;
  background: #eeeeee;
  color: #777777;
  font-size: var(--body-sm);
  font-weight: 700;
  padding: 0 16px;

  &:disabled {
    opacity: 0.55;
  }
`;

const ResultCard = styled.section`
  border-radius: var(--card-radius);
  background: #fbfffd;
  border-left: 3px solid #2dcd97;
  padding: 14px;
`;

const LifecycleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatusCard = styled.button<{ $active: boolean }>`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 0 10px;
  width: 100%;
  border: 2px solid ${({ $active }) => ($active ? '#2dcd97' : '#ffffff')};
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 14px;
  text-align: left;

  ${CardText} {
    grid-column: 2;
  }
`;

const StatusNumber = styled.span`
  grid-row: 1 / 3;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eefaf6;
  color: #2dcd97;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
`;

const FinishActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ErrorText = styled.p`
  margin: 0;
  color: #f04444;
  font-size: var(--body-sm);
`;

const Footer = styled.footer`
  position: sticky;
  bottom: max(14px, env(safe-area-inset-bottom));
  margin-top: 20px;
`;

const NextButton = styled(PrimaryButton)`
  width: 100%;
`;

export default OnboardingPage;
