import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { isAxiosError } from 'axios';
import { useAuth } from '../../hooks/useAuth';

type PendingSelection = {
  sourceType: 'POST';
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  menuX: number;
  menuY: number;
  menuPlacement: 'top' | 'bottom';
};

type ConsensusDraft = {
  selection: PendingSelection;
  term: string;
  title: string;
  content: string;
};

type SampleConsensus = {
  title: string;
  term: string;
  quote: string;
  content: string;
};

const SELECTION_SOURCE_SELECTOR = '[data-selection-source-type][data-selection-source-id]';
const SAMPLE_POST_ID = 'onboarding-sample-post';
const SAMPLE_POST_TEXT =
  'AI 기술은 빠르게 확산되고 있습니다. 인공지능의 책임은 개발자에게 있다고 말하기보다는, 설계자부터 배포자까지 사용에 대한 관계를 정리해야 합니다.';
const INVALID_SELECTION_MESSAGE = '문장 일부를 드래그해 선택해 주세요.';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return '온보딩 완료 처리에 실패했습니다. 다시 시도해 주세요.';
};

const getSelectionSourceElement = (node: Node | null) => {
  if (!node) return null;
  const element =
    node instanceof Element
      ? node
      : node.parentNode instanceof Element
        ? node.parentNode
        : null;
  return element?.closest<HTMLElement>(SELECTION_SOURCE_SELECTOR) ?? null;
};

const getOffsetInsideElement = (
  element: HTMLElement,
  container: Node,
  offset: number,
) => {
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(element);
  beforeRange.setEnd(container, offset);
  const textOffset = beforeRange.toString().length;
  beforeRange.detach();
  return textOffset;
};

const clampMenuCoordinate = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getViewportBox = () => {
  const viewport = window.visualViewport;

  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
};

