import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import SideDrawer from '../../components/common/SideDrawer';
import { LoadingContent } from '../../components/common/LoadingContent';
import { DebateListItemSkeleton, FeaturedCardSkeleton } from '../../components/common/PageSkeletons';
import TagPicker from '../../components/tags/TagPicker';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconAlarm2 from '../../assets/icon_alarm2.svg';
import iconChat from '../../assets/icon_chat.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import iconShowInfo from '../../assets/icon_show_info.svg';
import iconStar from '../../assets/icon_star.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import { DEBATE_STATUS_LABELS, DEBATE_TYPE_LABELS } from '../../constants/debate';
import { MESSAGES } from '../../constants/messages';
import { FEATURED_DEBATE_LIMIT, HOME_DEBATE_LIMIT } from '../../constants/pagination';
import { debateInfoPath, debateThreadPath, ROUTES } from '../../constants/routes';
import { useDebate } from '../../hooks/useDebate';
import { usePageLoading } from '../../hooks/usePageLoading';
import { debateService } from '../../services/debateService';
import type { Debate, DebateTag } from '../../types/debate';
import { formatDateLabel } from '../../utils/dateFormat';

// ??? Icons ????????????????????????????????????????????????????????????????????

const MenuIcon = () => <img src={iconMenu} width="22" height="22" alt="" />;

const SearchIcon = () => <img src={iconSearch} width="18" height="18" alt="" />;

const BellIcon = () => <img src={iconAlarm} width="22" height="22" alt="" />;

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

const FEATURED_CARD_TAG_LIMIT = 2;

// ??? Mock Data ?????????????????????????????????????????????????????????????????

type ModalDebateItem = {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  debateTypeLabel: string;
  participants: number;
  tags: string[];
  createdDateLabel: string;
  isBookmarked: boolean;
  isSubscribed: boolean;
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
  tags: string[];
  modalData: ModalDebateItem;
};

// ??? Sub Components ????????????????????????????????????????????????????????????

const getDebateParticipantCount = (debate: Debate) =>
  debate.participantCount ?? debate.participants?.length ?? 0;

