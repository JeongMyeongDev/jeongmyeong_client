import { useRef, useState } from 'react';
import styled from 'styled-components';

// ─── Icons ────────────────────────────────────────────────────────────────────

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

const DebateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const FEATURED = [
  { id: '1', title: '기술 토론', description: 'AI가 사람의 직업을 대체 할 수 있을까?', author: '사용자 이름', participants: 3, status: 'WAITING', tag: '#기술' },
  { id: '2', title: '사회 토론', description: '기본소득은 실현 가능한가?', author: '사용자 이름', participants: 5, status: 'IN_PROGRESS', tag: '#사회' },
  { id: '3', title: '문화 토론', description: '웹툰은 예술의 한 형태인가?', author: '사용자 이름', participants: 2, status: 'WAITING', tag: '#문화' },
];

const CATEGORIES = ['예술', '연애', '요리', '게임', '스포츠', '정치'];

const DEBATES = Array.from({ length: 7 }, (_, i) => ({
  id: String(i + 1),
  title: '기술 토론',
  description: 'AI가 사람의 직업을 대체 할 수 있을까?',
  status: i % 3 === 1 ? 'IN_PROGRESS' : 'WAITING',
}));

// ─── Sub Components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => (
  <Badge $active={status === 'IN_PROGRESS'}>
    {status === 'IN_PROGRESS' ? '진행중' : '준비중'}
  </Badge>
);

const FeaturedCard = ({ item, onClick }: { item: typeof FEATURED[0]; onClick: () => void }) => (
  <FCard onClick={onClick}>
    <FTitle>{item.title}</FTitle>
    <FDesc>{item.description}</FDesc>
    <FMeta>
      <FAuthor>
        <Avatar />
        <span>{item.author}</span>
      </FAuthor>
      <FParticipants>
        <PersonIcon />
        <span>{item.participants}</span>
      </FParticipants>
    </FMeta>
    <FTags>
      <StatusBadge status={item.status} />
      <TagPill>{item.tag}</TagPill>
    </FTags>
  </FCard>
);

const DebateCard = ({ item }: { item: typeof DEBATES[0] }) => (
  <DCard>
    <DLeft>
      <StatusBadge status={item.status} />
      <DTitle>{item.title}</DTitle>
      <DDesc>{item.description}</DDesc>
    </DLeft>
    <DebateIconBox>
      <DebateIcon />
    </DebateIconBox>
  </DCard>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MainPage = () => {
  const [activeCategory, setActiveCategory] = useState('예술');
  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    setActiveDot(Math.round(scrollLeft / offsetWidth));
  };

  return (
    <Wrapper>
      {/* Header */}
      <Header>
        <IconBtn><MenuIcon /></IconBtn>
        <SearchBar>
          <SearchIcon />
          <SearchPlaceholder>검색</SearchPlaceholder>
        </SearchBar>
        <IconBtn><BellIcon /></IconBtn>
      </Header>

      {/* Logo */}
      <Logo>정명</Logo>

      {/* 뜨는 토론 */}
      <Section>
        <SectionTitle>뜨는 토론</SectionTitle>
        <SectionSub>지금 사람들이 많이 보고 있는 토론들이에요.</SectionSub>
        <CarouselWrapper ref={scrollRef} onScroll={handleScroll}>
          {FEATURED.map((item) => (
            <FeaturedCard key={item.id} item={item} onClick={() => {}} />
          ))}
        </CarouselWrapper>
        <Dots>
          {FEATURED.map((_, i) => (
            <Dot key={i} $active={i === activeDot} />
          ))}
        </Dots>
      </Section>

      {/* Category Filter */}
      <CategoryRow>
        <FilterBtn><FilterIcon /></FilterBtn>
        <CategoryScroll>
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              $active={cat === activeCategory}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </CategoryPill>
          ))}
        </CategoryScroll>
      </CategoryRow>

      {/* Debate List */}
      <DebateList>
        {DEBATES.map((item) => (
          <DebateCard key={item.id} item={item} />
        ))}
      </DebateList>
    </Wrapper>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  background: #fff;
  min-height: 100dvh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const SearchBar = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f3f3f3;
  border-radius: 999px;
  padding: 8px 14px;
`;

const SearchPlaceholder = styled.span`
  font-size: 13px;
  color: #aaa;
`;

const Logo = styled.h1`
  font-size: 36px;
  font-weight: 800;
  color: #4dc891;
  text-align: center;
  padding: 4px 0 16px;
  letter-spacing: -1px;
`;

const Section = styled.div`
  padding: 0 16px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
`;

const SectionSub = styled.p`
  font-size: 12px;
  color: #999;
  margin-bottom: 14px;
`;

const CarouselWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 12px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FCard = styled.div`
  min-width: 100%;
  scroll-snap-align: start;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
`;

const FTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
`;

const FDesc = styled.p`
  font-size: 13px;
  color: #666;
  margin-bottom: 14px;
`;

const FMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const FAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #888;
`;

const Avatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e0e0e0;
`;

const FParticipants = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #888;
`;

const FTags = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $active }) => ($active ? '#4dc891' : '#e8f8f0')};
  color: ${({ $active }) => ($active ? '#fff' : '#4dc891')};
`;

const TagPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: #f3f3f3;
  color: #888;
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 20px;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '16px' : '6px')};
  height: 6px;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#4dc891' : '#ddd')};
  transition: width 0.25s, background 0.25s;
`;

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 12px;
`;

const FilterBtn = styled.button`
  background: none;
  border: none;
  color: #555;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const CategoryScroll = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryPill = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 999px;
  border: none;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  background: ${({ $active }) => ($active ? '#4dc891' : '#f3f3f3')};
  color: ${({ $active }) => ($active ? '#fff' : '#666')};
  cursor: pointer;
`;

const DebateList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  gap: 1px;
`;

const DCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f3f3f3;
  cursor: pointer;
`;

const DLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DTitle = styled.h4`
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
`;

const DDesc = styled.p`
  font-size: 12px;
  color: #999;
`;

const DebateIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1.5px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 12px;
`;

export default MainPage;
