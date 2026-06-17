import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import SideDrawer from '../../components/common/SideDrawer';
import TagPicker from '../../components/tags/TagPicker';
import iconAlarm from '../../assets/icon_alarm.svg';
import iconChat from '../../assets/icon_chat.svg';
import iconMenu from '../../assets/icon_menu.svg';
import iconSearch from '../../assets/icon_search.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import {
  ALL_DEBATE_FILTER_LABEL,
  DEBATE_STATUS_LABELS,
  DEBATE_TYPE_FILTER_ITEMS,
  DEBATE_TYPE_FILTER_MAP,
} from '../../constants/debate';
import { MESSAGES } from '../../constants/messages';
import { ARCHIVE_LIMIT } from '../../constants/pagination';
import { debateThreadPath, ROUTES } from '../../constants/routes';
import { useDebate } from '../../hooks/useDebate';
import type { Debate, DebateTag } from '../../types/debate';

type ArchiveFilter = (typeof DEBATE_TYPE_FILTER_ITEMS)[number];

type ArchiveCardItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

const getDebateTagLabels = (debate: Debate) => {
  const tags = (debate.tags ?? debate.tagMaps?.map((tagMap) => tagMap.tag))
    ?.map((tag) => tag.name.trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`);
  return tags?.length ? tags : [];
};

const mapToArchiveCard = (debate: Debate): ArchiveCardItem => ({
  id: debate.id,
  title: debate.title,
  description: debate.description,
  tags: getDebateTagLabels(debate),
});

const DebateArchivePage = () => {
  const navigate = useNavigate();
  const { debates, fetchArchivedDebates } = useDebate();
  const [activeFilter, setActiveFilter] = useState<ArchiveFilter>(ALL_DEBATE_FILTER_LABEL);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<DebateTag[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [listError, setListError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const loadDebates = async () => {
      try {
        const type = DEBATE_TYPE_FILTER_MAP[activeFilter];
        await fetchArchivedDebates({
          ...(type ? { type } : {}),
          ...(submittedKeyword.trim() ? { keyword: submittedKeyword.trim() } : {}),
          tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id).join(',') : undefined,
          sort: 'archivedAt',
          direction: 'desc',
          limit: ARCHIVE_LIMIT,
        });
        setListError('');
      } catch {
        setListError(MESSAGES.REQUEST_FAILED);
      }
    };
    void loadDebates();
  }, [activeFilter, fetchArchivedDebates, selectedTags, submittedKeyword]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedKeyword(searchKeyword.trim());
  };

  const archiveCards = useMemo(() => debates.map(mapToArchiveCard), [debates]);

  return (
    <Wrapper>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <Logo
        src={logoSymbol}
        alt="정명"
        role="button"
        tabIndex={0}
        onClick={() => navigate(ROUTES.HOME)}
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
            placeholder="아카이브 토론 검색"
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
        {listError && <ErrorText>{listError}</ErrorText>}
        {!listError && archiveCards.length === 0 && <ErrorText>{MESSAGES.NO_ARCHIVED_DEBATES}</ErrorText>}
        {archiveCards.map((card) => (
          <Card key={card.id} onClick={() => navigate(debateThreadPath(card.id))}>
            <CardTop>
              <ClosedBadge>{DEBATE_STATUS_LABELS.ARCHIVED}</ClosedBadge>
              <ChatCircleIconImg src={iconChat} alt="" />
            </CardTop>
            <CardTitle>{card.title}</CardTitle>
            <CardDesc>{card.description}</CardDesc>
            {card.tags.length > 0 && (
              <CardTagList>
                {card.tags.map((tag) => (
                  <CardTag key={tag}>{tag}</CardTag>
                ))}
              </CardTagList>
            )}
          </Card>
        ))}
      </ListWrap>
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
  margin-bottom: 16px;
  overflow-x: auto;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  height: clamp(30px, 7.4vw, 32px);
  padding: 0 clamp(12px, 3.3vw, 14px);
  border-radius: 999px;
  border: 1.5px solid ${({ $active }) => ($active ? '#2dcd97' : '#ababab')};
  background: ${({ $active }) => ($active ? '#2dcd97' : '#f3f3f3')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#8f8f8f')};
  font-size: var(--body-sm);
  font-weight: ${({ $active }) => ($active ? '600' : '500')};
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
  gap: 8px;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #f04444;
`;

const Card = styled.article`
  background: #f8f8f8;
  border-radius: var(--card-radius);
  padding: clamp(14px, 3.7vw, 16px) clamp(14px, 3.7vw, 16px) clamp(12px, 3.3vw, 14px);
  overflow: hidden;
  cursor: pointer;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

export default DebateArchivePage;
