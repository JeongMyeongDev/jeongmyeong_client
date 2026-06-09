import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import SideDrawer from '../../components/common/SideDrawer';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconAlarm2 from '../../assets/icon_alarm2.svg';
import btnDscionControl from '../../assets/btn_dscion_control.svg';
import iconChat from '../../assets/icon_chat.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import iconShowInfo from '../../assets/icon_show_info.svg';
import iconStar from '../../assets/icon_star.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useDebate } from '../../hooks/useDebate';
import type { Debate } from '../../types/debate';

// ─── Icons ────────────────────────────────────────────────────────────────────

const MenuIcon = () => <img src={iconMenu} width="22" height="22" alt="" />;

const SearchIcon = () => <img src={iconSearch} width="18" height="18" alt="" />;

const BellIcon = () => <img src={iconAlarm} width="22" height="22" alt="" />;

const FilterIcon = () => <img src={btnDscionControl} width="48" height="34" alt="" />;

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BackIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2.2">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const ModalMenuIcon = () => <img src={iconShowInfo} width="34" height="34" alt="" />;

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['전체', '예술', '연애', '요리', '게임', '스포츠', '정치'];

type ModalDebateItem = {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  debateTypeLabel: string;
  participants: number;
  tag: string;
  createdDateLabel: string;
};

type DebateListItem = Pick<Debate, 'id' | 'title' | 'description' | 'status'> & {
  modalData: ModalDebateItem;
};
type FeaturedItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  participants: number;
  status: string;
  tag: string;
  modalData: ModalDebateItem;
};

// ─── Sub Components ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  OPEN: '진행중',
  CLOSED: '종료',
  ARCHIVED: '보관',
  IN_PROGRESS: '진행중',
  WAITING: '준비중',
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

