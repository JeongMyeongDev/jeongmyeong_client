import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import btnDscionControl from '../../assets/btn_dscion_control.svg';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconAlarm2 from '../../assets/icon_alarm2.svg';
import iconChat from '../../assets/icon_chat.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import iconShowInfo from '../../assets/icon_show_info.svg';
import iconStar from '../../assets/icon_star.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useDebate } from '../../hooks/useDebate';
import type { Debate } from '../../types/debate';

type DebateRoomCard = {
  id: string;
  title: string;
  description: string;
  statusLabel: '준비중' | '진행중';
  creatorName: string;
  debateTypeLabel: string;
  participants: number;
  tagLabel: string;
  createdDateLabel: string;
};

const FILTER_ITEMS = ['찬반토론', '합의토론', '댓글토론'];
const FILTER_TYPE_MAP: Record<string, 'PROS_CONS' | 'CONSENSUS' | 'FREE'> = {
  찬반토론: 'PROS_CONS',
  합의토론: 'CONSENSUS',
  댓글토론: 'FREE',
};
const DEBATE_TYPE_LABEL_MAP: Record<Debate['debateType'], string> = {
  PROS_CONS: '찬반토론',
  CONSENSUS: '합의토론',
  FREE: '댓글토론',
};

const formatCreatedDate = (createdAt?: string) => {
  if (!createdAt) return '20XX. YY. ZZ';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '20XX. YY. ZZ';
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}`;
};

const mapToRoomCard = (debate: Debate): DebateRoomCard => ({
  id: debate.id,
  title: debate.title,
  description: debate.description,
  statusLabel: debate.status === 'OPEN' ? '진행중' : '준비중',
  creatorName: debate.creator?.nickname ?? '사용자 이름',
  debateTypeLabel: DEBATE_TYPE_LABEL_MAP[debate.debateType],
  participants: 3,
  tagLabel: `#${debate.tagMaps?.[0]?.tag.name ?? '기술'}`,
  createdDateLabel: formatCreatedDate(debate.createdAt),
});

const FilterIcon = () => <img src={btnDscionControl} width="48" height="34" alt="" />;

const BackIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2.2">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const ModalMenuIcon = () => <img src={iconShowInfo} width="34" height="34" alt="" />;

