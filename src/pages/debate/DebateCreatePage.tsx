import { isAxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDebate } from '../../hooks/useDebate';
import { useAuthStore } from '../../stores/authStore';

const TITLE_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 120;
const TAG_MAX_LENGTH = 12;
const TAG_MAX_COUNT = 5;
const DEFAULT_DEBATE_TYPE = 'FREE' as const;
const DRAFT_KEY = 'debate-create:draft';

const getCommunityTextValidationError = (input: string, fieldName = '내용') => {
  const text = input.normalize('NFC');

  if (text.length > 5000) {
    return `${fieldName}은 5000자 이하로 입력해 주세요.`;
  }

  if (/\p{Mark}{4,}/u.test(text)) {
    return '같은 문자에 특수 기호가 과도하게 반복되었습니다.';
  }

  if (/(.)\1{30,}/u.test(text)) {
    return '같은 문자를 과도하게 반복할 수 없습니다.';
  }

  return '';
};

const getInitialDraft = () => {
  const rawDraft = localStorage.getItem(DRAFT_KEY);
  if (!rawDraft) return { title: '', description: '', tags: [] as string[] };
  try {
    const draft = JSON.parse(rawDraft) as {
      title?: string;
      description?: string;
      tags?: string[];
    };
    return {
      title: draft.title ?? '',
      description: draft.description ?? '',
      tags: Array.isArray(draft.tags) ? draft.tags : [],
    };
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return { title: '', description: '', tags: [] as string[] };
  }
};

const BackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b3b3b" strokeWidth="2.2">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const DebateCreatePage = () => {
  const navigate = useNavigate();
  const { createDebate } = useDebate();
  const { isAuthenticated } = useAuthStore();
  const [draft] = useState(getInitialDraft);
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [tags, setTags] = useState<string[]>(draft.tags);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description, tags }));
  }, [title, description, tags]);

  const normalizeTag = (value: string) => value.trim().toLowerCase();

  const addTag = () => {
    const trimmed = normalizeTag(tagInput);
    if (!trimmed || tags.includes(trimmed) || tags.length >= TAG_MAX_COUNT) return;
    const tagError = getCommunityTextValidationError(trimmed, '태그');
    if (tagError) {
      setError(tagError);
      return;
    }
    setError('');
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        const firstMessage = message.find((item) => typeof item === 'string');
        if (firstMessage) return firstMessage;
      }
      if (typeof message === 'string') return message;
    }
    return '토론 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  };

  const handleCreate = async () => {
    if (isSubmitting) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      setError('토론 제목을 입력해 주세요.');
      return;
    }

    if (!description.trim()) {
      setError('토론 설명을 입력해 주세요.');
      return;
    }

    const normalizedTags = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
    const validationError =
      getCommunityTextValidationError(title.trim(), '토론 제목') ||
      getCommunityTextValidationError(description.trim(), '토론 설명') ||
      normalizedTags
        .map((tag) => getCommunityTextValidationError(tag, '태그'))
        .find(Boolean) ||
      '';

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await createDebate({
        title: title.trim(),
        description: description.trim(),
        debateType: DEFAULT_DEBATE_TYPE,
        tags: normalizedTags,
        closeConditionType: 'MANUAL',
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate('/debate-room');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <Header>
        <BackButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <BackIcon />
        </BackButton>
        <HeaderTitle>토론 만들기</HeaderTitle>
        <HeaderSpacer />
      </Header>
      <HeaderDivider />

      <Body>
        <SectionCard>
          <SectionTitle>토론 제목</SectionTitle>
          <TitleInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="토론 제목을 입력하세요..."
            maxLength={TITLE_MAX_LENGTH}
          />
          <CountText>{title.length}/{TITLE_MAX_LENGTH}</CountText>
        </SectionCard>

        <SectionCard>
          <SectionTitle>토론 설명</SectionTitle>
          <DescriptionInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력하세요..."
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
          <CountText>{description.length}/{DESCRIPTION_MAX_LENGTH}</CountText>
        </SectionCard>

        <SectionCard>
          <SectionTitle>토론 태그</SectionTitle>
          <TagInputRow>
            <TagTextInput
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.slice(0, TAG_MAX_LENGTH))}
              onKeyDown={handleTagKeyDown}
              placeholder="태그를 입력하세요"
              disabled={tags.length >= TAG_MAX_COUNT}
            />
            <TagAddButton
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim() || tags.length >= TAG_MAX_COUNT}
            >
              추가
            </TagAddButton>
          </TagInputRow>
          <TagCountText>{tags.length}/{TAG_MAX_COUNT}</TagCountText>
          {tags.length > 0 && (
            <TagList>
              {tags.map((tag) => (
                <TagChip key={tag} type="button" onClick={() => removeTag(tag)}>
                  <span>{tag}</span>
                  <CloseMark aria-hidden>×</CloseMark>
                </TagChip>
              ))}
            </TagList>
          )}
        </SectionCard>

        <ActionRow>
          <SaveButton type="button">보관</SaveButton>
          <CreateButton type="button" onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? '생성 중...' : '생성'}
          </CreateButton>
        </ActionRow>
        {error && <ErrorText>{error}</ErrorText>}
      </Body>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