const calculateSelectionMenuPosition = (range: Range, source: HTMLElement) => {
  const rect = range.getBoundingClientRect();
  const sourceRect = source.getBoundingClientRect();
  const viewport = getViewportBox();
  const targetRect = rect.width || rect.height ? rect : sourceRect;
  const menuWidth = 220;
  const menuHeight = 46;
  const margin = 10;
  const minX = viewport.left + menuWidth / 2 + 8;
  const maxX = viewport.left + viewport.width - menuWidth / 2 - 8;
  const x = clampMenuCoordinate(targetRect.left + targetRect.width / 2, minX, maxX);
  const preferredTop = targetRect.top - margin;

  if (preferredTop > viewport.top + 72) {
    return {
      menuX: x,
      menuY: preferredTop,
      menuPlacement: 'top',
    } as const;
  }

  return {
    menuX: x,
    menuY: clampMenuCoordinate(
      targetRect.bottom + margin + menuHeight,
      viewport.top + 72,
      viewport.top + viewport.height - 88,
    ),
    menuPlacement: 'bottom',
  } as const;
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const selectionReadTimerRef = useRef<number | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [consensusDraft, setConsensusDraft] = useState<ConsensusDraft | null>(null);
  const [sampleConsensus, setSampleConsensus] = useState<SampleConsensus | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showMessage = (message: string) => {
    setActionMessage(message);
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setActionMessage('');
      messageTimerRef.current = null;
    }, 2600);
  };

  const clearSelectionMenu = () => {
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const extractSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? '';

    if (!selection || selection.rangeCount === 0 || !selectedText.trim()) {
      return;
    }

    const range = selection.getRangeAt(0);
    const anchorSource = getSelectionSourceElement(selection.anchorNode);
    const focusSource = getSelectionSourceElement(selection.focusNode);

    if (!anchorSource || anchorSource !== focusSource) {
      setPendingSelection(null);
      selection.removeAllRanges();
      showMessage(INVALID_SELECTION_MESSAGE);
      return;
    }

    if (
      !anchorSource.contains(range.startContainer) ||
      !anchorSource.contains(range.endContainer)
    ) {
      setPendingSelection(null);
      selection.removeAllRanges();
      showMessage(INVALID_SELECTION_MESSAGE);
      return;
    }

    const sourceText = anchorSource.textContent ?? '';
    const startOffset = getOffsetInsideElement(
      anchorSource,
      range.startContainer,
      range.startOffset,
    );
    const endOffset = getOffsetInsideElement(
      anchorSource,
      range.endContainer,
      range.endOffset,
    );
    const normalizedStartOffset = Math.min(startOffset, endOffset);
    const normalizedEndOffset = Math.max(startOffset, endOffset);
    const sourceSelectedText = sourceText
      .slice(normalizedStartOffset, normalizedEndOffset)
      .trim();

    if (!sourceSelectedText) {
      setPendingSelection(null);
      showMessage(INVALID_SELECTION_MESSAGE);
      return;
    }

    const { menuX, menuY, menuPlacement } = calculateSelectionMenuPosition(
      range,
      anchorSource,
    );

    setConsensusDraft(null);
    setPendingSelection({
      sourceType: 'POST',
      sourceId: anchorSource.dataset.selectionSourceId ?? SAMPLE_POST_ID,
      selectedText: sourceSelectedText,
      startOffset: normalizedStartOffset,
      endOffset: normalizedEndOffset,
      menuX,
      menuY,
      menuPlacement,
    });
  };

  const scheduleSelectionExtraction = (delay = 80) => {
    if (selectionReadTimerRef.current) {
      window.clearTimeout(selectionReadTimerRef.current);
    }

    selectionReadTimerRef.current = window.setTimeout(() => {
      selectionReadTimerRef.current = null;
      extractSelection();
    }, delay);
  };

  const openConsensusDraft = () => {
    if (!pendingSelection) return;
    setConsensusDraft({
      selection: pendingSelection,
      term: pendingSelection.selectedText,
      title: '',
      content: '',
    });
    setPendingSelection(null);
  };

  const copySelection = async () => {
    if (!pendingSelection) return;

    try {
      await navigator.clipboard.writeText(pendingSelection.selectedText);
      showMessage('선택한 표현을 복사했습니다.');
    } catch {
      showMessage('복사에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      clearSelectionMenu();
    }
  };

  const explainChildDebate = () => {
    showMessage(
      '하위 토론은 실제 토론에서 선택한 표현을 별도 논의로 분리할 때 사용합니다.',
    );
  };

  const submitConsensusDraft = () => {
    if (!consensusDraft) return;
    const term = consensusDraft.term.trim();
    const title = consensusDraft.title.trim();
    const content = consensusDraft.content.trim();
    if (!term || !title || !content) return;

    setSampleConsensus({
      title,
      term,
      quote: consensusDraft.selection.selectedText,
      content,
    });
    setConsensusDraft(null);
    window.getSelection()?.removeAllRanges();
    showMessage('합의안이 토론 흐름에 추가되었습니다.');
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

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        pendingSelection &&
        selectionMenuRef.current &&
        !selectionMenuRef.current.contains(event.target as Node)
      ) {
        setPendingSelection(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [pendingSelection]);

  useEffect(() => {
    return () => {
      if (selectionReadTimerRef.current) {
        window.clearTimeout(selectionReadTimerRef.current);
      }
      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const canSubmitConsensus =
    Boolean(consensusDraft?.term.trim()) &&
    Boolean(consensusDraft?.title.trim()) &&
    Boolean(consensusDraft?.content.trim());

  return (
    <Wrapper>
      <TopBar>
        <Kicker>정명 사용 흐름 익히기</Kicker>
        <SkipButton type="button" onClick={finishOnboarding} disabled={isSubmitting}>
          건너뛰기
        </SkipButton>
      </TopBar>

      <Header>
        <Title>샘플 토론</Title>
        <HeaderText>
          아래 의견에서 의미가 갈릴 수 있는 표현을 드래그해 선택하세요.
        </HeaderText>
      </Header>

      {actionMessage && <Toast role="status">{actionMessage}</Toast>}
      {error && <ErrorText>{error}</ErrorText>}

      <SampleScreen aria-label="샘플 토론">
        <DebateHeader>
          <BadgeRow>
            <StatusBadge>진행 중</StatusBadge>
            <TypeBadge>합의 토론</TypeBadge>
          </BadgeRow>
          <DebateTitle>AI 시대의 책임은 어디에 있을까?</DebateTitle>
          <DebateDescription>
            선택한 표현을 기준으로 다음 행동을 고를 수 있습니다.
          </DebateDescription>
        </DebateHeader>

        <Thread>
          <PostCard>
            <PostMeta>
              <Avatar>J</Avatar>
              <MetaText>
                <Author>샘플 작성자</Author>
                <TimeText>방금 전</TimeText>
              </MetaText>
            </PostMeta>
            <SelectablePost
              data-selection-source-type="POST"
              data-selection-source-id={SAMPLE_POST_ID}
              onMouseUp={() => scheduleSelectionExtraction()}
              onKeyUp={() => scheduleSelectionExtraction()}
              onTouchEnd={() => scheduleSelectionExtraction(160)}
            >
              {SAMPLE_POST_TEXT}
            </SelectablePost>
            <PostHint>
              이 표현을 기준 정의로 정리하려면 합의안을 만듭니다.
            </PostHint>
          </PostCard>

          {sampleConsensus && (
            <ConsensusCard>
              <ConsensusMeta>
                <ConsensusBadge>합의안</ConsensusBadge>
                <ConsensusTerm>{sampleConsensus.term}</ConsensusTerm>
              </ConsensusMeta>
              <ConsensusTitle>{sampleConsensus.title}</ConsensusTitle>
              <ConsensusQuote>{sampleConsensus.quote}</ConsensusQuote>
              <ConsensusContent>{sampleConsensus.content}</ConsensusContent>
              <ConsensusHelp>
                이 합의안이 승인되면 이 토론의 기준 정의로 사용합니다.
              </ConsensusHelp>
            </ConsensusCard>
          )}
        </Thread>
      </SampleScreen>

      {sampleConsensus && (
        <CompletionPanel>
          <CompletionTitle>핵심 흐름 완료</CompletionTitle>
          <CompletionBody>
            이제 실제 토론에서 표현을 선택해 합의안으로 이어갈 수 있습니다.
          </CompletionBody>
          <PrimaryButton type="button" onClick={finishOnboarding} disabled={isSubmitting}>
            {isSubmitting ? '완료 중...' : '정명 시작하기'}
          </PrimaryButton>
        </CompletionPanel>
      )}

      {pendingSelection && (
        <SelectionMenu
          ref={selectionMenuRef}
          data-placement={pendingSelection.menuPlacement}
          style={{
            left: pendingSelection.menuX,
            top: pendingSelection.menuY,
          }}
          aria-label="선택 액션 메뉴"
        >
          <SelectionMenuButton type="button" onClick={openConsensusDraft}>
            합의안
          </SelectionMenuButton>
          <SelectionMenuButton type="button" onClick={explainChildDebate}>
            하위 토론
          </SelectionMenuButton>
          <SelectionMenuButton type="button" onClick={() => void copySelection()}>
            복사
          </SelectionMenuButton>
        </SelectionMenu>
      )}

      {consensusDraft && (
        <SheetBackdrop onClick={() => setConsensusDraft(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>합의안 등록</SheetTitle>
            <SheetQuote>{consensusDraft.selection.selectedText}</SheetQuote>

            <SheetField>
              <SheetLabel>선택한 표현</SheetLabel>
              <ReadonlyValue>{consensusDraft.selection.selectedText}</ReadonlyValue>
            </SheetField>

            <SheetField>
              <SheetLabel>정리할 표현</SheetLabel>
              <SheetInput
                id="onboarding-consensus-term"
                value={consensusDraft.term}
                onChange={(event) =>
                  setConsensusDraft((prev) =>
                    prev ? { ...prev, term: event.target.value } : prev,
                  )
                }
              />
            </SheetField>

            <SheetField>
              <SheetLabel>합의안 제목</SheetLabel>
              <SheetInput
                id="onboarding-consensus-title"
                value={consensusDraft.title}
                onChange={(event) =>
                  setConsensusDraft((prev) =>
                    prev ? { ...prev, title: event.target.value } : prev,
                  )
                }
              />
            </SheetField>

            <SheetField>
              <SheetLabel>기준 정의</SheetLabel>
              <SheetTextarea
                id="onboarding-consensus-content"
                value={consensusDraft.content}
                onChange={(event) =>
                  setConsensusDraft((prev) =>
                    prev ? { ...prev, content: event.target.value } : prev,
                  )
                }
              />
            </SheetField>

            <SheetActionRow>
              <SheetSecondaryButton type="button" onClick={() => setConsensusDraft(null)}>
                취소
              </SheetSecondaryButton>
              <SheetPrimaryButton
                type="button"
                onClick={submitConsensusDraft}
                disabled={!canSubmitConsensus}
              >
                합의안 등록
              </SheetPrimaryButton>
            </SheetActionRow>
          </BottomSheet>
        </SheetBackdrop>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: clamp(18px, 5vw, 24px) clamp(16px, 4.8vw, 22px)
    max(24px, env(safe-area-inset-bottom));
  text-align: left;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const Kicker = styled.p`
  margin: 0;
  color: #2dcd97;
  font-size: 13px;
  font-weight: 800;
`;

const SkipButton = styled.button`
  min-height: 34px;
  border: none;
  border-radius: 999px;
  background: #eeeeee;
  color: #777777;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;

  &:disabled {
    opacity: 0.55;
  }
`;

const Header = styled.header`
  margin-bottom: 14px;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  color: #2f3238;
  font-size: clamp(24px, 7vw, 32px);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0;
`;

const HeaderText = styled.p`
  margin: 0;
  color: #777777;
  font-size: 14px;
  line-height: 1.5;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const Toast = styled.p`
  position: sticky;
  top: 12px;
  z-index: 40;
  margin: 0 0 10px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  color: #2d8f73;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  padding: 9px 12px;
`;

const ErrorText = styled(Toast)`
  color: #f04444;
`;

const SampleScreen = styled.section`
  border-radius: 14px;
  background: #eeeeee;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
`;

const DebateHeader = styled.div`
  background: #ffffff;
  padding: 16px;
  border-bottom: 1px solid #e7e7e7;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2dcd97;
  font-size: 11px;
  font-weight: 800;
  padding: 0 9px;
`;

const TypeBadge = styled(StatusBadge)`
  background: #f1f1f1;
  color: #777777;
`;

const DebateTitle = styled.h2`
  margin: 0 0 6px;
  color: #333333;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const DebateDescription = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: 13px;
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const Thread = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
`;

const PostCard = styled.article`
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const Avatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #2dcd97;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
`;

const MetaText = styled.div`
  min-width: 0;
`;

const Author = styled.strong`
  display: block;
  color: #555555;
  font-size: 13px;
  line-height: 1.25;
`;

const TimeText = styled.span`
  color: #a0a0a0;
  font-size: 11px;
`;

const SelectablePost = styled.p`
  margin: 0;
  color: #555555;
  font-size: 15px;
  line-height: 1.65;
  word-break: keep-all;
  overflow-wrap: anywhere;
  user-select: text;
  -webkit-user-select: text;
`;

const PostHint = styled.p`
  margin: 12px 0 0;
  border-radius: 8px;
  background: #fbfffd;
  color: #2d8f73;
  font-size: 12px;
  line-height: 1.4;
  padding: 9px 10px;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ConsensusCard = styled.section`
  border-radius: 8px;
  border-left: 3px solid #2dcd97;
  background: #fbfffd;
  padding: 12px;
`;

const ConsensusMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ConsensusBadge = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2dcd97;
  font-size: 11px;
  font-weight: 800;
  padding: 0 8px;
`;

const ConsensusTerm = styled.span`
  min-width: 0;
  color: #8f8f8f;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ConsensusTitle = styled.h3`
  margin: 0 0 6px;
  color: #444444;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ConsensusQuote = styled.blockquote`
  margin: 0 0 8px;
  border-left: 3px solid #d8f5ec;
  padding-left: 8px;
  color: #8f8f8f;
  font-size: 12px;
  line-height: 1.4;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ConsensusContent = styled.p`
  margin: 0;
  color: #666666;
  font-size: 13px;
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ConsensusHelp = styled.p`
  margin: 9px 0 0;
  color: #2d8f73;
  font-size: 12px;
  line-height: 1.4;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const CompletionPanel = styled.section`
  margin-top: 14px;
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
`;

const CompletionTitle = styled.h2`
  margin: 0 0 6px;
  color: #2f3238;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
`;

const CompletionBody = styled.p`
  margin: 0 0 14px;
  color: #777777;
  font-size: 13px;
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const PrimaryButton = styled.button`
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  padding: 0 16px;

  &:disabled {
    opacity: 0.55;
  }
`;

const SelectionMenu = styled.div`
  position: fixed;
  z-index: 80;
  transform: translate(-50%, -100%);
  min-width: 220px;
  min-height: 44px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 8px;

  &[data-placement='top'] {
    transform: translate(-50%, -100%);
  }

  &[data-placement='bottom'] {
    transform: translate(-50%, 0);
  }
`;

const SelectionMenuButton = styled.button`
  min-height: 36px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #2f3238;
  font-size: 12px;
  font-weight: 800;
  padding: 0 10px;
  touch-action: manipulation;

  &:active {
    background: #eefaf6;
    color: #2dcd97;
  }
`;

const SheetBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const BottomSheet = styled.div`
  width: 100%;
  max-width: 1126px;
  max-height: min(82dvh, 720px);
  overflow-y: auto;
  border-radius: 18px 18px 0 0;
  background: #ffffff;
  padding: 18px clamp(16px, 4.8vw, 22px) max(18px, env(safe-area-inset-bottom));
`;

const SheetTitle = styled.h2`
  margin: 0 0 12px;
  color: #2f3238;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
`;

const SheetQuote = styled.blockquote`
  margin: 0 0 12px;
  border-left: 3px solid #2dcd97;
  padding-left: 10px;
  color: #8f8f8f;
  font-size: 13px;
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const SheetField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
`;

const SheetLabel = styled.span`
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 800;
`;

const ReadonlyValue = styled.div`
  min-height: 40px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #777777;
  font-size: 14px;
  line-height: 1.4;
  padding: 10px 12px;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const SheetInput = styled.input`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  font-size: 16px;
  padding: 0 12px;
  outline: none;
`;

const SheetTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  font-size: 16px;
  line-height: 1.45;
  padding: 10px 12px;
  resize: vertical;
  outline: none;
`;

const SheetActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

const SheetSecondaryButton = styled.button`
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #7f7f7f;
  font-size: 14px;
  font-weight: 800;
  padding: 0 16px;
`;

const SheetPrimaryButton = styled(SheetSecondaryButton)`
  background: #2dcd97;
  color: #ffffff;

  &:disabled {
    opacity: 0.6;
  }
`;

export default OnboardingPage;
