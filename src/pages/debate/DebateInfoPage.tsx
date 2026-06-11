import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconStar from '../../assets/icon_star.svg';
import { DebateInfoSkeleton } from '../../components/common/PageSkeletons';
import { debateService } from '../../services/debateService';
import { definitionService } from '../../services/definitionService';
import { usePageLoading } from '../../hooks/usePageLoading';
import type { Debate, Definition } from '../../types/debate';

const DEBATE_TYPE_LABEL_MAP: Record<Debate['debateType'], string> = {
  PROS_CONS: '찬반토론',
  CONSENSUS: '합의토론',
  FREE: '일반 토론',
};

const STATUS_LABEL_MAP: Record<Debate['status'], string> = {
  OPEN: '진행중',
  CLOSED: '종료',
  ARCHIVED: '보관',
};

const formatCreatedDate = (createdAt?: string) => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}`;
};

const BackIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2.2">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const DebateInfoPage = () => {
  const navigate = useNavigate();
  const { id: debateId } = useParams();
  const { isLoading, showLoadingUI, error, executeAsync } = usePageLoading();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [actionMessage, setActionMessage] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!debateId) return;

    const loadInfo = async () => {
      await executeAsync(async () => {
        setDebate(null);
        setDefinitions([]);
        setParticipantNames([]);
        setPostCount(0);

        const [detailResponse, postsResponse, definitionsResponse] = await Promise.all([
          debateService.getById(debateId),
          debateService.getMessages(debateId, { page: 1, limit: 50 }),
          definitionService.getByDebate(debateId),
        ]);

        const loadedDebate = detailResponse.data.debate;
        const posts = postsResponse.data.posts;
        const uniqueNames = new Map<string, string>();

        if (loadedDebate.creator?.nickname) {
          uniqueNames.set(loadedDebate.creator.id, loadedDebate.creator.nickname);
        }

        posts.forEach((post) => {
          uniqueNames.set(post.author.id, post.author.nickname);
        });

        setDebate(loadedDebate);
        setDefinitions(definitionsResponse.data.definitions);
        setParticipantNames(Array.from(uniqueNames.values()).slice(0, 6));
        setPostCount(postsResponse.data.totalCount ?? posts.length);
      });
    };

    void loadInfo();
  }, [debateId, executeAsync]);

  const renderHeader = () => (
    <HeaderRow>
      <HeaderIconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
        <BackIcon />
      </HeaderIconButton>
      <HeaderActions>
        <HeaderIconButton type="button" aria-label="저장" onClick={() => void handleBookmarkToggle()}>
          <TopIcon src={iconStar} alt="" />
        </HeaderIconButton>
        <HeaderIconButton type="button" aria-label="알림" onClick={() => void handleSubscriptionToggle()}>
          <TopIcon src={iconAlarm} alt="" />
        </HeaderIconButton>
      </HeaderActions>
    </HeaderRow>
  );

  const handleJoin = async () => {
    if (!debateId) return;
    try {
      await debateService.join(debateId);
      setActionMessage('토론에 참여했습니다.');
      navigate(`/debate/${debateId}`);
    } catch {
      setActionMessage('토론 참여에 실패했습니다.');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!debateId) return;
    try {
      if (isBookmarked) {
        await debateService.unbookmark(debateId);
        setIsBookmarked(false);
        setActionMessage('저장을 해제했습니다.');
      } else {
        await debateService.bookmark(debateId);
        setIsBookmarked(true);
        setActionMessage('토론을 저장했습니다.');
      }
    } catch {
      setActionMessage('저장 상태를 변경하지 못했습니다.');
    }
  };

  const handleSubscriptionToggle = async () => {
    if (!debateId) return;
    try {
      if (isSubscribed) {
        await debateService.unsubscribe(debateId);
        setIsSubscribed(false);
        setActionMessage('알림 구독을 해제했습니다.');
      } else {
        await debateService.subscribe(debateId);
        setIsSubscribed(true);
        setActionMessage('토론 알림을 구독했습니다.');
      }
    } catch {
      setActionMessage('알림 설정을 변경하지 못했습니다.');
    }
  };

  if (isLoading && !debate) {
    return (
      <Wrapper>
        {renderHeader()}
        {showLoadingUI && <DebateInfoSkeleton />}
      </Wrapper>
    );
  }

  if (error || !debate) {
    return (
      <Wrapper>
        {renderHeader()}
        <ErrorText>{error || '토론 정보를 찾을 수 없습니다.'}</ErrorText>
      </Wrapper>
    );
  }

  const tagName = debate.tagMaps?.[0]?.tag.name;
  const creatorName = debate.creator?.nickname ?? '';
  const createdDateLabel = formatCreatedDate(debate.createdAt);
  return (
    <Wrapper>
      {renderHeader()}

      <Title>{debate.title}</Title>
      <Description>{debate.description}</Description>
      <JoinButton type="button" onClick={() => void handleJoin()}>
        참여하기
      </JoinButton>
      {actionMessage && <ActionMessage>{actionMessage}</ActionMessage>}

      <InfoCard>
        {tagName && <Tag>#{tagName}</Tag>}
        {creatorName && (
          <AuthorRow>
            <Avatar />
            <AuthorName>{creatorName}</AuthorName>
          </AuthorRow>
        )}
        <InfoText>토론 방식 : {DEBATE_TYPE_LABEL_MAP[debate.debateType]}</InfoText>
        <InfoText>토론 상태 : 현재 {STATUS_LABEL_MAP[debate.status]}</InfoText>
        {createdDateLabel && <InfoText>{createdDateLabel}</InfoText>}
      </InfoCard>

      <ParticipantsCard>
        <ParticipantsTitle>현재 참여자</ParticipantsTitle>
        <ParticipantsList>
          {participantNames.length > 0 ? (
            participantNames.map((name, index) => (
              <ParticipantRow key={`${name}-${index}`}>
                <ParticipantAvatar />
                <ParticipantName>{name}</ParticipantName>
              </ParticipantRow>
            ))
          ) : (
            <EmptyText>아직 참여자가 없습니다.</EmptyText>
          )}
        </ParticipantsList>
      </ParticipantsCard>

      <SummaryCard>
        <SummaryText>진행된 의견 : {postCount}개</SummaryText>
        <DefinitionTitle>이 토론의 기준 정의</DefinitionTitle>
        {definitions.length > 0 ? (
          <DefinitionList>
            {definitions.map((definition) => (
              <DefinitionItem key={definition.id}>
                <DefinitionTerm>{definition.term}</DefinitionTerm>
                <DefinitionContent>{definition.content}</DefinitionContent>
              </DefinitionItem>
            ))}
          </DefinitionList>
        ) : (
          <EmptyText>아직 승인된 기준 정의가 없습니다.</EmptyText>
        )}
      </SummaryCard>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: clamp(20px, 5.6vw, 24px) var(--page-x) clamp(26px, 7vw, 30px);
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(18px, 6vw, 26px);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeaderIconButton = styled.button`
  width: clamp(30px, 7.9vw, 34px);
  height: clamp(30px, 7.9vw, 34px);
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const TopIcon = styled.img`
  width: var(--icon-size);
  height: var(--icon-size);
`;