`;

const Header = styled.header`
  height: clamp(64px, 17.7vw, 76px);
  display: flex;
  align-items: center;
  padding: clamp(8px, 2.8vw, 12px) var(--page-x) 0;
  background: #f5f5f5;
`;

const BackButton = styled.button`
  width: var(--tap-size);
  height: var(--tap-size);
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.h1`
  flex: 1;
  text-align: center;
  font-size: var(--title-sm);
  font-weight: 700;
  color: #2f3238;
  letter-spacing: -0.04em;

`;

const HeaderSpacer = styled.div`
  width: var(--tap-size);
  height: var(--tap-size);
`;

const HeaderDivider = styled.div`
  height: 2px;
  background: #ececec;
`;

const Body = styled.div`
  padding: clamp(16px, 4.7vw, 20px) var(--page-x) clamp(24px, 6.5vw, 28px);
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.8vw, 12px);
`;

const SectionCard = styled.section`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.7vw, 20px) clamp(14px, 4.2vw, 18px);
`;

const SectionTitle = styled.h2`
  margin: 0 0 clamp(12px, 3.3vw, 14px);
  font-size: var(--title-sm);
  font-weight: 700;
  color: #2f3238;
  letter-spacing: -0.02em;
`;

const TitleInput = styled.input`
  width: 100%;
  height: clamp(38px, 9.8vw, 42px);
  border: none;
  border-bottom: 2px solid #b7b7b7;
  background: transparent;
  font-size: var(--body-md);
  color: #2f3238;
  outline: none;

  &::placeholder {
    color: #b3b3b3;
  }
`;

const DescriptionInput = styled.textarea`
  width: 100%;
  height: clamp(124px, 34.4vw, 148px);
  border-radius: clamp(18px, 5.1vw, 22px);
  border: 2px solid #b7b7b7;
  background: transparent;
  resize: none;
  padding: clamp(12px, 3.3vw, 14px);
  font-size: var(--body-md);
  color: #2f3238;
  outline: none;

  &::placeholder {
    color: #b3b3b3;
  }
`;

const CountText = styled.p`
  margin: 8px 2px 0;
  text-align: right;
  font-size: 12px;
  color: #9b9b9b;
`;

const TagInputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
`;

const TagTextInput = styled.input`
  flex: 1;
  height: clamp(38px, 9.8vw, 42px);
  border: none;
  border-bottom: 2px solid #b7b7b7;
  background: transparent;
  font-size: clamp(14px, 3.5vw, 15px);
  color: #2f3238;
  outline: none;
  min-width: 0;

  &::placeholder {
    color: #b3b3b3;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const TagAddButton = styled.button`
  height: clamp(32px, 8.4vw, 36px);
  padding: 0 clamp(12px, 3.7vw, 16px);
  border-radius: 999px;
  border: 2px solid #2dcd97;
  background: #2dcd97;
  color: #fff;
  font-size: var(--body-sm);
  font-weight: 700;
  align-self: center;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.4;
  }
`;

const TagCountText = styled.p`
  margin: 0 2px 10px;
  text-align: right;
  font-size: 12px;
  color: #9b9b9b;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const TagChip = styled.button`
  height: clamp(32px, 7.9vw, 34px);
  border-radius: 999px;
  border: 2px solid #2dcd97;
  background: #b9f0db;
  color: #2dcd97;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 clamp(10px, 2.8vw, 12px);
  font-size: var(--body-sm);
  font-weight: 600;
`;

const CloseMark = styled.span`
  font-size: clamp(14px, 3.7vw, 16px);
  line-height: 1;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

const SaveButton = styled.button`
  flex: 1;
  height: clamp(50px, 13vw, 56px);
  border-radius: 999px;
  border: 2px solid #1b1b1b;
  background: #ffffff;
  color: #1b1b1b;
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
`;

const CreateButton = styled.button`
  flex: 1;
  height: clamp(50px, 13vw, 56px);
  border-radius: 999px;
  border: none;
  background: #2dcd97;
  color: #ffffff;
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
  &:disabled {
    opacity: 0.7;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #f04444;
  text-align: center;
`;

export default DebateCreatePage;
