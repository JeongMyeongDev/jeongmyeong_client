import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import DebateMetadataModal from '../../components/debate/DebateMetadataModal';
import { useDebate } from '../../hooks/useDebate';
import type { Debate } from '../../types/debate';

// ─── Icons ────────────────────────────────────────────────────────────────────

const MenuIcon = () => <img src={iconMenu} width="22" height="22" alt="" />;

const SearchIcon = () => <img src={iconSearch} width="18" height="18" alt="" />;

const BellIcon = () => <img src={iconAlarm} width="22" height="22" alt="" />;

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

const DebateIcon = () => (
  <svg width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="42" cy="42" r="40" stroke="#A9A9A9" strokeWidth="3" />
    <path
      d="M28 39H53V49.5H37.7L28 55.8V39Z"
      stroke="#A9A9A9"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M34 28H59V38.4H43.8"
      stroke="#A9A9A9"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['예술', '연애', '요리', '게임', '스포츠', '정치'];

type DebateListItem = Pick<Debate, 'id' | 'title' | 'description' | 'status'>;
type FeaturedItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  participants: number;
  status: string;
  tag: string;
};

// ─── Sub Components ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  OPEN: '진행중',
  CLOSED: '종료',
  ARCHIVED: '보관',
  IN_PROGRESS: '진행중',
  WAITING: '준비중',
};

const StatusBadge = ({ status }: { status: string }) => {
  const label = STATUS_LABEL[status] ?? status;
  return <Badge $active={status === 'OPEN' || status === 'IN_PROGRESS'}>{label}</Badge>;
};

