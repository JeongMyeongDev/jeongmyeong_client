import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import SideDrawer from '../../components/common/SideDrawer';
import styled from 'styled-components';
import { LoadingContent } from '../../components/common/LoadingContent';
import { DebateRoomCardSkeleton } from '../../components/common/PageSkeletons';
import TagPicker from '../../components/tags/TagPicker';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconAlarm2 from '../../assets/icon_alarm2.svg';
import iconChat from '../../assets/icon_chat.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import iconShowInfo from '../../assets/icon_show_info.svg';
import iconStar from '../../assets/icon_star.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import {
  ALL_DEBATE_FILTER_LABEL,
  DEBATE_STATUS_LABELS,
  DEBATE_TYPE_FILTER_ITEMS,
  DEBATE_TYPE_FILTER_MAP,
  SHORT_DEBATE_TYPE_LABELS,
} from '../../constants/debate';
import { MESSAGES } from '../../constants/messages';
import { DEBATE_ROOM_LIMIT } from '../../constants/pagination';
import { debateInfoPath, debateThreadPath, ROUTES } from '../../constants/routes';
import { useDebate } from '../../hooks/useDebate';
import { usePageLoading } from '../../hooks/usePageLoading';
import { debateService } from '../../services/debateService';
import type { Debate, DebateTag } from '../../types/debate';
import { formatDateLabel } from '../../utils/dateFormat';

type DebateRoomCard = {
  id: string;
  title: string;
  description: string;
  status: Debate['status'];
  isBookmarked: boolean;
  isSubscribed: boolean;
  creatorName: string;
  debateTypeLabel: string;
  participants: number;
  tagLabels: string[];
  createdDateLabel: string;
};

const getDebateParticipantCount = (debate: Debate) =>
  debate.participantCount ?? debate.participants?.length ?? 0;

