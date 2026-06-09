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

  const archiveCards = useMemo(
    () => (Array.isArray(debates) ? debates : []).slice(0, 8).map(mapToArchiveCard),
    [debates],
  );

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
  background: transparent;
  padding: var(--page-top) var(--page-x) var(--page-bottom);
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin: 0 auto;
  margin-bottom: clamp(14px, 3.7vw, 16px);
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
  width: clamp(30px, 7.9vw, 34px);
  height: clamp(30px, 7.9vw, 34px);
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const TopIcon = styled.img`
  width: clamp(24px, 6.5vw, 28px);
  height: clamp(24px, 6.5vw, 28px);
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const FilterButton = styled.button`
  width: clamp(42px, 11.2vw, 48px);
  height: clamp(30px, 7.9vw, 34px);
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  height: clamp(30px, 7.4vw, 32px);
  padding: 0 clamp(12px, 3.3vw, 14px);
  border-radius: 999px;
  border: 1.5px solid ${({ $active }) => ($active ? '#2dcd97' : '#ababab')};
  background: ${({ $active }) => ($active ? '#2dcd97' : 'rgba(255, 255, 255, 0.58)')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#8f8f8f')};
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  font-size: var(--body-sm);
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
  background: var(--glass-surface-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--card-radius);
  padding: clamp(14px, 3.7vw, 16px) clamp(14px, 3.7vw, 16px) clamp(12px, 3.3vw, 14px);
  overflow: hidden;
  box-shadow: var(--glass-shadow-soft);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const ChatCircleIconImg = styled.img`
  width: clamp(42px, 11.6vw, 50px);
  height: clamp(42px, 11.6vw, 50px);
  flex-shrink: 0;
`;

const ClosedBadge = styled.span`
  height: clamp(26px, 7vw, 30px);
  padding: 0 clamp(12px, 3.3vw, 14px);
  border-radius: 999px;
  border: 1.5px solid #b7b7b7;
  color: #9f9f9f;
  font-size: var(--body-sm);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
`;

const CardTitle = styled.h3`
  margin: 0 0 8px;
  font-size: var(--title-sm);
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
  font-size: var(--body-sm);
  color: #8f8f8f;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export default DebateArchivePage;
