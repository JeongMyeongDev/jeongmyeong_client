import { isAxiosError } from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useMessage } from '../../hooks/useMessage';
import { consensusService } from '../../services/consensusService';
import { debateService } from '../../services/debateService';
import { definitionService } from '../../services/definitionService';
import { useAuthStore } from '../../stores/authStore';
import type { Consensus, ConsensusVote, Definition, SelectionTarget } from '../../types/debate';

type SelectionDraft = {
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  x: number;
  y: number;
};

type SelectionAction = 'CONSENSUS' | 'CHILD_DEBATE';

const MessagePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryRoomId = searchParams.get('roomId') ?? '';
  const { user } = useAuthStore();
  const { chatRooms, currentMessages, fetchChatRooms, fetchMessages, sendMessage } = useMessage();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [selectedRoomId] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [consensuses, setConsensuses] = useState<Consensus[]>([]);
  const [, setDefinitions] = useState<Definition[]>([]);
  const [selectedConsensus, setSelectedConsensus] = useState<Consensus | null>(null);
  const [votes, setVotes] = useState<ConsensusVote[]>([]);
  const [voteComment, setVoteComment] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [isConsensusBusy, setIsConsensusBusy] = useState(false);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [selectionAction, setSelectionAction] = useState<SelectionAction | null>(null);
  const [selectionTarget, setSelectionTarget] = useState<SelectionTarget | null>(null);
  const [selectionTitle, setSelectionTitle] = useState('');
  const [selectionContent, setSelectionContent] = useState('');
  const [isSelectionBusy, setIsSelectionBusy] = useState(false);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        await fetchChatRooms();
      } catch {
        setError('토론방 목록을 불러오지 못했습니다.');
      }
    };
    void loadRooms();
  }, [fetchChatRooms]);

  const activeRoomId = selectedRoomId || queryRoomId || chatRooms[0]?.id || '';

  useEffect(() => {
    if (!activeRoomId) return;

    const loadMessages = async () => {
      try {
        await fetchMessages(activeRoomId);
        const [consensusResponse, definitionResponse] = await Promise.all([
          consensusService.getByDebate(activeRoomId),
          definitionService.getByDebate(activeRoomId),
        ]);
        setConsensuses(consensusResponse.data.consensuses);
        setDefinitions(definitionResponse.data.definitions);
      } catch {
        setError('토론 데이터를 불러오지 못했습니다.');
      }
    };

    void loadMessages();
  }, [activeRoomId, fetchMessages]);

  useEffect(() => {
    if (!activeRoomId || queryRoomId) return;
    setSearchParams({ roomId: activeRoomId });
  }, [activeRoomId, queryRoomId, setSearchParams]);

  const selectedRoom = useMemo(
    () => chatRooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, chatRooms],
  );

  const leadingConsensus = consensuses[0] ?? null;
  const focusText =
    leadingConsensus?.selectionTarget?.selectedText ??
    leadingConsensus?.title ??
    '당신은 앞으로 AI의 전망을 잘 알고 있습니까?';

  const handleSend = async () => {
    if (!activeRoomId || !draft.trim() || isSending) return;
    setError('');
    setIsSending(true);

    try {
      await sendMessage(activeRoomId, draft.trim());
      setDraft('');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setError('로그인해야 메시지를 전송할 수 있습니다.');
      } else {
        setError('메시지 전송에 실패했습니다.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const openConsensus = async (consensus: Consensus) => {
    setSelectedConsensus(consensus);
    setResultSummary(consensus.resultSummary ?? '');
    setVoteComment('');

    try {
      const [detailResponse, votesResponse] = await Promise.all([
        consensusService.getById(consensus.id),
        consensusService.getVotes(consensus.id),
      ]);
      setSelectedConsensus(detailResponse.data.consensus);
      setVotes(votesResponse.data.votes);
    } catch {
      setError('합의안 상세를 불러오지 못했습니다.');
    }
  };

  const refreshConsensusData = async () => {
    if (!activeRoomId) return;

    const [consensusResponse, definitionResponse] = await Promise.all([
      consensusService.getByDebate(activeRoomId),
      definitionService.getByDebate(activeRoomId),
    ]);
    setConsensuses(consensusResponse.data.consensuses);
    setDefinitions(definitionResponse.data.definitions);
  };

  const submitVote = async (voteType: 'APPROVE' | 'REJECT' | 'COMMENT') => {
    if (!selectedConsensus || isConsensusBusy) return;
    setIsConsensusBusy(true);

    try {
      await consensusService.vote(selectedConsensus.id, {
        voteType,
        comment: voteType === 'COMMENT' ? voteComment : undefined,
      });
      const votesResponse = await consensusService.getVotes(selectedConsensus.id);
      setVotes(votesResponse.data.votes);
      setVoteComment('');
      await refreshConsensusData();
    } catch {
      setError('합의안 의견 등록에 실패했습니다.');
    } finally {
      setIsConsensusBusy(false);
    }
  };

  const updateConsensusStatus = async (status: 'APPROVED' | 'REJECTED' | 'CLOSED') => {
    if (!selectedConsensus || isConsensusBusy) return;
    setIsConsensusBusy(true);

    try {
      const response = await consensusService.updateStatus(selectedConsensus.id, {
        status,
        resultSummary,
        saveAsGlobalDefinition: status === 'APPROVED',
      });
      setSelectedConsensus(response.data.consensus);
      await refreshConsensusData();
    } catch {
      setError('합의안 상태 변경에 실패했습니다.');
    } finally {
      setIsConsensusBusy(false);
    }
  };

  const closeSelectionFlow = () => {
    setSelectionDraft(null);
    setSelectionAction(null);
    setSelectionTarget(null);
    setSelectionTitle('');
    setSelectionContent('');
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    if (!selectionDraft && !selectionAction) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-selection-layer="true"]')) return;
      closeSelectionFlow();
    };

    const handleSelectionChange = () => {
      if (selectionAction) return;
      window.setTimeout(() => {
        const selectedText = window.getSelection()?.toString().trim() ?? '';
        if (!selectedText) setSelectionDraft(null);
      }, 0);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [selectionAction, selectionDraft]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionDraft(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setSelectionDraft(null);
      return;
    }

    const frame = frameRef.current;
    if (!frame || !frame.contains(range.commonAncestorContainer)) {
      setSelectionDraft(null);
      return;
    }

    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    const messageElement = node?.closest<HTMLElement>('[data-message-id]');
    if (!messageElement) {
      setSelectionDraft(null);
      return;
    }

    const fullText = messageElement.dataset.messageContent ?? messageElement.textContent ?? '';
    const startOffset = fullText.indexOf(selectedText);
    if (startOffset < 0) {
      setSelectionDraft(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    setSelectionDraft({
      sourceId: messageElement.dataset.messageId ?? '',
      selectedText,
      startOffset,
      endOffset: startOffset + selectedText.length,
      x: Math.min(Math.max(rect.left - frameRect.left + rect.width / 2, 72), 330),
      y: Math.max(rect.top - frameRect.top - 48, 328),
    });
  };

  const openSelectionAction = (action: SelectionAction) => {
    if (!selectionDraft) return;
    setSelectionAction(action);
    setSelectionTarget(null);
    setSelectionTitle(action === 'CONSENSUS' ? `${selectionDraft.selectedText}에 대한 합의안` : `${selectionDraft.selectedText} 토론`);
    setSelectionContent('');
  };

  const ensureSelectionTarget = async () => {
    if (!activeRoomId || !selectionDraft) return null;
    if (selectionTarget) return selectionTarget;

    const response = await debateService.createSelectionTarget(activeRoomId, {
      sourceType: 'POST',
      sourceId: selectionDraft.sourceId,
      selectedText: selectionDraft.selectedText,
      startOffset: selectionDraft.startOffset,
      endOffset: selectionDraft.endOffset,
    });
    setSelectionTarget(response.data.selectionTarget);
    return response.data.selectionTarget;
  };

  const submitSelectionAction = async () => {
    if (!selectionAction || !selectionDraft || !selectionTitle.trim() || isSelectionBusy) return;
    setIsSelectionBusy(true);

    try {
      const target = await ensureSelectionTarget();
      if (!target) return;

      if (selectionAction === 'CONSENSUS') {
        await consensusService.createFromSelectionTarget(target.id, {
          title: selectionTitle.trim(),
          content: selectionContent.trim() || selectionDraft.selectedText,
        });
        await refreshConsensusData();
      } else {
        const response = await debateService.createChildDebateFromSelection(target.id, {
          title: selectionTitle.trim(),
          description: selectionContent.trim() || selectionDraft.selectedText,
          debateType: selectedRoom?.debateType ?? 'FREE',
        });
        setSearchParams({ roomId: response.data.debate.id });
        navigate(`/message?roomId=${response.data.debate.id}`);
      }

      closeSelectionFlow();
    } catch {
      setError('선택 기반 작업 생성에 실패했습니다.');
    } finally {
      setIsSelectionBusy(false);
    }
  };

  return (
    <Viewport>
      <PhoneFrame ref={frameRef}>
        <Header>
          <StatusBar>
            <StatusTime>9:41</StatusTime>
            <StatusGlyphs aria-hidden="true">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </StatusGlyphs>
          </StatusBar>

          <Logo src={logoSymbol} alt="정명" />

          <HeaderContent>
            <HeaderButton type="button" aria-label="뒤로가기" onClick={() => window.history.back()}>
              <BackIcon />
            </HeaderButton>
            <TitleArea>
              <Title>{selectedRoom?.title ?? '기술 토론'}</Title>
              <Subtitle>{selectedRoom?.description || 'AI가 사람의 직업을 대체 할 수 있을...'}</Subtitle>
            </TitleArea>
            <HeaderButton type="button" aria-label="토론 정보">
              <InfoIcon />
            </HeaderButton>
          </HeaderContent>
        </Header>

        <QuestionCard type="button" onClick={() => leadingConsensus && void openConsensus(leadingConsensus)}>
          <QuestionText>{focusText}</QuestionText>
          <QuestionArrow />
        </QuestionCard>

        <ThreadArea onMouseUp={handleTextSelection} onTouchEnd={() => window.setTimeout(handleTextSelection, 0)}>
          {currentMessages.length === 0 ? (
            <ThreadCard $left={0} $width={326} $featured>
              <MessageMeta>
                <span>#1</span>
                <ProfileIcon />
                <span>정명</span>
              </MessageMeta>
              <MessageText>당신은 앞으로 AI의 전망을 잘 알고 있습니까?</MessageText>
            </ThreadCard>
          ) : (
            currentMessages.map((message, index) => {
              const mine = message.author.id === user?.id;
              const layout = threadLayouts[index % threadLayouts.length];

              return (
                <ThreadCard
                  key={message.id}
                  $left={mine ? Math.max(layout.left, 64) : layout.left}
                  $width={mine ? Math.min(layout.width, 252) : layout.width}
                  $featured={index === 0}
                >
                  <MessageMeta>
                    <span>#{index + 1}</span>
                    {message.author.profileImage ? (
                      <AvatarImage src={message.author.profileImage} alt="" />
                    ) : (
                      <ProfileIcon />
                    )}
                    <span>{message.author.nickname}</span>
                  </MessageMeta>
                  <MessageText data-message-id={message.id} data-message-content={message.content}>
                    {message.content}
                  </MessageText>
                </ThreadCard>
              );
            })
          )}
        </ThreadArea>

        {selectionDraft && !selectionAction && (
          <SelectionPopover
            data-selection-layer="true"
            $x={selectionDraft.x}
            $y={selectionDraft.y}
            onMouseDown={(event) => event.preventDefault()}
            onTouchStart={(event) => event.preventDefault()}
          >
            <SelectionActions>
              <SelectionButton type="button" onClick={() => openSelectionAction('CONSENSUS')}>
                합의안 생성
              </SelectionButton>
              <SelectionButton type="button" onClick={() => openSelectionAction('CHILD_DEBATE')}>
                하위 토론 생성
              </SelectionButton>
            </SelectionActions>
          </SelectionPopover>
        )}

        <InputBar>
          <HashButton type="button" aria-label="선택 대상">
            #
          </HashButton>
          <TextInput
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="입력창.."
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <SendButton type="button" disabled={isSending || !draft.trim()} onClick={() => void handleSend()}>
            <SendIcon />
          </SendButton>
        </InputBar>

        {selectedConsensus && (
          <ModalOverlay onClick={() => setSelectedConsensus(null)}>
            <ConsensusModal onClick={(event) => event.stopPropagation()}>
              <ModalHeader>
                <strong>{selectedConsensus.title}</strong>
                <button type="button" onClick={() => setSelectedConsensus(null)}>
                  닫기
                </button>
              </ModalHeader>
              <ModalMeta>상태: {selectedConsensus.status}</ModalMeta>
              <ModalTarget>선택 표현: {selectedConsensus.selectionTarget?.selectedText ?? '-'}</ModalTarget>
              <ModalContent>{selectedConsensus.content}</ModalContent>
              {selectedConsensus.resultSummary && <ModalResult>결과: {selectedConsensus.resultSummary}</ModalResult>}
              <VoteRow>
                <VoteButton type="button" disabled={isConsensusBusy} onClick={() => void submitVote('APPROVE')}>
                  동의
                </VoteButton>
                <VoteButton type="button" disabled={isConsensusBusy} onClick={() => void submitVote('REJECT')}>
                  반대
                </VoteButton>
              </VoteRow>
              <CommentBox
                value={voteComment}
                onChange={(event) => setVoteComment(event.target.value)}
                placeholder="의견을 남겨주세요."
              />
              <VoteButton
                type="button"
                disabled={isConsensusBusy || !voteComment.trim()}
                onClick={() => void submitVote('COMMENT')}
              >
                의견 등록
              </VoteButton>
              <VoteList>
                {votes.map((vote) => (
                  <li key={vote.id}>
                    <strong>{vote.user?.nickname ?? '참여자'}</strong> {vote.voteType}
                    {vote.comment && <p>{vote.comment}</p>}
                  </li>
                ))}
              </VoteList>
              <StatusEditor>
                <CommentBox
                  value={resultSummary}
                  onChange={(event) => setResultSummary(event.target.value)}
                  placeholder="승인/종료 시 기록할 결과 요약"
                />
                <VoteRow>
                  <VoteButton
                    type="button"
                    disabled={isConsensusBusy}
                    onClick={() => void updateConsensusStatus('APPROVED')}
                  >
                    승인
                  </VoteButton>
                  <VoteButton
                    type="button"
                    disabled={isConsensusBusy}
                    onClick={() => void updateConsensusStatus('REJECTED')}
                  >
                    반려
                  </VoteButton>
                  <VoteButton
                    type="button"
                    disabled={isConsensusBusy}
                    onClick={() => void updateConsensusStatus('CLOSED')}
                  >
                    종료
                  </VoteButton>
                </VoteRow>
              </StatusEditor>
            </ConsensusModal>
          </ModalOverlay>
        )}

        {selectionAction && selectionDraft && (
          <ModalOverlay data-selection-layer="true" onClick={closeSelectionFlow}>
            <SelectionModal data-selection-layer="true" onClick={(event) => event.stopPropagation()}>
              <ModalHeader>
                <strong>{selectionAction === 'CONSENSUS' ? '합의안 생성' : '하위 토론 생성'}</strong>
                <button type="button" onClick={closeSelectionFlow}>
                  닫기
                </button>
              </ModalHeader>
              <ModalTarget>선택 표현: {selectionDraft.selectedText}</ModalTarget>
              <SelectionField>
                <span>{selectionAction === 'CONSENSUS' ? '합의안 제목' : '하위 토론 제목'}</span>
                <SelectionInput
                  value={selectionTitle}
                  onChange={(event) => setSelectionTitle(event.target.value)}
                  placeholder="제목을 입력하세요."
                />
              </SelectionField>
              <SelectionField>
                <span>{selectionAction === 'CONSENSUS' ? '정의 또는 합의 내용' : '토론 설명'}</span>
                <CommentBox
                  value={selectionContent}
                  onChange={(event) => setSelectionContent(event.target.value)}
                  placeholder={
                    selectionAction === 'CONSENSUS'
                      ? '선택한 표현에 대한 합의 내용을 입력하세요.'
                      : '이 표현에서 분리할 쟁점을 설명하세요.'
                  }
                />
              </SelectionField>
              <VoteButton
                type="button"
                disabled={isSelectionBusy || !selectionTitle.trim()}
                onClick={() => void submitSelectionAction()}
              >
                생성
              </VoteButton>
            </SelectionModal>
          </ModalOverlay>
        )}

        {error && <ErrorText>{error}</ErrorText>}
      </PhoneFrame>
    </Viewport>
  );
};

const threadLayouts = [
  { left: 0, width: 326 },
  { left: 36, width: 318 },
  { left: 70, width: 284 },
  { left: 104, width: 250 },
  { left: 36, width: 318 },
  { left: 104, width: 250 },
];

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M13.2 5.2L8.2 11L13.2 16.8" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8.2" stroke="#242424" strokeWidth="1.7" />
    <path d="M11 10.2V15" stroke="#242424" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="11" cy="7.3" r="1" fill="#242424" />
  </svg>
);

const QuestionArrow = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M6 8.5L11 13.5L16 8.5" stroke="#333333" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="8" fill="#D9D9D9" />
    <circle cx="8" cy="6.2" r="2.1" fill="#FCFCFC" />
    <path d="M3.7 13C4.35 10.9 6 9.75 8 9.75C10 9.75 11.65 10.9 12.3 13" fill="#FCFCFC" />
  </svg>
);

const SendIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M4.6 11H16.7" stroke="#555555" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12.3 6.6L16.7 11L12.3 15.4" stroke="#555555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SignalIcon = () => (
  <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden="true">
    <rect x="1" y="6" width="3" height="4" rx="1" fill="#111111" />
    <rect x="6" y="4" width="3" height="6" rx="1" fill="#111111" />
    <rect x="11" y="1" width="3" height="9" rx="1" fill="#111111" />
  </svg>
);

const WifiIcon = () => (
  <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
    <path d="M2 4.7C5.2 2.2 9.8 2.2 13 4.7" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M4.6 7C6.4 5.7 8.6 5.7 10.4 7" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="7.5" cy="9.3" r="1" fill="#111111" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
    <rect x="1" y="2" width="19" height="8" rx="2.5" stroke="#111111" strokeWidth="1.2" />
    <rect x="3" y="4" width="15" height="4" rx="1.2" fill="#111111" />
    <path d="M21 4.5V7.5" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Viewport = styled.div`
  min-height: 100dvh;
  background: #eeeeee;
  display: flex;
  justify-content: center;
`;

const PhoneFrame = styled.div`
  position: relative;
  width: min(402px, 100vw);
  min-height: 874px;
  background: #f5f5f5;
  overflow: hidden;
`;

const Header = styled.header`
  width: 402px;
  max-width: 100%;
  height: 206px;
  background: #ffffff;
`;

const StatusBar = styled.div`
  height: 48px;
  padding: 18px 30px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const StatusTime = styled.span`
  color: #111111;
  font-size: 14px;
  font-weight: 700;
`;

const StatusGlyphs = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 1px;
`;

const Logo = styled.img`
  width: 68px;
  height: 40px;
  display: block;
  margin: 8px auto 26px;
`;

const HeaderContent = styled.div`
  height: 64px;
  padding: 0 26px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 12px;
`;

const HeaderButton = styled.button`
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  display: grid;
  place-items: center;
`;

const TitleArea = styled.div`
  min-width: 0;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  color: #252525;
  font-size: 20px;
  font-weight: 700;
  line-height: 25px;
`;

const Subtitle = styled.p`
  margin: 5px 0 0;
  color: #b7b7b7;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const QuestionCard = styled.button`
  position: absolute;
  top: 222px;
  left: 24px;
  width: 354px;
  height: 96px;
  border: 0;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.08);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  text-align: left;
