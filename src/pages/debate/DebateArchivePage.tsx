import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import SideDrawer from '../../components/common/SideDrawer';
import btnDscionControl from '../../assets/btn_dscion_control.svg';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconChat from '../../assets/icon_chat.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useDebate } from '../../hooks/useDebate';
import type { Debate } from '../../types/debate';

type ArchiveCardItem = {
  id: string;
  title: string;
  description: string;
};

const FILTER_ITEMS = ['찬반토론', '합의토론', '댓글토론'];
const FILTER_TYPE_MAP: Record<string, 'PROS_CONS' | 'CONSENSUS' | 'FREE'> = {
  찬반토론: 'PROS_CONS',
  합의토론: 'CONSENSUS',
  댓글토론: 'FREE',
};

const mapToArchiveCard = (debate: Debate): ArchiveCardItem => ({
  id: debate.id,
  title: debate.title,
  description: debate.description,
});

const FilterIcon = () => <img src={btnDscionControl} width="48" height="34" alt="" />;

const DebateArchivePage = () => {
  const navigate = useNavigate();
  const { debates, fetchArchivedDebates } = useDebate();
  const [activeFilter, setActiveFilter] = useState('찬반토론');
  const [listError, setListError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const loadDebates = async () => {
      try {
        await fetchArchivedDebates({
          type: FILTER_TYPE_MAP[activeFilter],
          sort: 'archivedAt',
          direction: 'desc',
          limit: 20,
        });
        setListError('');
      } catch {
        setListError('보관 토론 목록을 불러오지 못했습니다.');
      }
    };
    void loadDebates();
  }, [activeFilter, fetchArchivedDebates]);

  const archiveCards = useMemo(() => debates.slice(0, 8).map(mapToArchiveCard), [debates]);

  return (
    <Wrapper>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <Logo src={logoSymbol} alt="정명" />

      <HeaderRow>
        <SideButton type="button" aria-label="메뉴" onClick={() => setIsDrawerOpen(true)}>
          <TopIcon src={iconMenu} alt="" />
        </SideButton>
        <HeaderRight>
          <SideButton type="button" aria-label="검색">
            <TopIcon src={iconSearch} alt="" />
          </SideButton>
          <SideButton type="button" aria-label="알림" onClick={() => navigate('/message')}>
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
        {!listError && archiveCards.length === 0 && <ErrorText>보관된 토론이 없습니다.</ErrorText>}
        {archiveCards.map((card) => (
          <Card key={card.id}>
            <CardTop>
              <ClosedBadge>종결됨</ClosedBadge>
              <ChatCircleIconImg src={iconChat} alt="" />
            </CardTop>
            <CardTitle>{card.title}</CardTitle>
            <CardDesc>{card.description}</CardDesc>
          </Card>
        ))}
      </ListWrap>
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
  border: none;
  background: transparent;
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
  margin-bottom: 16px;
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
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1.5px solid ${({ $active }) => ($active ? '#2dcd97' : '#ababab')};
  background: ${({ $active }) => ($active ? '#2dcd97' : '#f3f3f3')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#8f8f8f')};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? '600' : '500')};
  white-space: nowrap;
`;

const ListWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #f04444;
`;

const Card = styled.article`
  background: #f8f8f8;
  border-radius: 24px;
  padding: 16px 16px 14px;
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const ChatCircleIconImg = styled.img`
  width: 50px;
  height: 50px;
  flex-shrink: 0;
`;

const ClosedBadge = styled.span`
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1.5px solid #b7b7b7;
  color: #9f9f9f;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
`;

const CardTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #2f3238;
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

export default DebateArchivePage;
