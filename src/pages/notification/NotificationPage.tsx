import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { notificationService, type Notification } from '../../services/notificationService';

const TYPE_LABEL: Record<string, string> = {
  COMMENT_ON_POST: '회원님의 의견에 댓글이 달렸어요.',
  REPLY_TO_COMMENT: '회원님의 댓글에 답글이 달렸어요.',
  NEW_POST_IN_DEBATE: '참여 중인 토론에 새 글이 올라왔어요.',
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
};

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await notificationService.getAll();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        setError('알림을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClickItem = async (item: Notification) => {
    if (!item.isRead) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    navigate(`/debate/${item.debateId}`);
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
        <TopTitle>알림</TopTitle>
        {unreadCount > 0 && (
          <ReadAllButton type="button" onClick={() => void handleMarkAllAsRead()}>
            모두 읽음
          </ReadAllButton>
        )}
      </TopBar>

      {loading && <CenterText>불러오는 중...</CenterText>}
      {error && <CenterText $error>{error}</CenterText>}
      {!loading && !error && notifications.length === 0 && (
        <CenterText>알림이 없습니다.</CenterText>
      )}

      <List>
        {notifications.map((item) => (
          <Item
            key={item.id}
            $unread={!item.isRead}
            onClick={() => void handleClickItem(item)}
          >
            <ItemAvatar />
            <ItemBody>
              <ItemActor>{item.actor.nickname}</ItemActor>
              <ItemDesc>{TYPE_LABEL[item.type] ?? item.type}</ItemDesc>
              <ItemDebate>{item.debate.title}</ItemDebate>
              <ItemDate>{formatDate(item.createdAt)}</ItemDate>
            </ItemBody>
            {!item.isRead && <UnreadDot />}
          </Item>
        ))}
      </List>
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

const ReadAllButton = styled.button`
  border: none;
  background: transparent;
  color: #2dcd97;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
`;

const CenterText = styled.p<{ $error?: boolean }>`
  text-align: center;
  color: ${({ $error }) => ($error ? '#f04444' : '#999')};
  font-size: 14px;
  margin-top: 60px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 0;
`;

const Item = styled.div<{ $unread: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ $unread }) => ($unread ? '#f0fdf8' : '#fff')};
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
`;

const ItemAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemActor = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #2f3238;
`;

const ItemDesc = styled.p`
  margin: 2px 0 4px;
  font-size: 13px;
  color: #555;
`;

const ItemDebate = styled.p`
  margin: 0 0 4px;
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemDate = styled.span`
  font-size: 11px;
  color: #bbb;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2dcd97;
  flex-shrink: 0;
  margin-top: 4px;
`;

export default NotificationPage;
