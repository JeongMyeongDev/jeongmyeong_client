import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LoadingContent } from '../../components/common/LoadingContent';
import { NotificationListSkeleton } from '../../components/common/PageSkeletons';
import { MESSAGES } from '../../constants/messages';
import { NOTIFICATION_TYPE_LABELS } from '../../constants/notification';
import { NOTIFICATION_LIMIT } from '../../constants/pagination';
import { debateThreadPath } from '../../constants/routes';
import { usePageLoading } from '../../hooks/usePageLoading';
import { notificationService, type Notification } from '../../services/notificationService';
import { formatRelativeTime } from '../../utils/dateFormat';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { isLoading, showLoadingUI, error, executeAsync } = usePageLoading();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await executeAsync(async () => {
        const { data } = await notificationService.getAll({ page: 1, limit: NOTIFICATION_LIMIT });
        return data;
      });
      if (result) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setPage(result.page);
        setHasMore(result.hasMore);
      }
    };
    void load();
  }, [executeAsync]);

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data } = await notificationService.getAll({
        page: page + 1,
        limit: NOTIFICATION_LIMIT,
      });
      setNotifications((prev) => [...prev, ...data.notifications]);
      setUnreadCount(data.unreadCount);
      setPage(data.page);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClickItem = async (item: Notification) => {
    if (!item.isRead) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    // TODO: support deep link to post/comment/consensus by referenceId.
    navigate(debateThreadPath(item.debateId));
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

      {error && <CenterText $error>{error}</CenterText>}
      {!isLoading && !error && notifications.length === 0 && (
        <CenterText>알림이 없습니다.</CenterText>
      )}

      <LoadingContent
        isLoading={isLoading}
        showLoadingUI={showLoadingUI}
        skeleton={<NotificationListSkeleton count={5} />}
      >
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
                <ItemDesc>{NOTIFICATION_TYPE_LABELS[item.type] ?? MESSAGES.UNKNOWN_NOTIFICATION}</ItemDesc>
                <ItemDebate>{item.debate.title}</ItemDebate>
                <ItemDate>{formatRelativeTime(item.createdAt)}</ItemDate>
              </ItemBody>
              {!item.isRead && <UnreadDot />}
            </Item>
          ))}
        </List>
      </LoadingContent>

      {hasMore && !isLoading && !error && (
        <LoadMoreButton type="button" onClick={() => void handleLoadMore()} disabled={loadingMore}>
          {loadingMore ? '불러오는 중...' : '더 보기'}
        </LoadMoreButton>
      )}
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

const LoadMoreButton = styled.button`
  display: block;
  width: calc(100% - 32px);
  height: 44px;
  margin: 12px 16px 0;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;

  &:disabled {
    opacity: 0.6;
  }
`;

export default NotificationPage;
