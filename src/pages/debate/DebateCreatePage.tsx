import { isAxiosError } from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDebate } from '../../hooks/useDebate';
import { useAuthStore } from '../../stores/authStore';

const TAG_OPTIONS = ['연애', '컴퓨터기술', '음악', '사회', '시사', '역사', '음식조리', '공예', '벌크업', '스트레칭'];
const TITLE_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 120;
const DEFAULT_DEBATE_TYPE: 'PROS_CONS' = 'PROS_CONS';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTag, setSelectedTag] = useState('미술');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(', ');
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

    setError('');
    setIsSubmitting(true);
    try {
      await createDebate({
        title: title.trim(),
        description: description.trim(),
        debateType: DEFAULT_DEBATE_TYPE,
        tags: [selectedTag],
        closeConditionType: 'MANUAL',
      });
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
          <SelectedTagChip type="button">
            <CloseMark aria-hidden>x</CloseMark>
            <span>{selectedTag}</span>
          </SelectedTagChip>

          <TagPanel>
            {TAG_OPTIONS.map((tag) => (
              <TagChip
                key={tag}
                type="button"
                $active={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </TagChip>
            ))}
          </TagPanel>
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
  height: 76px;
  display: flex;
  align-items: center;
  padding: 12px 18px 0;
  background: #f5f5f5;

  @media (max-width: 375px) {
    height: 64px;
    padding: 8px 14px 0;
  }
`;

const BackButton = styled.button`
  width: 42px;
  height: 42px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.h1`
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #2f3238;
  letter-spacing: -0.04em;

  @media (max-width: 375px) {
    font-size: 18px;
  }
`;

const HeaderSpacer = styled.div`
  width: 42px;
  height: 42px;
`;

const HeaderDivider = styled.div`
  height: 2px;
  background: #ececec;
`;

const Body = styled.div`
  padding: 20px 14px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 375px) {
    padding: 16px 12px 24px;
    gap: 10px;
  }
`;

const SectionCard = styled.section`
  background: #efefef;
  border-radius: 24px;
  padding: 20px 18px;

  @media (max-width: 375px) {
    border-radius: 20px;
    padding: 16px 14px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  color: #2f3238;
  letter-spacing: -0.02em;

  @media (max-width: 375px) {
    font-size: 18px;
    margin-bottom: 12px;
  }
`;

const TitleInput = styled.input`
  width: 100%;
  height: 42px;
  border: none;
  border-bottom: 2px solid #b7b7b7;
  background: transparent;
  font-size: 16px;
  color: #2f3238;
  outline: none;

  &::placeholder {
    color: #b3b3b3;
  }
`;

const DescriptionInput = styled.textarea`
  width: 100%;
  height: 148px;
  border-radius: 22px;
  border: 2px solid #b7b7b7;
  background: transparent;
  resize: none;
  padding: 14px 14px;
  font-size: 16px;
  color: #2f3238;
  outline: none;

  &::placeholder {
    color: #b3b3b3;
  }

  @media (max-width: 375px) {
    height: 124px;
    border-radius: 18px;
    padding: 12px;
    font-size: 14px;
  }
`;

const CountText = styled.p`
  margin: 8px 2px 0;
  text-align: right;
  font-size: 12px;
  color: #9b9b9b;
`;

const SelectedTagChip = styled.button`
  height: 36px;
  border-radius: 999px;
  border: 2px solid #2dcd97;
  color: #2dcd97;
  background: #b9f0db;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const CloseMark = styled.span`
  font-size: 18px;
  line-height: 1;
`;

const TagPanel = styled.div`
  border: 2px solid #b7b7b7;
  border-radius: 24px;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 375px) {
    border-radius: 20px;
    padding: 10px;
    gap: 8px;
  }
`;

const TagChip = styled.button<{ $active: boolean }>`
  height: 36px;
  border-radius: 999px;
  border: 2px solid ${({ $active }) => ($active ? '#2dcd97' : '#b7b7b7')};
  background: ${({ $active }) => ($active ? '#b9f0db' : 'transparent')};
  color: ${({ $active }) => ($active ? '#2dcd97' : '#a6a6a6')};
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

const SaveButton = styled.button`
  flex: 1;
  height: 56px;
  border-radius: 999px;
  border: 2px solid #1b1b1b;
  background: #ffffff;
  color: #1b1b1b;
  font-size: 18px;
  font-weight: 700;

  @media (max-width: 375px) {
    height: 50px;
    font-size: 16px;
  }
`;

const CreateButton = styled.button`
  flex: 1;
  height: 56px;
  border-radius: 999px;
  border: none;
  background: #2dcd97;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  &:disabled {
    opacity: 0.7;
  }

  @media (max-width: 375px) {
    height: 50px;
    font-size: 16px;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #f04444;
  text-align: center;
`;

export default DebateCreatePage;
