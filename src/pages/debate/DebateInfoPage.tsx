import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconStar from '../../assets/icon_star.svg';
import { debateService } from '../../services/debateService';
import type { Debate } from '../../types/debate';

const DEBATE_TYPE_LABEL_MAP: Record<Debate['debateType'], string> = {
  PROS_CONS: '찬반토론',
  CONSENSUS: '합의토론',
  FREE: '댓글토론',
};

const STATUS_LABEL_MAP: Record<Debate['status'], string> = {
  OPEN: '진행중',
  CLOSED: '종료',
  ARCHIVED: '보관',
};

const formatCreatedDate = (createdAt?: string) => {
  if (!createdAt) return '20XX. YY. ZZ';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '20XX. YY. ZZ';
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
  const [debate, setDebate] = useState<Debate | null>(null);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!debateId) return;

    const loadInfo = async () => {
      setIsLoading(true);
      setDebate(null);
      setParticipantNames([]);
      setPostCount(0);
      setLoadError('');

      try {
        const [detailResponse, postsResponse] = await Promise.all([
          debateService.getById(debateId),
          debateService.getMessages(debateId, { page: 1, limit: 50 }),
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
        setParticipantNames(Array.from(uniqueNames.values()).slice(0, 6));
        setPostCount(postsResponse.data.totalCount ?? posts.length);
        setLoadError('');
      } catch {
        setLoadError('토론 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInfo();
  }, [debateId]);

  const participants = useMemo(() => {
    if (participantNames.length > 0) return participantNames;
    return Array.from({ length: 6 }, () => '사용자이름');
  }, [participantNames]);

  if (isLoading) {
    return (
      <Wrapper>
        <HeaderRow>
          <HeaderIconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
            <BackIcon />
          </HeaderIconButton>
          <HeaderActions>
            <HeaderIconButton type="button" aria-label="저장">
              <TopIcon src={iconStar} alt="" />
            </HeaderIconButton>
            <HeaderIconButton type="button" aria-label="알림">
              <TopIcon src={iconAlarm} alt="" />
            </HeaderIconButton>
          </HeaderActions>
        </HeaderRow>
        <LoadingCard>토론 정보를 불러오는 중입니다.</LoadingCard>
      </Wrapper>
    );
  }

  if (loadError || !debate) {
    return (
      <Wrapper>
        <HeaderRow>
          <HeaderIconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
            <BackIcon />
          </HeaderIconButton>
          <HeaderActions>
            <HeaderIconButton type="button" aria-label="저장">
              <TopIcon src={iconStar} alt="" />
            </HeaderIconButton>
            <HeaderIconButton type="button" aria-label="알림">
              <TopIcon src={iconAlarm} alt="" />
            </HeaderIconButton>
          </HeaderActions>
        </HeaderRow>
        <ErrorText>{loadError || '토론 정보를 찾을 수 없습니다.'}</ErrorText>
      </Wrapper>
    );
  }

  const title = debate?.title ?? '기술 토론';
  const description = debate?.description ?? 'AI가 사람의 직업을 대체 할 수 있을까?';
  const tagLabel = `#${debate?.tagMaps?.[0]?.tag.name ?? '기술'}`;
  const creatorName = debate?.creator?.nickname ?? '디그슨';
  const debateTypeLabel = debate ? DEBATE_TYPE_LABEL_MAP[debate.debateType] : '찬반토론';
  const statusLabel = debate ? STATUS_LABEL_MAP[debate.status] : '진행중';
  const createdDateLabel = formatCreatedDate(debate?.createdAt);

  return (
    <Wrapper>
      <HeaderRow>
        <HeaderIconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <BackIcon />
        </HeaderIconButton>
        <HeaderActions>
          <HeaderIconButton type="button" aria-label="저장">
            <TopIcon src={iconStar} alt="" />
          </HeaderIconButton>
          <HeaderIconButton type="button" aria-label="알림">
            <TopIcon src={iconAlarm} alt="" />
          </HeaderIconButton>
        </HeaderActions>
      </HeaderRow>

      <Title>{title}</Title>
      <Description>{description}</Description>

      {loadError && <ErrorText>{loadError}</ErrorText>}

      <InfoCard>
        <Tag>{tagLabel}</Tag>
        <AuthorRow>
          <Avatar />
          <AuthorName>{creatorName}</AuthorName>
        </AuthorRow>
        <InfoText>토론 방식 : {debateTypeLabel}</InfoText>
        <InfoText>토론 상태 : 현재 {statusLabel}</InfoText>
        <InfoText>{createdDateLabel}</InfoText>
        <InfoText>조회수 : 5,234회</InfoText>
      </InfoCard>

      <ParticipantsCard>
        <ParticipantsTitle>현재 참여자</ParticipantsTitle>
        <ParticipantsList>
          {participants.map((name, index) => (
            <ParticipantRow key={`${name}-${index}`}>
              <ParticipantAvatar />
              <ParticipantName>{name}</ParticipantName>
            </ParticipantRow>
          ))}
        </ParticipantsList>
      </ParticipantsCard>

      <SummaryCard>
        <SummaryText>진행된 내용 : {postCount}개</SummaryText>
        <SummaryText>정의한 용어 : 무슨 뜻에 대한 무슨 용어</SummaryText>
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

const LoadingCard = styled.section`
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: clamp(18px, 5.1vw, 22px);
  color: #9a9a9a;
  font-size: var(--body-sm);
  text-align: center;
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

export default DebateInfoPage;
