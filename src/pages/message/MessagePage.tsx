import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useMessage } from '../../hooks/useMessage';
import { useAuthStore } from '../../stores/authStore';

const MessagePage = () => {
  const { user } = useAuthStore();
  const { chatRooms, currentMessages, fetchChatRooms, fetchMessages, sendMessage } = useMessage();
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const activeRoomId = selectedRoomId || chatRooms[0]?.id || '';

  useEffect(() => {
    if (!activeRoomId) return;
    const loadMessages = async () => {
      try {
        await fetchMessages(activeRoomId);
      } catch {
        setError('메시지를 불러오지 못했습니다.');
      }
    };
    void loadMessages();
  }, [activeRoomId, fetchMessages]);

  const selectedRoom = useMemo(
    () => chatRooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, chatRooms],
  );

  const handleSend = async () => {
    if (!activeRoomId || !draft.trim() || isSending) return;
    setError('');
    setIsSending(true);
    try {
      await sendMessage(activeRoomId, draft.trim());
      setDraft('');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setError('로그인 후 메시지를 전송할 수 있습니다.');
      } else {
        setError('메시지 전송에 실패했습니다.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Wrapper>
      <Logo src={logoSymbol} alt="정명" />

      <RoomTabs>
        {chatRooms.map((room) => (
          <RoomTab
            key={room.id}
            type="button"
            $active={room.id === activeRoomId}
            onClick={() => setSelectedRoomId(room.id)}
          >
            {room.title}
          </RoomTab>
        ))}
      </RoomTabs>

      <ChatPanel>
        <PanelHeader>
          <PanelTitle>{selectedRoom?.title ?? '토론방'}</PanelTitle>
          <PanelSub>{selectedRoom?.description ?? '메시지를 확인해보세요.'}</PanelSub>
        </PanelHeader>

        <MessageList>
          {currentMessages.length === 0 && <EmptyText>아직 작성된 메시지가 없습니다.</EmptyText>}
          {currentMessages.map((message) => {
            const mine = message.author.id === user?.id;
            return (
              <MessageRow key={message.id} $mine={mine}>
                <MessageBubble $mine={mine}>
                  <MessageAuthor $mine={mine}>{message.author.nickname}</MessageAuthor>
                  <MessageContent>{message.content}</MessageContent>
                </MessageBubble>
              </MessageRow>
            );
          })}
        </MessageList>

        <Composer>
          <ComposerInput
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <SendButton type="button" disabled={isSending || !draft.trim()} onClick={() => void handleSend()}>
            전송
          </SendButton>
        </Composer>
      </ChatPanel>

      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: transparent;
  padding: var(--page-top) var(--page-x) var(--page-bottom);
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin: 0 auto clamp(14px, 3.7vw, 16px);
`;

const RoomTabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
  padding-bottom: 2px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const RoomTab = styled.button<{ $active: boolean }>`
  border: 1.5px solid ${({ $active }) => ($active ? '#2dcd97' : '#b7b7b7')};
  background: ${({ $active }) => ($active ? '#2dcd97' : 'rgba(255, 255, 255, 0.58)')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#8f8f8f')};
  border-radius: 999px;
  height: clamp(30px, 7.9vw, 34px);
  padding: 0 clamp(12px, 3.3vw, 14px);
  font-size: var(--body-sm);
  white-space: nowrap;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

const ChatPanel = styled.section`
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--card-radius);
  padding: clamp(12px, 3.3vw, 14px);
  min-height: min(520px, calc(100dvh - 190px));
  display: flex;
  flex-direction: column;
  box-shadow: var(--glass-shadow-soft);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

const PanelHeader = styled.div`
  margin-bottom: 12px;
`;

const PanelTitle = styled.h2`
  margin: 0 0 4px;
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
  color: #2f3238;
`;

const PanelSub = styled.p`
  margin: 0;
  font-size: 13px;
  color: #8f8f8f;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
`;

const EmptyText = styled.p`
  margin: auto 0;
  text-align: center;
  color: #9b9b9b;
  font-size: 13px;
`;

const MessageRow = styled.div<{ $mine: boolean }>`
  display: flex;
  justify-content: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div<{ $mine: boolean }>`
  max-width: 80%;
  border-radius: 16px;
  padding: 10px 12px;
  background: ${({ $mine }) => ($mine ? 'rgba(216, 246, 232, 0.78)' : 'rgba(255, 255, 255, 0.78)')};
  border: 1px solid ${({ $mine }) => ($mine ? '#b9eccc' : 'var(--glass-border)')};
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

const MessageAuthor = styled.p<{ $mine: boolean }>`
  margin: 0 0 4px;
  font-size: 11px;
  color: ${({ $mine }) => ($mine ? '#2dcd97' : '#7e7e7e')};
  font-weight: 600;
`;

const MessageContent = styled.p`
  margin: 0;
  font-size: var(--body-sm);
  color: #2f3238;
  line-height: 1.35;
  white-space: pre-wrap;
`;

const Composer = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 8px;
`;

const ComposerInput = styled.input`
  flex: 1;
  height: 42px;
  border-radius: 999px;
  border: 1.5px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.66);
  padding: 0 14px;
  font-size: var(--body-sm);
  outline: none;
`;

const SendButton = styled.button`
  width: clamp(58px, 16.3vw, 70px);
  height: clamp(38px, 9.8vw, 42px);
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #2dcd97, #43bfaa);
  box-shadow: 0 10px 20px rgba(45, 205, 151, 0.18);
  color: #ffffff;
  font-size: var(--body-sm);
  font-weight: 700;

  &:disabled {
    opacity: 0.65;
  }
`;

const ErrorText = styled.p`
  margin: 10px 4px 0;
  font-size: 13px;
  color: #f04444;
`;

export default MessagePage;
