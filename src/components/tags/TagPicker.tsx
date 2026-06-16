import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { tagService } from "../../services/tagService";
import type { DebateTag } from "../../types/debate";

type TagPickerProps = {
  selectedTags: DebateTag[];
  onChange: (tags: DebateTag[]) => void;
  maxSelected?: number;
  placeholder?: string;
  disabled?: boolean;
};

const DEFAULT_MAX_SELECTED = 5;

const TagPicker = ({
  selectedTags,
  onChange,
  maxSelected = DEFAULT_MAX_SELECTED,
  placeholder = "태그를 검색하세요",
  disabled = false,
}: TagPickerProps) => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<DebateTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedIds = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags],
  );
  const canSelectMore = selectedTags.length < maxSelected;

  useEffect(() => {
    if (disabled) return;
    let isCurrent = true;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const { data } = await tagService.getTags(keyword, 20);
        if (isCurrent) setResults(data.tags);
      } catch {
        if (isCurrent) {
          setResults([]);
          setError("태그를 불러오지 못했습니다.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [disabled, keyword]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectTag = (tag: DebateTag) => {
    if (selectedIds.has(tag.id) || !canSelectMore) return;
    onChange([...selectedTags, tag]);
    setKeyword("");
    setIsOpen(true);
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const visibleResults = results.filter((tag) => !selectedIds.has(tag.id));

  return (
    <PickerWrap ref={wrapperRef}>
      {selectedTags.length > 0 && (
        <ChipList>
          {selectedTags.map((tag) => (
            <TagChip key={tag.id} type="button" onClick={() => removeTag(tag.id)}>
              <span>#{tag.name}</span>
              <CloseMark aria-hidden>x</CloseMark>
            </TagChip>
          ))}
        </ChipList>
      )}
      <Input
        value={keyword}
        onChange={(event) => {
          setKeyword(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={
          canSelectMore ? placeholder : `태그는 최대 ${maxSelected}개까지 선택할 수 있습니다.`
        }
        disabled={disabled || !canSelectMore}
      />
      <CountText>
        {selectedTags.length}/{maxSelected}
      </CountText>
      {isOpen && !disabled && (
        <ResultPanel>
          {isLoading && <ResultState>검색 중...</ResultState>}
          {!isLoading && error && <ResultState>{error}</ResultState>}
          {!isLoading && !error && visibleResults.length === 0 && (
            <ResultState>검색 결과가 없습니다.</ResultState>
          )}
          {!isLoading &&
            !error &&
            visibleResults.map((tag) => (
              <ResultButton key={tag.id} type="button" onClick={() => selectTag(tag)}>
                #{tag.name}
              </ResultButton>
            ))}
        </ResultPanel>
      )}
    </PickerWrap>
  );
};

const PickerWrap = styled.div`
  position: relative;
`;

const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
`;

const TagChip = styled.button`
  min-height: 30px;
  border-radius: 999px;
  border: 1px solid #2dcd97;
  background: #eefaf6;
  color: #2d8f73;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 13px;
  font-weight: 700;
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const CloseMark = styled.span`
  font-size: 15px;
  line-height: 1;
`;

const Input = styled.input`
  width: 100%;
  height: 40px;
  border: none;
  border-bottom: 2px solid #b7b7b7;
  background: transparent;
  color: #2f3238;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #b3b3b3;
  }

  &:disabled {
    opacity: 0.55;
  }
`;

const CountText = styled.p`
  margin: 6px 2px 0;
  text-align: right;
  font-size: 12px;
  color: #9b9b9b;
`;

const ResultPanel = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 30;
  display: flex;
  flex-direction: column;
  max-height: 220px;
  overflow-y: auto;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
  padding: 6px;
`;

const ResultButton = styled.button`
  min-height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #555555;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  padding: 8px 10px;

  &:hover,
  &:focus-visible {
    background: #eefaf6;
    color: #2d8f73;
    outline: none;
  }
`;

const ResultState = styled.p`
  margin: 0;
  padding: 12px 8px;
  color: #9a9a9a;
  font-size: 13px;
  text-align: center;
`;

export default TagPicker;