`;

const QuestionText = styled.span`
  color: #333333;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: 0;
`;

const ThreadArea = styled.main`
  position: relative;
  margin: 188px 24px 96px;
  min-height: 470px;
`;

const MessageText = styled.p`
  margin: 0;
  line-height: 19px;
  letter-spacing: 0;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ThreadCard = styled.article<{ $left: number; $width: number; $featured: boolean }>`
  position: relative;
  width: ${({ $width }) => $width}px;
  min-height: 62px;
  margin-left: ${({ $left }) => $left}px;
  margin-bottom: 11px;
  border-radius: 4px;
  background: #fcfcfc;
  padding: 11px 12px 12px;

  &::before {
    content: '';
    position: absolute;
    left: -18px;
    top: 20px;
    width: ${({ $left }) => ($left > 0 ? '14px' : '0')};
    height: 1px;
    background: #d9d9d9;
  }

  ${MessageText} {
    color: ${({ $featured }) => ($featured ? '#2dcd97' : '#818181')};
    font-size: ${({ $featured }) => ($featured ? '14px' : '12px')};
    font-weight: ${({ $featured }) => ($featured ? 600 : 400)};
  }
`;

const MessageMeta = styled.div`
  height: 18px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  color: #b7b7b7;
  font-size: 12px;
  font-weight: 600;

  span:first-child {
    font-weight: 700;
  }

  span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const AvatarImage = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
`;