const DebatePage = () => {
  const navigate = useNavigate();
  const { debates, fetchDebates } = useDebate();
  const [activeFilter, setActiveFilter] = useState('찬반토론');
  const [listError, setListError] = useState('');
  const [selectedCard, setSelectedCard] = useState<DebateRoomCard | null>(null);

  useEffect(() => {
    const loadDebates = async () => {
      try {
        await fetchDebates({
          status: 'OPEN',
          type: FILTER_TYPE_MAP[activeFilter],
          sort: 'updatedAt',
          direction: 'desc',
          limit: 20,
        });
        setListError('');
      } catch {
        setListError('토론 목록을 불러오지 못했습니다.');
      }
    };
    void loadDebates();
  }, [activeFilter, fetchDebates]);

  const cards = useMemo(
    () => debates.slice(0, 8).map(mapToRoomCard),
    [debates],
  );

  return (
    <Wrapper>
      <Logo src={logoSymbol} alt="정명" />

      <HeaderRow>
        <SideButton type="button" aria-label="메뉴">
          <TopIcon src={iconMenu} alt="" />
        </SideButton>
        <HeaderRight>
          <SideButton type="button" aria-label="검색">
            <TopIcon src={iconSearch} alt="" />
          </SideButton>
          <SideButton type="button" aria-label="알림">
            <TopIcon src={iconAlarm} alt="" />
          </SideButton>
        </HeaderRight>
      </HeaderRow>

      <FilterRow>
        <FilterButton type="button" aria-label="필터">
          <FilterIcon />
        </FilterButton>
        {FILTER_ITEMS.map((item) => (
          <FilterChip
            key={item}
            type="button"
            $active={activeFilter === item}
            onClick={() => setActiveFilter(item)}
          >
            {item}
          </FilterChip>
        ))}
      </FilterRow>

      <ListWrap>
        {listError && <ErrorText>{listError}</ErrorText>}
        {!listError && cards.length === 0 && <ErrorText>등록된 토론이 없습니다.</ErrorText>}
        {cards.map((card) => (
          <Card key={card.id} onClick={() => setSelectedCard(card)}>
            <CardTop>
              <StatusBadge $running={card.statusLabel === '진행중'}>
                {card.statusLabel}
              </StatusBadge>
              <ChatCircleIconImg src={iconChat} alt="" />
            </CardTop>
            <CardTitle>{card.title}</CardTitle>
            <CardDesc>{card.description}</CardDesc>
          </Card>
        ))}
      </ListWrap>

      {selectedCard && (
        <ModalOverlay onClick={() => setSelectedCard(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTop>
              <ModalIconButton type="button" aria-label="닫기" onClick={() => setSelectedCard(null)}>
                <BackIcon />
              </ModalIconButton>
              <ModalIconButton
                type="button"
                aria-label="토론 정보 보기"
                onClick={() => {
                  navigate(`/debate/${selectedCard.id}/info`);
                  setSelectedCard(null);
                }}
              >
                <ModalMenuIcon />
              </ModalIconButton>
            </ModalTop>

            <ModalTitle>{selectedCard.title}</ModalTitle>
            <ModalDesc>{selectedCard.description}</ModalDesc>
            <ModalTag>{selectedCard.tagLabel}</ModalTag>

            <ModalAuthorRow>
              <ModalAvatar />
              <span>{selectedCard.creatorName}</span>
            </ModalAuthorRow>

            <ModalMeta>토론 방식 : {selectedCard.debateTypeLabel}</ModalMeta>
            <ModalMeta>참여 인원 : {selectedCard.participants}</ModalMeta>
            <ModalMeta>{selectedCard.createdDateLabel}</ModalMeta>

            <ModalActionRow>
              <ModalActionIconButton type="button" aria-label="저장">
                <ModalActionIcon src={iconStar} alt="" />
              </ModalActionIconButton>
              <ModalActionIconButton type="button" aria-label="알림">
                <ModalAlarmIcon src={iconAlarm2} alt="" />
              </ModalActionIconButton>
              <JoinButton type="button">참여하기</JoinButton>
            </ModalActionRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 62px 14px 90px;
`;

const Logo = styled.img`
  width: 68px;
  height: 40px;
  display: block;
  margin: 0 auto;
  margin-bottom: 16px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SideButton = styled.button`
  width: 34px;
  height: 34px;
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const TopIcon = styled.img`
  width: 28px;
  height: 28px;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const FilterButton = styled.button`
  width: 48px;
  height: 34px;
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1.5px solid ${({ $active }) => ($active ? '#2dcd97' : '#9f9f9f')};
  background: ${({ $active }) => ($active ? '#2dcd97' : '#f3f3f3')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#8f8f8f')};
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
`;

const ListWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #f04444;
`;

const Card = styled.article`
  background: #ffffff;
  border-radius: 20px;
  padding: 12px 14px 14px;
  overflow: hidden;
  cursor: pointer;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const ChatCircleIconImg = styled.img`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
`;

const StatusBadge = styled.span<{ $running: boolean }>`
  width: 43px;
  height: 26px;
  padding: 0;
  border-radius: 999px;
  border: 1.2px solid #2dcd97;
  background: ${({ $running }) => ($running ? '#2dcd97' : 'transparent')};
  color: ${({ $running }) => ($running ? '#ffffff' : '#2dcd97')};
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
`;

const CardTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 20px;
  line-height: 1.15;
  color: #333333;
  font-weight: 700;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8f8f8f;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 300;
`;

const ModalCard = styled.div`
  width: min(100%, 354px);
  background: #ffffff;
  border-radius: 42px;
  padding: 22px 20px 22px;
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
`;

const ModalTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalIconButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  text-align: center;
  font-size: 40px;
  font-weight: 700;
  color: #2f3238;
  line-height: 1.2;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalDesc = styled.p`
  margin: 10px 0 16px;
  text-align: center;
  font-size: 17px;
  color: #8f8f8f;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalTag = styled.span`
  display: inline-flex;
  height: 42px;
  align-items: center;
  border: 1.5px solid #a7a7a7;
  border-radius: 999px;
  color: #9f9f9f;
  font-size: 20px;
  font-weight: 600;
  padding: 0 20px;
  margin-bottom: 14px;
`;

const ModalAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #a4a4a4;
  margin-bottom: 20px;
`;

const ModalAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #b8b8b8;
`;

const ModalMeta = styled.p`
  margin: 0 0 10px;
  font-size: 15px;
  color: #9a9a9a;
`;

const ModalActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 26px;
`;

const ModalActionIconButton = styled.button`
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ModalActionIcon = styled.img`
  width: 32px;
  height: 32px;
`;

const ModalAlarmIcon = styled(ModalActionIcon)`
  width: 22px;
  height: 22px;
`;

const JoinButton = styled.button`
  flex: 1;
  height: 56px;
  border-radius: 999px;
  border: none;
  background: #2dcd97;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
`;

export default DebatePage;