const getDebateTagLabels = (debate: Debate) => {
  const tags = (debate.tags ?? debate.tagMaps?.map((tagMap) => tagMap.tag))
    ?.map((tag) => tag.name.trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`);
  return tags?.length ? tags : [];
};

const mapToRoomCard = (debate: Debate): DebateRoomCard => ({
  id: debate.id,
  title: debate.title,
  description: debate.description,
  status: debate.status,
  isBookmarked: Boolean(debate.isBookmarked),
  isSubscribed: Boolean(debate.isSubscribed),
  creatorName: debate.creator?.nickname ?? MESSAGES.NO_USER_INFO,
  debateTypeLabel: SHORT_DEBATE_TYPE_LABELS[debate.debateType],
  participants: getDebateParticipantCount(debate),
  tagLabels: getDebateTagLabels(debate),
  createdDateLabel: formatDateLabel(debate.createdAt),
});

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
  const { isLoading, showLoadingUI, error: loadError, executeAsync } = usePageLoading();
  const [activeFilter, setActiveFilter] = useState<string>(ALL_DEBATE_FILTER_LABEL);
  const [selectedCard, setSelectedCard] = useState<DebateRoomCard | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<DebateTag[]>([]);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  useEffect(() => {
    const loadDebates = async () => {
      await executeAsync(async () => {
        const type = DEBATE_TYPE_FILTER_MAP[activeFilter];
        await fetchDebates({
          status: 'OPEN',
          ...(type ? { type } : {}),
          tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id).join(',') : undefined,
          ...(submittedKeyword.trim() ? { keyword: submittedKeyword.trim() } : {}),
          sort: 'updatedAt',
          direction: 'desc',
          limit: DEBATE_ROOM_LIMIT,
        });
      });
    };
    void loadDebates();
  }, [activeFilter, selectedTags, fetchDebates, executeAsync, submittedKeyword]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedKeyword(searchKeyword.trim());
  };

  const cards = useMemo(
    () => debates.map(mapToRoomCard),
    [debates],
  );

  const openDebateModal = async (card: DebateRoomCard) => {
    setActionMessage('');
    setActionError('');
    setSelectedCard(card);
    try {
      const { data } = await debateService.getById(card.id);
      setSelectedCard(mapToRoomCard(data.debate));
    } catch {
      setActionError(MESSAGES.REQUEST_FAILED);
    }
  };

  const openActionModalFromButton = (
    event: MouseEvent<HTMLButtonElement>,
    card: DebateRoomCard,
  ) => {
    event.stopPropagation();
    void openDebateModal(card);
  };

  const handleBookmarkToggle = async () => {
    if (!selectedCard || isActionProcessing) return;
    const wasBookmarked = selectedCard.isBookmarked;
    setActionMessage('');
    setActionError('');
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
      setActionError(MESSAGES.REQUEST_FAILED);
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleSubscriptionToggle = async () => {
    if (!selectedCard || isActionProcessing) return;
    const wasSubscribed = selectedCard.isSubscribed;
    setActionMessage('');
    setActionError('');
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
      setActionError(MESSAGES.REQUEST_FAILED);
    } finally {
      setIsActionProcessing(false);
    }
  };

  return (
    <Wrapper>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <Logo
        src={logoSymbol}
        alt="정명 홈"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') navigate(ROUTES.HOME);
        }}
      />

      <HeaderRow>
        <SideButton type="button" aria-label="메뉴" onClick={() => setIsDrawerOpen(true)}>
          <TopIcon src={iconMenu} alt="" />
        </SideButton>
        <HeaderRight>
          <SideButton
            type="button"
            aria-label="검색"
            onClick={() => setIsSearchOpen((value) => !value)}
          >
            <TopIcon src={iconSearch} alt="" />
          </SideButton>
          <SideButton type="button" aria-label="알림" onClick={() => navigate(ROUTES.NOTIFICATIONS)}>
            <TopIcon src={iconAlarm} alt="" />
          </SideButton>
        </HeaderRight>
      </HeaderRow>

      {isSearchOpen && (
        <SearchForm onSubmit={handleSearchSubmit}>
          <SearchInput
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="토론 검색"
          />
          <SearchButton type="submit">검색</SearchButton>
        </SearchForm>
      )}

      <FilterRow>
        {DEBATE_TYPE_FILTER_ITEMS.map((item) => (
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

      <ListWrap>
        {loadError && <ErrorText>{loadError}</ErrorText>}
        <LoadingContent
          isLoading={isLoading}
          showLoadingUI={showLoadingUI}
          skeleton={<DebateRoomCardSkeleton count={4} />}
        >
          {!loadError && cards.length === 0 && <ErrorText>{MESSAGES.NO_REGISTERED_DEBATES}</ErrorText>}
          {cards.map((card) => (
            <Card key={card.id} onClick={() => navigate(debateThreadPath(card.id))}>
              <CardTop>
                <StatusBadge $running={card.status === 'OPEN'}>
                  {DEBATE_STATUS_LABELS[card.status].replace(/\s+/g, '')}
                </StatusBadge>
                <CardTopRight>
                  <CardActionButton
                    type="button"
                    aria-label="토론 미리보기 열기"
                    onClick={(event) => openActionModalFromButton(event, card)}
                  >
                    ...
                  </CardActionButton>
                  <ChatCircleIconImg src={iconChat} alt="" />
                </CardTopRight>
              </CardTop>
              <CardTitle>{card.title}</CardTitle>
              <TypeBadge>{card.debateTypeLabel}</TypeBadge>
              <CardDesc>{card.description}</CardDesc>
              {card.tagLabels.length > 0 && (
                <CardTagList>
                  {card.tagLabels.map((tag) => (
                    <CardTag key={tag}>{tag}</CardTag>
                  ))}
                </CardTagList>
              )}
            </Card>
          ))}
        </LoadingContent>
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
              {selectedCard.tagLabels.map((tag) => (
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
            {actionError && <ErrorText>{actionError}</ErrorText>}

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

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: var(--page-top) var(--page-x) var(--page-bottom);
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin: clamp(8px, 2.8vw, 12px) auto 0;
  margin-bottom: clamp(14px, 3.7vw, 16px);
  cursor: pointer;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 12px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SideButton = styled.button`
  width: clamp(30px, 7.9vw, 34px);
  height: clamp(30px, 7.9vw, 34px);
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const TopIcon = styled.img`
  width: clamp(24px, 6.5vw, 28px);
  height: clamp(24px, 6.5vw, 28px);
`;

const SearchForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: #ffffff;
  color: #333333;
  font-size: var(--body-sm);
  padding: 0 14px;
  outline: none;
`;

const SearchButton = styled.button`
  height: 36px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: var(--body-sm);
  font-weight: 700;
  padding: 0 14px;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: clamp(18px, 5.6vw, 24px);
`;

const FilterChip = styled.button<{ $active: boolean }>`
  height: clamp(32px, 8.8vw, 38px);
  padding: 0 clamp(12px, 3.7vw, 16px);
  border-radius: 999px;
  border: 1.5px solid ${({ $active }) => ($active ? '#2dcd97' : '#9f9f9f')};
  background: ${({ $active }) => ($active ? '#2dcd97' : '#f3f3f3')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#8f8f8f')};
  font-size: var(--body-sm);
  font-weight: 600;
  white-space: nowrap;
`;

const TagFilterArea = styled.div`
  position: relative;
  margin-bottom: 14px;
`;

const ClearTagButton = styled.button`
  display: block;
  margin: 8px 0 0 auto;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #ebebeb;
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
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
  border-radius: clamp(18px, 4.7vw, 20px);
  padding: clamp(10px, 2.8vw, 12px) clamp(12px, 3.3vw, 14px) clamp(12px, 3.3vw, 14px);
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
  width: clamp(26px, 7vw, 30px);
  height: clamp(26px, 7vw, 30px);
  flex-shrink: 0;
`;

const CardTopRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const CardActionButton = styled.button`
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

const StatusBadge = styled.span<{ $running: boolean }>`
  min-width: clamp(52px, 14vw, 60px);
  height: clamp(24px, 6vw, 26px);
  padding: 0 10px;
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
  flex-shrink: 0;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
`;

const CardTitle = styled.h3`
  margin: 0 0 6px;
  font-size: var(--title-sm);
  line-height: 1.15;
  color: #333333;
  font-weight: 700;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  height: 22px;
  max-width: 100%;
  margin-bottom: 6px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2dcd97;
  font-size: 11px;
  font-weight: 700;
`;

const CardDesc = styled.p`
  margin: 0 0 8px;
  font-size: var(--body-sm);
  color: #8f8f8f;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const CardTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const CardTag = styled.span`
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
  padding: 18px;
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
  background: ${({ $active }) => ($active ? '#eefaf6' : 'transparent')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
`;

const ModalSuccess = styled(ErrorText)`
  color: #2d8f73;
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

export default DebatePage;