const InputBar = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 30;
  width: 402px;
  max-width: 100%;
  height: 72px;
  background: #ffffff;
  padding: 8px 16px 20px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 8px;
`;

const HashButton = styled.button`
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: #efefef;
  color: #555555;
  font-size: 20px;
  font-weight: 700;
`;

const TextInput = styled.input`
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 24px;
  background: #efefef;
  padding: 0 16px;
  color: #333333;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #8c8c8c;
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: #efefef;
  display: grid;
  place-items: center;

  &:disabled {
    opacity: 0.45;
  }
`;

const SelectionPopover = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  z-index: 120;
  width: 174px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.14);
  padding: 4px;

  &::after {
    display: none;
  }
`;

const SelectionActions = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
`;

const SelectionButton = styled.button`
  min-height: 32px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #333333;
  font-size: 0;
  font-weight: 700;

  &:first-child {
    background: #2dcd97;
    color: #ffffff;
  }

  &::after {
    font-size: 12px;
  }

  &:first-child::after {
    content: '합의안';
  }

  &:last-child::after {
    content: '하위 토론';
  }
`;

const ModalOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
`;

const ConsensusModal = styled.div`
  width: 354px;
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  background: #ffffff;
  border-radius: 24px;
  padding: 18px;
  text-align: left;
`;