const getDebateTagLabels = (debate: Debate) => {
  const tags = (debate.tags ?? debate.tagMaps?.map((tagMap) => tagMap.tag))
    ?.map((tag) => tag.name.trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`);
  return tags?.length ? tags : ['태그 없음'];
};

const mapDebateToModalItem = (debate: Debate): ModalDebateItem => ({
  id: debate.id,
  title: debate.title,
  description: debate.description,
  creatorName: debate.creator?.nickname ?? MESSAGES.NO_USER_INFO,
  debateTypeLabel: DEBATE_TYPE_LABELS[debate.debateType],
  participants: getDebateParticipantCount(debate),
  tags: getDebateTagLabels(debate),
  createdDateLabel: formatDateLabel(debate.createdAt),
  isBookmarked: Boolean(debate.isBookmarked),
  isSubscribed: Boolean(debate.isSubscribed),
});

const StatusBadge = ({ status }: { status: string }) => {
  const label = (DEBATE_STATUS_LABELS[status as Debate['status']] ?? status).replace(/\s+/g, '');
  return <Badge $active={status === 'OPEN'}>{label}</Badge>;
};

const FeaturedCard = ({
  item,
  onClick,
  onOpenActions,
}: {
  item: FeaturedItem;
  onClick: () => void;
  onOpenActions: (event: MouseEvent<HTMLButtonElement>) => void;
}) => (
  <FCard data-feature-card="true" onClick={onClick}>
    <CardActionButton type="button" aria-label="토론 미리보기 열기" onClick={onOpenActions}>
      ...
    </CardActionButton>
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
      <FTagList>
        {item.tags.slice(0, FEATURED_CARD_TAG_LIMIT).map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
        {item.tags.length > FEATURED_CARD_TAG_LIMIT && (
          <TagOverflowBadge>+{item.tags.length - FEATURED_CARD_TAG_LIMIT}</TagOverflowBadge>
        )}
      </FTagList>
    </FTags>
  </FCard>
);

const DebateCard = ({
  item,
  onClick,
  onOpenActions,
}: {
  item: DebateListItem;
  onClick: () => void;
  onOpenActions: (event: MouseEvent<HTMLButtonElement>) => void;
}) => (
  <DCard onClick={onClick}>
    <DLeft>
      <DMetaRow>
        <DStatusBadge>
          {DEBATE_STATUS_LABELS[item.status].replace(/\s+/g, '')}
        </DStatusBadge>
        <DTypeBadge>{item.modalData.debateTypeLabel}</DTypeBadge>
      </DMetaRow>
      <DTitle>{item.title}</DTitle>
      <DDesc>{item.description}</DDesc>
      <DTagList>
        {item.modalData.tags.map((tag) => (
          <DTagPill key={tag}>{tag}</DTagPill>
        ))}
      </DTagList>
    </DLeft>
    <DRight>
      <DCardActionButton type="button" aria-label="토론 미리보기 열기" onClick={onOpenActions}>
        ...
      </DCardActionButton>
      <DebateIconImg src={iconChat} alt="" />
    </DRight>
  </DCard>
);

// ??? Main Page ?????????????????????????????????????????????????????????????????

const MainPage = () => {
  const navigate = useNavigate();
  const { debates, fetchDebates } = useDebate();
  const { isLoading, showLoadingUI, error: loadError, executeAsync } = usePageLoading();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<DebateTag[]>([]);
  const [selectedCard, setSelectedCard] = useState<ModalDebateItem | null>(null);
  const [joinError, setJoinError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollLeftRef = useRef(0);
  const scrollStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    const loadDebates = async () => {
      await executeAsync(async () => {
        await fetchDebates({
          keyword: debouncedSearchKeyword || undefined,
          tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id).join(',') : undefined,
          status: 'OPEN',
          sort: 'updatedAt',
          direction: 'desc',
          limit: HOME_DEBATE_LIMIT,
        });
      });
    };
    void loadDebates();
  }, [debouncedSearchKeyword, selectedTags, fetchDebates, executeAsync]);

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

  const openDebateModal = async (item: ModalDebateItem) => {
    setJoinError('');
    setActionMessage('');
    setSelectedCard(item);
    try {
      const { data } = await debateService.getById(item.id);
      setSelectedCard((current) =>
        current?.id === item.id ? mapDebateToModalItem(data.debate) : current,
      );
    } catch {
      setJoinError(MESSAGES.REQUEST_FAILED);
    }
  };

  const navigateToFeaturedDebate = (debateId: string) => {
    if (scrollRef.current && Math.abs(scrollRef.current.scrollLeft - lastScrollLeftRef.current) > 2) {
      return;
    }
    navigate(debateThreadPath(debateId));
  };

  const openActionModalFromButton = (
    event: MouseEvent<HTMLButtonElement>,
    item: ModalDebateItem,
  ) => {
    event.stopPropagation();
    void openDebateModal(item);
  };

  const handleBookmarkToggle = async () => {
    if (!selectedCard || isActionProcessing) return;
    const wasBookmarked = selectedCard.isBookmarked;
    setJoinError('');
    setActionMessage('');
    setIsActionProcessing(true);
    setSelectedCard({ ...selectedCard, isBookmarked: !wasBookmarked });
    try {
      if (wasBookmarked) {
        await debateService.unbookmark(selectedCard.id);
        setActionMessage('저장을 해제했습니다.');
      } else {
        await debateService.bookmark(selectedCard.id);
        setActionMessage('토론을 저장했습니다.');
      }
    } catch {
      setSelectedCard((current) =>
        current?.id === selectedCard.id ? { ...current, isBookmarked: wasBookmarked } : current,
      );
      setJoinError(MESSAGES.REQUEST_FAILED);
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleSubscriptionToggle = async () => {
    if (!selectedCard || isActionProcessing) return;
    const wasSubscribed = selectedCard.isSubscribed;
    setJoinError('');
    setActionMessage('');
    setIsActionProcessing(true);
    setSelectedCard({ ...selectedCard, isSubscribed: !wasSubscribed });
    try {
      if (wasSubscribed) {
        await debateService.unsubscribe(selectedCard.id);
        setActionMessage('알림을 해제했습니다.');
      } else {
        await debateService.subscribe(selectedCard.id);
        setActionMessage('알림을 설정했습니다.');
      }
    } catch {
      setSelectedCard((current) =>
        current?.id === selectedCard.id ? { ...current, isSubscribed: wasSubscribed } : current,
      );
      setJoinError(MESSAGES.REQUEST_FAILED);
    } finally {
      setIsActionProcessing(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveDot(0), 0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    return () => window.clearTimeout(timer);
  }, [debouncedSearchKeyword, selectedTags]);

  const debateItems: DebateListItem[] = debates.map((debate) => ({
    id: debate.id,
    title: debate.title,
    description: debate.description,
    status: debate.status,
    modalData: mapDebateToModalItem(debate),
  }));

  // TODO: replace updatedAt sort with lastActivityAt/recentPostCount when backend supports activity ranking.
  const featuredItems: FeaturedItem[] = debates.slice(0, FEATURED_DEBATE_LIMIT).map((debate) => ({
    id: debate.id,
    title: debate.title,
    description: debate.description,
    author: debate.creator?.nickname ?? MESSAGES.NO_USER_INFO,
    participants: getDebateParticipantCount(debate),
    status: debate.status,
    tags: getDebateTagLabels(debate),
    modalData: mapDebateToModalItem(debate),
  }));

  const currentDot = Math.min(activeDot, Math.max(0, featuredItems.length - 1));

  return (
    <Wrapper>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <FixedHeaderArea>
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
          <IconBtn onClick={() => navigate(ROUTES.NOTIFICATIONS)} aria-label="알림">
            <BellIcon />
          </IconBtn>
        </Header>
      </FixedHeaderArea>

      {/* ?⑤뒗 ?좊줎 */}
      <Section>
        <SectionTitle>최근 활발한 토론</SectionTitle>
        <SectionSub>최근 업데이트된 진행 중인 토론이에요.</SectionSub>
        <CarouselWrapper
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <LoadingContent
            isLoading={isLoading}
            showLoadingUI={showLoadingUI}
            skeleton={
              <>
                <FeaturedCardSkeleton />
                <FeaturedCardSkeleton />
              </>
            }
          >
            {featuredItems.map((item) => (
              <FeaturedCard
                key={item.id}
                item={item}
                onClick={() => navigateToFeaturedDebate(item.id)}
                onOpenActions={(event) => {
                  if (scrollRef.current && Math.abs(scrollRef.current.scrollLeft - lastScrollLeftRef.current) > 2) {
                    event.stopPropagation();
                    return;
                  }
                  openActionModalFromButton(event, item.modalData);
                }}
              />
            ))}
          </LoadingContent>
        </CarouselWrapper>
        <Dots>
          {(showLoadingUI ? [0, 1] : featuredItems).map((_, i) => (
            <Dot key={i} $active={!showLoadingUI && i === currentDot} />
          ))}
        </Dots>
      </Section>

      <TagFilterArea>
        <TagPicker
          selectedTags={selectedTags}
          onChange={setSelectedTags}
          placeholder="필터할 태그를 검색하세요"
        />
        {selectedTags.length > 1 && (
          <ClearTagButton type="button" onClick={() => setSelectedTags([])}>
            전체 해제
          </ClearTagButton>
        )}
      </TagFilterArea>

      {/* Debate List */}
      <DebateList>
        {loadError && <ListError>{loadError}</ListError>}
        <LoadingContent
          isLoading={isLoading}
          showLoadingUI={showLoadingUI}
          skeleton={<DebateListItemSkeleton count={4} />}
        >
          {!loadError && debateItems.length === 0 && <ListError>{MESSAGES.NO_DISPLAY_DEBATES}</ListError>}
          {debateItems.map((item) => (
            <DebateCard
              key={item.id}
              item={item}
              onClick={() => navigate(debateThreadPath(item.id))}
              onOpenActions={(event) => openActionModalFromButton(event, item.modalData)}
            />
          ))}
        </LoadingContent>
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
                  navigate(debateInfoPath(selectedCard.id));
                  setSelectedCard(null);
                }}
              >
                <ModalMenuIcon />
              </ModalIconButton>
            </ModalTop>

            <ModalTitle>{selectedCard.title}</ModalTitle>
            <ModalDesc>{selectedCard.description}</ModalDesc>
            <ModalTagList>
              {selectedCard.tags.map((tag) => (
                <ModalTag key={tag}>{tag}</ModalTag>
              ))}
            </ModalTagList>

            <ModalAuthorRow>
              <ModalAvatar />
              <span>{selectedCard.creatorName}</span>
            </ModalAuthorRow>

            <ModalMeta>토론 방식 : {selectedCard.debateTypeLabel}</ModalMeta>
            <ModalMeta>참여 인원 : {selectedCard.participants}</ModalMeta>
            <ModalMeta>{selectedCard.createdDateLabel}</ModalMeta>
            {actionMessage && <ModalSuccess>{actionMessage}</ModalSuccess>}
            {joinError && <ModalError>{joinError}</ModalError>}

            <ModalActionRow>
              <ModalActionIconButton
                type="button"
                aria-label="저장"
                $active={selectedCard.isBookmarked}
                disabled={isActionProcessing}
                onClick={() => void handleBookmarkToggle()}
              >
                <ModalActionIcon src={iconStar} alt="" />
              </ModalActionIconButton>
              <ModalActionIconButton
                type="button"
                aria-label="알림"
                $active={selectedCard.isSubscribed}
                disabled={isActionProcessing}
                onClick={() => void handleSubscriptionToggle()}
              >
                <ModalAlarmIcon src={iconAlarm2} alt="" />
              </ModalActionIconButton>
              <JoinButton
                type="button"
                onClick={() => {
                  navigate(debateThreadPath(selectedCard.id));
                  setSelectedCard(null);
                }}
              >
                토론 보기
              </JoinButton>
            </ModalActionRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

// ??? Styles ????????????????????????????????????????????????????????????????????

const Wrapper = styled.div`
  background: #f5f5f5;
  min-height: 100dvh;
  padding-top: calc(clamp(10px, 3vw, 14px) + var(--logo-height) + clamp(10px, 2.8vw, 12px) + clamp(56px, 14.9vw, 64px));
`;

const FixedHeaderArea = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 100;
  width: 100%;
  max-width: var(--app-max-width);
  transform: translateX(-50%);
  background: #f5f5f5;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(10px, 2.8vw, 12px) var(--page-x);
  min-height: clamp(56px, 14.9vw, 64px);
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
  width: min(226px, calc(100vw - 124px));
  height: clamp(36px, 9.3vw, 40px);
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: 999px;
  padding: 0 clamp(14px, 4.2vw, 18px);
  box-sizing: border-box;

  min-width: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--body-sm);
  color: #666666;

  &::placeholder {
    color: #b4b4b4;
  }
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin: clamp(10px, 3vw, 14px) auto clamp(10px, 2.8vw, 12px);
`;

const Section = styled.div`
  padding: 0;
`;

const SectionTitle = styled.h2`
  font-size: var(--body-md);
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
  padding: 0 var(--page-x);
`;

const SectionSub = styled.p`
  font-size: clamp(12px, 3vw, 13px);
  color: #999;
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
  background: #fff;
  border-radius: var(--card-radius);
  padding: clamp(18px, 5.1vw, 22px) clamp(16px, 4.7vw, 20px) clamp(16px, 4.2vw, 18px);
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  touch-action: pan-x pan-y;
  user-select: none;
`;

const CardActionButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  min-width: 34px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: rgba(245, 245, 245, 0.92);
  color: #8f8f8f;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  padding: 0 10px;
`;

const FTitle = styled.h3`
  margin: 4px 0 10px;
  text-align: center;
  font-size: var(--title-sm);
  line-height: 1.2;
  font-weight: 700;
  color: #2f3238;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FDesc = styled.p`
  margin: 0 clamp(16px, 6.9vw, 29.5px) clamp(14px, 4.2vw, 18px);
  text-align: left;
  font-size: var(--body-sm);
  line-height: 1.3;
  color: #939393;
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
  color: #adadad;
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
  background: #b3b3b3;
`;

const FParticipants = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--body-sm);
  color: #adadad;
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

const FTagList = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
`;

const Badge = styled.span<{ $active: boolean }>`
  height: clamp(32px, 8.8vw, 38px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(78px, 21vw, 92px);
  padding: 0 clamp(14px, 4.2vw, 18px);
  border-radius: 999px;
  border: 2px solid #2dcd97;
  font-size: var(--body-md);
  font-weight: 600;
  background: ${({ $active }) => ($active ? '#2dcd97' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#2dcd97')};
  flex-shrink: 0;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
`;

const TagPill = styled.span`
  height: clamp(32px, 8.8vw, 38px);
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  max-width: min(96px, 26vw);
  min-width: 0;
  padding: 0 clamp(10px, 3.2vw, 14px);
  border-radius: 999px;
  border: 2px solid #a8a8a8;
  font-size: var(--body-md);
  background: transparent;
  color: #9f9f9f;
  flex: 0 0 auto;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TagOverflowBadge = styled.span`
  height: clamp(32px, 8.8vw, 38px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(10px, 3.2vw, 14px);
  border-radius: 999px;
  border: 2px solid #a8a8a8;
  font-size: var(--body-md);
  background: transparent;
  color: #9f9f9f;
  flex: 0 0 auto;
  line-height: 1;
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
  background: ${({ $active }) => ($active ? '#4dc891' : '#ddd')};
  transition: background 0.25s;
`;

const TagFilterArea = styled.div`
  position: relative;
  padding: 0 var(--page-x);
  margin: 0 0 12px;
`;

const ClearTagButton = styled.button`
  display: block;
  margin: 8px 0 0 auto;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
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
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.2vw, 18px) clamp(14px, 3.7vw, 16px);
  margin: 0 auto;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
`;

const DebateIconImg = styled.img`
  width: clamp(56px, 15.6vw, 67px);
  height: clamp(56px, 15.6vw, 67px);
  flex-shrink: 0;
`;

const DRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  align-self: stretch;
  gap: 8px;
  flex-shrink: 0;
`;

const DCardActionButton = styled.button`
  min-width: 34px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #f3f3f3;
  color: #8f8f8f;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  padding: 0 10px;
`;

const DLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const DMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const DStatusBadge = styled.span`
  height: 22px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1.3px solid #2dcd97;
  color: #2dcd97;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  min-width: 67px;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
`;

const DTypeBadge = styled(DStatusBadge)`
  min-width: auto;
  border-color: transparent;
  background: #eefaf6;
  color: #2dcd97;
  padding: 0 10px;
`;

const DTitle = styled.h4`
  margin: 0;
  font-size: var(--title-sm);
  line-height: 1.2;
  font-weight: 700;
  color: #2f3238;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DDesc = styled.p`
  margin: 0;
  font-size: var(--body-md);
  line-height: 1.3;
  color: #8f8f8f;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const DTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const DTagPill = styled.span`
  min-width: 0;
  max-width: 96px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid #d5d5d5;
  color: #8f8f8f;
  font-size: 11px;
  font-weight: 700;
  padding: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  background: #ffffff;
  border-radius: clamp(34px, 9.8vw, 42px);
  padding: clamp(18px, 5.1vw, 22px) clamp(18px, 4.7vw, 20px) clamp(20px, 5.1vw, 22px);
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
  color: #2f3238;
  line-height: 1.2;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalDesc = styled.p`
  margin: 10px 0 16px;
  text-align: center;
  font-size: clamp(15px, 4vw, 17px);
  color: #8f8f8f;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ModalTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
`;

const ModalTag = styled.span`
  display: inline-flex;
  height: clamp(38px, 9.8vw, 42px);
  align-items: center;
  max-width: 100%;
  border: 1.5px solid #a7a7a7;
  border-radius: 999px;
  color: #9f9f9f;
  font-size: var(--title-sm);
  font-weight: 600;
  padding: 0 clamp(16px, 4.7vw, 20px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ModalAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--body-md);
  color: #a4a4a4;
  margin-bottom: 20px;
`;

const ModalAvatar = styled.div`
  width: clamp(36px, 9.8vw, 42px);
  height: clamp(36px, 9.8vw, 42px);
  border-radius: 50%;
  background: #b8b8b8;
`;

const ModalMeta = styled.p`
  margin: 0 0 10px;
  font-size: 15px;
  color: #9a9a9a;
`;

const ModalError = styled.p`
  margin: 0 0 10px;
  color: #f04444;
  font-size: var(--body-sm);
`;

const ModalSuccess = styled(ModalError)`
  color: #2d8f73;
`;

const ModalActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 26px;
`;

const ModalActionIconButton = styled.button<{ $active?: boolean }>`
  width: clamp(42px, 11.2vw, 48px);
  height: clamp(42px, 11.2vw, 48px);
  border: none;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#eefaf6' : 'transparent')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
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
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--title-sm);
  font-weight: 700;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default MainPage;