const FeaturedCard = ({
  item,
  onClick,
}: {
  item: FeaturedItem;
  onClick: () => void;
}) => (
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

const DebateCard = ({ item, onClick }: { item: DebateListItem; onClick: () => void }) => (
  <DCard onClick={onClick}>
    <DLeft>
      <DStatusBadge>
        {item.status === 'OPEN' ? '진행중' : '준비중'}
      </DStatusBadge>
      <DTitle>{item.title}</DTitle>
      <DDesc>{item.description}</DDesc>
    </DLeft>
    <DebateIcon />
  </DCard>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MainPage = () => {
  const navigate = useNavigate();
  const { debates, fetchDebates } = useDebate();
  const [activeCategory, setActiveCategory] = useState('예술');
  const [activeDot, setActiveDot] = useState(0);
  const [listError, setListError] = useState('');
  const [selectedDebate, setSelectedDebate] = useState<Debate | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDebates = async () => {
      try {
        await fetchDebates({
          status: 'OPEN',
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
  }, [fetchDebates]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    setActiveDot(Math.round(scrollLeft / offsetWidth));
  };

  const debateItems: DebateListItem[] = debates.map((debate) => ({
    id: debate.id,
    title: debate.title,
    description: debate.description,
    status: debate.status,
  }));

  const featuredItems: FeaturedItem[] = debates.slice(0, 5).map((debate) => ({
    id: debate.id,
    title: debate.title,
    description: debate.description,
    author: debate.creator?.nickname ?? '사용자',
    participants: 0,
    status: debate.status === 'OPEN' ? 'OPEN' : 'WAITING',
    tag: `#${debate.tagMaps?.[0]?.tag.name ?? activeCategory}`,
  }));

  const currentDot = Math.min(activeDot, Math.max(0, featuredItems.length - 1));
  const openDebateMetadata = (id: string) => {
    setSelectedDebate(debates.find((debate) => debate.id === id) ?? null);
  };

  const handleJoinDebate = () => {
    if (!selectedDebate) return;
    navigate(`/debate/${selectedDebate.id}`);
  };

  return (
    <Wrapper>
      {/* Logo */}
      <Logo>정명</Logo>

      {/* Header */}
      <Header>
        <IconBtn>
          <MenuIcon />
        </IconBtn>
        <SearchBar>
          <SearchIcon />
        </SearchBar>
        <IconBtn>
          <BellIcon />
        </IconBtn>
      </Header>

      {/* 뜨는 토론 */}
      <Section>
        <SectionTitle>뜨는 토론</SectionTitle>
        <SectionSub>지금 사람들이 많이 보고 있는 토론들이에요.</SectionSub>
        <CarouselWrapper ref={scrollRef} onScroll={handleScroll}>
          {featuredItems.map((item) => (
            <FeaturedCard key={item.id} item={item} onClick={() => openDebateMetadata(item.id)} />
          ))}
        </CarouselWrapper>
        <Dots>
          {featuredItems.map((_, i) => (
            <Dot key={i} $active={i === currentDot} />
          ))}
        </Dots>
      </Section>

      {/* Category Filter */}
      <CategoryRow>
        <FilterBtn>
          <FilterIcon />
        </FilterBtn>
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
        {listError && <ListError>{listError}</ListError>}
        {!listError && debateItems.length === 0 && <ListError>표시할 토론이 없습니다.</ListError>}
        {debateItems.map((item) => (
          <DebateCard key={item.id} item={item} onClick={() => openDebateMetadata(item.id)} />
        ))}
      </DebateList>
      {selectedDebate && (
        <DebateMetadataModal
          debate={selectedDebate}
          onClose={() => setSelectedDebate(null)}
          onJoin={handleJoinDebate}
        />
      )}
    </Wrapper>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  background: #f5f5f5;
  min-height: 100dvh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
`;

const SearchBar = styled.div`
  width: 226px;
  height: 40px;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 999px;
  padding: 0 18px;
  box-sizing: border-box;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  color: #4dc891;
  text-align: center;
  padding: 62px 0 16px;
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
  width: 330px;
  min-width: 330px;
  height: 248px;
  display: flex;
  flex-direction: column;
  position: relative;
  scroll-snap-align: start;
  background: #fff;
  border-radius: 24px;
  padding: 22px 20px 18px;
  cursor: pointer;
  box-sizing: border-box;
`;

const FTitle = styled.h3`
  margin: 4px 0 10px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #2f3238;
`;

const FDesc = styled.p`
  margin: 0 29.5px 18px;
  text-align: left;
  font-size: 14px;
  line-height: 1.3;
  color: #939393;
`;

const FMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 29.5px 18px;
`;

const FAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #adadad;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #b3b3b3;
`;

const FParticipants = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #adadad;
`;

const FTags = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  left: 49.5px;
  right: 49.5px;
  bottom: 48px;
  justify-content: space-between;
`;

const Badge = styled.span<{ $active: boolean }>`
  height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 22px;
  border-radius: 999px;
  border: 2px solid #2dcd97;
  font-size: 16px;
  font-weight: 600;
  background: ${({ $active }) => ($active ? '#2dcd97' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#2dcd97')};
`;

const TagPill = styled.span`
  height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 22px;
  border-radius: 999px;
  border: 2px solid #a8a8a8;
  font-size: 16px;
  background: transparent;
  color: #9f9f9f;
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 20px;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#4dc891' : '#ddd')};
  transition: background 0.25s;
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
  gap: 10px;
`;

const ListError = styled.p`
  font-size: 12px;
  color: #f04444;
  margin: 0 0 10px;
`;

const DCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 330px;
  height: 144px;
  background: #ffffff;
  border-radius: 24px;
  padding: 18px 16px;
  margin: 0 auto;
  box-sizing: border-box;
  cursor: pointer;
`;

const DLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const DStatusBadge = styled.span`
  height: 34px;
  padding: 0 24px;
  border-radius: 999px;
  border: 2px solid #2dcd97;
  color: #2dcd97;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
`;

const DTitle = styled.h4`
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #2f3238;
`;

const DDesc = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
  color: #8f8f8f;
`;

export default MainPage;