const SelectionModal = styled(ConsensusModal)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SelectionField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #606060;
  font-size: 12px;
  font-weight: 700;
`;

const SelectionInput = styled.input`
  width: 100%;
  height: 42px;
  border: 1px solid #dfdfdf;
  border-radius: 12px;
  padding: 0 12px;
  color: #333333;
  font-size: 13px;
  outline: none;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  strong {
    color: #2f3238;
    font-size: 18px;
  }

  button {
    border: none;
    background: transparent;
    color: #8f8f8f;
    font-weight: 700;
  }
`;

const ModalMeta = styled.p`
  color: #2dcd97;
  font-size: 12px;
  font-weight: 700;
  margin: 0 0 8px;
`;

const ModalTarget = styled.p`
  background: #edf9f4;
  border-radius: 10px;
  color: #2c6152;
  font-size: 12px;
  padding: 8px 10px;
  margin: 0 0 10px;
`;

const ModalContent = styled.p`
  color: #555555;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 10px;
`;

const ModalResult = styled(ModalContent)`
  background: #f7f8f8;
  border-radius: 10px;
  padding: 10px;
`;

const VoteRow = styled.div`
  display: flex;
  gap: 8px;
  margin: 8px 0;
`;

const VoteButton = styled.button`
  flex: 1;
  min-height: 38px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;

  &:disabled {
    background: #b7ddd0;
    cursor: not-allowed;
  }
`;

const CommentBox = styled.textarea`
  width: 100%;
  min-height: 72px;
  border: 1px solid #dfdfdf;
  border-radius: 12px;
  padding: 10px;
  color: #555555;
  font-size: 13px;
  resize: vertical;
`;

const VoteList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  padding: 0;

  li {
    background: #f7f8f8;
    border-radius: 10px;
    color: #666666;
    font-size: 12px;
    padding: 8px 10px;
  }

  p {
    margin-top: 4px;
    line-height: 1.4;
  }
`;

const StatusEditor = styled.section`
  border-top: 1px solid #eeeeee;
  margin-top: 12px;
  padding-top: 12px;
`;

const ErrorText = styled.p`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 80px;
  z-index: 40;
  border-radius: 12px;
  background: #fff1f1;
  padding: 10px 12px;
  color: #e14343;
  font-size: 12px;
  text-align: center;
`;

export default MessagePage;