const JoinButton = styled.button`
  width: 100%;
  height: 48px;
  margin: 0 0 14px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--body-md);
  font-weight: 700;
`;

const ActionMessage = styled.p`
  margin: -4px 0 12px;
  text-align: center;
  color: #2dcd97;
  font-size: 13px;
`;

const Title = styled.h1`
  margin: 0;
  text-align: center;
  font-size: clamp(32px, 11.2vw, 48px);
  font-weight: 700;
  color: #2f3238;
  line-height: 1.2;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const Description = styled.p`
  margin: clamp(10px, 2.8vw, 12px) 0 clamp(18px, 5.1vw, 22px);
  text-align: center;
  font-size: var(--body-md);
  color: #9a9a9a;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ErrorText = styled.p`
  margin: 0 0 12px;
  color: #f04444;
  font-size: 12px;
`;

const InfoCard = styled.section`
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: clamp(12px, 3.3vw, 14px) clamp(12px, 3.3vw, 14px) clamp(14px, 3.7vw, 16px);
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: clamp(26px, 7vw, 30px);
  min-width: clamp(58px, 15.6vw, 67px);
  max-width: 100%;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #b0b0b0;
  color: #9e9e9e;
  font-size: var(--body-md);
  font-weight: 600;
  margin-bottom: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: clamp(36px, 9.8vw, 42px);
  height: clamp(36px, 9.8vw, 42px);
  border-radius: 50%;
  background: #b8b8b8;
`;

const AuthorName = styled.span`
  font-size: 15px;
  color: #8f8f8f;
`;

const InfoText = styled.p`
  margin: 0 0 10px;
  font-size: 15px;
  color: #9a9a9a;
`;

const ParticipantsCard = styled.section`
  margin-top: 14px;
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: clamp(14px, 3.7vw, 16px) clamp(12px, 3.3vw, 14px) clamp(10px, 2.8vw, 12px);
`;

const ParticipantsTitle = styled.h2`
  margin: 0 0 8px;
  font-size: clamp(15px, 4vw, 17px);
  color: #8f8f8f;
  font-weight: 500;
`;

const ParticipantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ParticipantAvatar = styled.div`
  width: clamp(36px, 9.8vw, 42px);
  height: clamp(36px, 9.8vw, 42px);
  border-radius: 50%;
  background: #b8b8b8;
  flex-shrink: 0;
`;

const ParticipantName = styled.span`
  color: #8f8f8f;
  font-size: 15px;
`;

const EmptyText = styled.p`
  margin: 0;
  color: #9a9a9a;
  font-size: var(--body-sm);
`;

const SummaryCard = styled.section`
  margin-top: 14px;
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: clamp(12px, 3.3vw, 14px);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryText = styled.p`
  margin: 0;
  font-size: var(--body-sm);
  color: #9a9a9a;
`;

const DefinitionTitle = styled.h2`
  margin: 4px 0 0;
  font-size: var(--body-sm);
  color: #8f8f8f;
  font-weight: 600;
`;

const DefinitionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DefinitionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DefinitionTerm = styled.span`
  font-size: var(--body-sm);
  color: #8f8f8f;
  font-weight: 600;
`;

const DefinitionContent = styled.p`
  margin: 0;
  font-size: var(--body-sm);
  color: #9a9a9a;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export default DebateInfoPage;