const mapDebateToModalItem = (debate: Debate): ModalDebateItem => ({
  id: debate.id,
  title: debate.title,
  description: debate.description,
  creatorName: debate.creator?.nickname ?? '사용자 이름',
  debateTypeLabel: DEBATE_TYPE_LABEL_MAP[debate.debateType],
  participants: 3,
  tag: `#${debate.tagMaps?.[0]?.tag.name ?? '기술'}`,
  createdDateLabel: formatCreatedDate(debate.createdAt),
});

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
  <FCard data-feature-card="true" onClick={onClick}>
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
    <DebateIconImg src={iconChat} alt="" />
  </DCard>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MainPage = () => {
  const navigate = useNavigate();
  const { debates, fetchDebates } = useDebate();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listError, setListError] = useState('');
  const [selectedCard, setSelectedCard] = useState<ModalDebateItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollLeftRef = useRef(0);
  const scrollStopTimerRef = useRef<number | null>(null);

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
    const cardEl = scrollRef.current.querySelector('[data-feature-card="true"]') as HTMLElement | null;
    const gap = 12;
    const snapWidth = cardEl ? cardEl.offsetWidth + gap : scrollRef.current.offsetWidth;
    const nextDot = Math.round(scrollRef.current.scrollLeft / snapWidth);
    setActiveDot(Math.max(0, Math.min(nextDot, featuredItems.length - 1)));

    if (Math.abs(scrollRef.current.scrollLeft - lastScrollLeftRef.current) > 2) {
      lastScrollLeftRef.current = scrollRef.current.scrollLeft;
    }

    if (scrollStopTimerRef.current) {
      window.clearTimeout(scrollStopTimerRef.current);
    }

    scrollStopTimerRef.current = window.setTimeout(() => {
      lastScrollLeftRef.current = scrollRef.current?.scrollLeft ?? 0;
    }, 120);
  };

  const openFeaturedModal = (item: ModalDebateItem) => {
    if (scrollRef.current && Math.abs(scrollRef.current.scrollLeft - lastScrollLeftRef.current) > 2) {
      return;
    }
    setSelectedCard(item);
  };

  const filteredDebates = useMemo(() => {
    let result = debates;
    if (activeCategory !== '전체') {
      result = result.filter((debate) =>
        debate.tagMaps?.some((tagMap) => tagMap.tag.name === activeCategory),
      );
    }
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    if (!normalizedKeyword) return result;
    return result.filter((debate) => {
      const searchableText = [
        debate.title,
        debate.description,
        debate.creator?.nickname ?? '',
        debate.tagMaps?.map((tagMap) => tagMap.tag.name).join(' ') ?? '',
      ].join(' ').toLowerCase();
      return searchableText.includes(normalizedKeyword);
    });
  }, [debates, searchKeyword, activeCategory]);

  useEffect(() => {
    setActiveDot(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [searchKeyword]);

  const debateItems: DebateListItem[] = filteredDebates.map((debate) => ({
    id: debate.id,
    title: debate.title,
    description: debate.description,
    status: debate.status,
    modalData: mapDebateToModalItem(debate),
  }));

  const featuredItems: FeaturedItem[] = filteredDebates.slice(0, 5).map((debate) => ({
    id: debate.id,
    title: debate.title,
    description: debate.description,
    author: debate.creator?.nickname ?? '사용자',
    participants: 0,
    status: debate.status === 'OPEN' ? 'OPEN' : 'WAITING',
    tag: `#${debate.tagMaps?.[0]?.tag.name ?? activeCategory}`,
    modalData: mapDebateToModalItem(debate),
  }));

  const currentDot = Math.min(activeDot, Math.max(0, featuredItems.length - 1));

  return (
    <Wrapper>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      {/* Logo */}
      <Logo src={logoSymbol} alt="정명" />

      {/* Header */}
      <Header>
        <IconBtn onClick={() => setIsDrawerOpen(true)} aria-label="메뉴">
          <MenuIcon />
        </IconBtn>
        <SearchBar>
          <SearchIcon />
          <SearchInput
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="토론을 검색하세요."
            aria-label="토론 검색"
          />
        </SearchBar>
        <IconBtn onClick={() => navigate('/notifications')} aria-label="알림">
          <BellIcon />
        </IconBtn>
      </Header>

      {/* 뜨는 토론 */}
      <Section>
        <SectionTitle>뜨는 토론</SectionTitle>
        <SectionSub>지금 사람들이 많이 보고 있는 토론들이에요.</SectionSub>
        <CarouselWrapper
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {featuredItems.map((item) => (
            <FeaturedCard key={item.id} item={item} onClick={() => openFeaturedModal(item.modalData)} />
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
          <DebateCard key={item.id} item={item} onClick={() => setSelectedCard(item.modalData)} />
        ))}
      </DebateList>

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
            <ModalTag>{selectedCard.tag}</ModalTag>

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
              <JoinButton
                type="button"
                onClick={() => {
                  navigate(`/debate/${selectedCard.id}`);
                  setSelectedCard(null);
                }}
              >
                참여하기
              </JoinButton>
            </ModalActionRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  background: var(--color-bg);
  min-height: 100dvh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(10px, 2.8vw, 12px) var(--page-x);
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
  transition: opacity 0.2s;
  &:active {
    opacity: 0.7;
  }
`;

const SearchBar = styled.div`
  width: min(226px, calc(100vw - 124px));
  height: clamp(36px, 9.3vw, 40px);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border-radius: 999px;
  padding: 0 clamp(14px, 4.2vw, 18px);
  box-sizing: border-box;
  box-shadow: var(--shadow-sm);
  min-width: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--body-sm);
  color: var(--color-text-main);

  &::placeholder {
    color: var(--color-text-sub);
  }
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin: var(--page-top) auto clamp(14px, 3.7vw, 16px);
`;

const Section = styled.div`
  padding: 0;
`;

const SectionTitle = styled.h2`
  font-size: var(--body-md);
  font-weight: 700;
  color: var(--color-text-main);
  margin-bottom: 2px;
  padding: 0 var(--page-x);
`;

const SectionSub = styled.p`
  font-size: clamp(12px, 3vw, 13px);
  color: var(--color-text-sub);
  margin-bottom: 14px;
  padding: 0 var(--page-x);
`;

const CarouselWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--page-x);
  gap: clamp(12px, 3.2vw, 14px);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
  padding: 0 var(--page-x) 2px;

  &::-webkit-scrollbar {
    display: none;
  }

`;

const FCard = styled.div`
  width: min(330px, calc(100vw - var(--page-x) - var(--page-x)));
  min-width: min(330px, calc(100vw - var(--page-x) - var(--page-x)));
  min-height: clamp(220px, 57.7vw, 248px);
  display: flex;
  flex-direction: column;
  position: relative;
  scroll-snap-align: start;
  scroll-snap-stop: normal;
  background: var(--color-surface);
  border-radius: var(--card-radius);
  padding: clamp(18px, 5.1vw, 22px) clamp(16px, 4.7vw, 20px) clamp(16px, 4.2vw, 18px);
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  touch-action: pan-x pan-y;
  user-select: none;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;

  &:active {
    transform: scale(0.98);
    box-shadow: none;
  }
`;

const FTitle = styled.h3`
  margin: 4px 0 10px;
  text-align: center;
  font-size: var(--title-sm);
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FDesc = styled.p`
  margin: 0 clamp(16px, 6.9vw, 29.5px) clamp(14px, 4.2vw, 18px);
  text-align: left;
  font-size: var(--body-sm);
  line-height: 1.3;
  color: var(--color-text-sub);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const FMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 clamp(16px, 6.9vw, 29.5px) clamp(14px, 4.2vw, 18px);
`;

const FAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--body-sm);
  color: var(--color-text-sub);
  min-width: 0;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Avatar = styled.div`
  width: clamp(34px, 9.3vw, 40px);
  height: clamp(34px, 9.3vw, 40px);
  border-radius: 50%;
  background: var(--color-border);
`;

const FParticipants = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--body-sm);
  color: var(--color-text-sub);
  flex-shrink: 0;
`;

const FTags = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  left: clamp(24px, 11.5vw, 49.5px);
  right: clamp(24px, 11.5vw, 49.5px);
  bottom: clamp(36px, 11.1vw, 48px);
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
`;

const Badge = styled.span<{ $active: boolean }>`
  height: clamp(32px, 8.8vw, 38px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(70px, 20vw, 86px);
  padding: 0 clamp(14px, 4.2vw, 18px);
  border-radius: 999px;
  border: 2px solid var(--color-primary);
  font-size: var(--body-md);
  font-weight: 600;
  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--color-primary)')};
  flex-shrink: 0;
  line-height: 1;
  white-space: nowrap;
`;

const TagPill = styled.span`
  height: clamp(32px, 8.8vw, 38px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: min(168px, 46vw);
  min-width: 0;
  padding: 0 clamp(14px, 4.2vw, 18px);
  border-radius: 999px;
  border: 2px solid var(--color-border);
  font-size: var(--body-md);
  background: transparent;
  color: var(--color-text-sub);
  flex: 1 1 auto;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 20px;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: clamp(10px, 2.8vw, 12px);
  height: clamp(10px, 2.8vw, 12px);
  border-radius: 50%;
  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-border)')};
  transition: background 0.25s;
`;

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--page-x);
  margin-bottom: 12px;
`;

const FilterBtn = styled.button`
  background: none;
  border: none;
  color: var(--color-text-main);
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
  padding: clamp(5px, 1.4vw, 6px) clamp(14px, 3.7vw, 16px);
  border-radius: 999px;
  border: none;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-bg)')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--color-text-main)')};
  cursor: pointer;
  box-shadow: ${({ $active }) => ($active ? 'var(--shadow-sm)' : 'none')};
  border: 1px solid ${({ $active }) => ($active ? 'transparent' : 'var(--color-border)')};
`;

const DebateList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 var(--page-x);
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
  width: min(330px, calc(100vw - var(--page-x) - var(--page-x)));
  min-height: clamp(126px, 33.5vw, 144px);
  background: var(--color-surface);
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.2vw, 18px) clamp(14px, 3.7vw, 16px);
  margin: 0 auto;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;

  &:active {
    transform: scale(0.98);
    box-shadow: none;
  }
`;

const DebateIconImg = styled.img`
  width: clamp(56px, 15.6vw, 67px);
  height: clamp(56px, 15.6vw, 67px);
  flex-shrink: 0;
`;

const DLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const DStatusBadge = styled.span`
  height: 22px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1.3px solid var(--color-primary);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
`;

const DTitle = styled.h4`
  margin: 0;
  font-size: var(--title-sm);
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DDesc = styled.p`
  margin: 0;
  font-size: var(--body-md);
  line-height: 1.3;
  color: var(--color-text-sub);
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
  padding: clamp(14px, 4.2vw, 18px);
  z-index: 300;
`;

const ModalCard = styled.div`
  width: min(100%, 354px);
  background: var(--color-surface);
  border-radius: clamp(34px, 9.8vw, 42px);
  padding: clamp(18px, 5.1vw, 22px) clamp(18px, 4.7vw, 20px) clamp(20px, 5.1vw, 22px);
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  box-shadow: var(--shadow-md);
`;

const ModalTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalIconButton = styled.button`
  width: clamp(36px, 9.3vw, 40px);
  height: clamp(36px, 9.3vw, 40px);
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
  font-size: var(--title-lg);
  font-weight: 700;
  color: var(--color-text-main);
  line-height: 1.2;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalDesc = styled.p`
  margin: 10px 0 16px;
  text-align: center;
  font-size: clamp(15px, 4vw, 17px);
  color: var(--color-text-sub);
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalTag = styled.span`
  display: inline-flex;
  height: clamp(38px, 9.8vw, 42px);
  align-items: center;
  max-width: 100%;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-sub);
  font-size: var(--title-sm);
  font-weight: 600;
  padding: 0 clamp(16px, 4.7vw, 20px);
  margin-bottom: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ModalAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--body-md);
  color: var(--color-text-sub);
  margin-bottom: 20px;
`;

const ModalAvatar = styled.div`
  width: clamp(36px, 9.8vw, 42px);
  height: clamp(36px, 9.8vw, 42px);
  border-radius: 50%;
  background: var(--color-border);
`;

const ModalMeta = styled.p`
  margin: 0 0 10px;
  font-size: 15px;
  color: var(--color-text-sub);
`;

const ModalActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 26px;
`;

const ModalActionIconButton = styled.button`
  width: clamp(42px, 11.2vw, 48px);
  height: clamp(42px, 11.2vw, 48px);
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ModalActionIcon = styled.img`
  width: clamp(32px, 8.4vw, 36px);
  height: clamp(32px, 8.4vw, 36px);
`;

const ModalAlarmIcon = styled(ModalActionIcon)`
  width: clamp(22px, 5.8vw, 25px);
  height: clamp(22px, 5.8vw, 25px);
`;

const JoinButton = styled.button`
  flex: 1;
  height: clamp(50px, 13vw, 56px);
  border-radius: 999px;
  border: none;
  background: var(--color-primary);
  color: #ffffff;
  font-size: var(--title-sm);
  font-weight: 700;
  transition: background-color 0.2s, transform 0.2s;

  &:active {
    background: var(--color-primary-hover);
    transform: scale(0.98);
  }
`;

export default MainPage;
