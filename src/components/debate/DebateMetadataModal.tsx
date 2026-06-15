import styled from 'styled-components';
import type { Debate, DebateType } from '../../types/debate';

interface DebateMetadataModalProps {
  debate: Debate;
  onClose: () => void;
  onJoin: () => void;
}

const DEBATE_TYPE_LABEL: Record<DebateType, string> = {
  PROS_CONS: '찬반토론',
  CONSENSUS: '합의토론',
  FREE: '일반 토론',
};

const formatDate = (date?: string) => {
  if (!date) return '날짜 정보 없음';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const DebateMetadataModal = ({ debate, onClose, onJoin }: DebateMetadataModalProps) => {
  const tagName = debate.tagMaps?.[0]?.tag.name;
  const creatorName = debate.creator?.nickname ?? '사용자 이름';
  const participantCount = debate.participantCount ?? debate.participants?.length ?? 0;

  return (
    <Overlay role="dialog" aria-modal="true" aria-labelledby="debate-metadata-title">
      <ModalCard>
        <TopRow>
          <IconButton type="button" aria-label="닫기" onClick={onClose}>
            ←
          </IconButton>
          <IconButton type="button" aria-label="더보기">
            ⋮
          </IconButton>
        </TopRow>

        <Content>
          <Title id="debate-metadata-title">{debate.title}</Title>
          <Description>{debate.description}</Description>

          {tagName && <TagPill>#{tagName}</TagPill>}

          <ProfileRow>
            <Avatar />
            <CreatorName>{creatorName}</CreatorName>
          </ProfileRow>

          <MetaText>토론 방식 : {DEBATE_TYPE_LABEL[debate.debateType]}</MetaText>
          <MetaText>참여 인원 : {participantCount}</MetaText>
          <MetaText>{formatDate(debate.createdAt)}</MetaText>
        </Content>

        <BottomRow>
          <SmallActions>
            <SmallIconButton type="button" aria-label="저장">
              ☆
            </SmallIconButton>
            <SmallIconButton type="button" aria-label="알림">
              ♧
            </SmallIconButton>
          </SmallActions>
          <JoinButton type="button" onClick={onJoin}>
            참여하기
          </JoinButton>
        </BottomRow>
      </ModalCard>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 30, 30, 0.2);
  padding: clamp(18px, 5.6vw, 24px);
`;

const ModalCard = styled.section`
  width: min(354px, 100%);
  min-height: min(530px, calc(100dvh - 48px));
  border-radius: clamp(34px, 9.3vw, 40px);
  background: #ffffff;
  padding: clamp(36px, 11.2vw, 48px) clamp(18px, 5.6vw, 24px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const IconButton = styled.button`
  width: clamp(36px, 9.3vw, 40px);
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  background: transparent;
  color: #2f3238;
  font-size: clamp(24px, 6.5vw, 28px);
  line-height: 1;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 3.7vw, 16px);
  align-items: flex-start;
`;

const Title = styled.h2`
  align-self: center;
  margin: 0;
  color: #2f3238;
  font-size: var(--body-md);
  font-weight: 700;
`;

const Description = styled.p`
  margin: 0;
  width: 100%;
  color: #aeaeae;
  font-size: var(--body-sm);
  line-height: 1.45;
  text-align: center;
`;

const TagPill = styled.span`
  min-height: clamp(32px, 8.4vw, 36px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: clamp(5px, 1.4vw, 6px) clamp(12px, 3.7vw, 16px);
  border: 1px solid #9b9b9b;
  border-radius: 234px;
  color: #9b9b9b;
  font-size: var(--body-md);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Avatar = styled.div`
  width: clamp(18px, 4.7vw, 20px);
  height: clamp(18px, 4.7vw, 20px);
  border-radius: 50%;
  background: #cfcfcf;
`;

const CreatorName = styled.span`
  color: #b7b7b7;
  font-size: var(--body-sm);
`;

const MetaText = styled.p`
  margin: 0;
  color: #aeaeae;
  font-size: var(--body-sm);
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(10px, 3.7vw, 16px);
`;

const SmallActions = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(10px, 3.7vw, 16px);
`;

const SmallIconButton = styled.button`
  width: clamp(36px, 9.3vw, 40px);
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  background: transparent;
  color: #2f3238;
  font-size: clamp(22px, 5.6vw, 24px);
`;

const JoinButton = styled.button`
  width: min(194px, 52vw);
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  border-radius: 32px;
  background: #2d9;
  color: #ffffff;
  font-size: var(--body-md);
  font-weight: 600;
`;

export default DebateMetadataModal;
