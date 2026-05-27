import { isAxiosError } from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import iconChat from '../../assets/icon_chat copy.svg';
import iconChatActivate from '../../assets/icon_chat_activate.svg';
import iconDebate from '../../assets/icon_debate.svg';
import iconDebateActivate from '../../assets/icon_debate_activate.svg';
import iconTalk from '../../assets/icon_talk.svg';
import iconTalkActivate from '../../assets/icon_talk_activate.svg';
import { useDebate } from '../../hooks/useDebate';
import { useAuthStore } from '../../stores/authStore';

type DebateMode = 'pro-con' | 'consensus' | 'comment';

const TAG_OPTIONS = ['연애', '컴퓨터기술', '음악', '사회', '시사', '역사', '음식조리', '공예', '벌크업', '스트레칭'];
const TITLE_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 120;

const MODE_DESCRIPTION: Record<DebateMode, string> = {
  'pro-con': '찬반 토론은 토론 후 결론에 대해 찬성 / 반대 의견을 내비치는 토론 방식입니다.',
  consensus: '합의 토론은 서로의 의견 차이를 좁히며 공통된 결론을 찾아가는 토론 방식입니다.',
  comment: '댓글 토론은 글과 댓글로 자유롭게 의견을 주고받는 토론 방식입니다.',
};
const MODE_TO_DEBATE_TYPE: Record<DebateMode, 'PROS_CONS' | 'CONSENSUS' | 'FREE'> = {
  'pro-con': 'PROS_CONS',
  consensus: 'CONSENSUS',
  comment: 'FREE',
};

const MODE_ICONS: Record<DebateMode, { active: string; inactive: string }> = {
  'pro-con': {
    active: iconDebateActivate,
    inactive: iconDebate,
  },
  consensus: {
    active: iconTalkActivate,
    inactive: iconTalk,
  },
  comment: {
    active: iconChatActivate,
    inactive: iconChat,
  },
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTag, setSelectedTag] = useState('미술');
  const [mode, setMode] = useState<DebateMode>('pro-con');
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
        debateType: MODE_TO_DEBATE_TYPE[mode],
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

        <SectionCard>
          <SectionTitle>토론 방식</SectionTitle>
          <ModeRow>
            <ModeItem>
              <ModeButton type="button" onClick={() => setMode('pro-con')}>
                <ModeIcon src={mode === 'pro-con' ? MODE_ICONS['pro-con'].active : MODE_ICONS['pro-con'].inactive} alt="" />
              </ModeButton>
              <ModeLabel $active={mode === 'pro-con'}>찬반 토론</ModeLabel>
            </ModeItem>

            <ModeItem>
              <ModeButton type="button" onClick={() => setMode('consensus')}>
                <ModeIcon src={mode === 'consensus' ? MODE_ICONS.consensus.active : MODE_ICONS.consensus.inactive} alt="" />
              </ModeButton>
              <ModeLabel $active={mode === 'consensus'}>합의 토론</ModeLabel>
            </ModeItem>

            <ModeItem>
              <ModeButton type="button" onClick={() => setMode('comment')}>
                <ModeIcon src={mode === 'comment' ? MODE_ICONS.comment.active : MODE_ICONS.comment.inactive} alt="" />
              </ModeButton>
              <ModeLabel $active={mode === 'comment'}>댓글 토론</ModeLabel>
            </ModeItem>
          </ModeRow>

          <ModeDescBox>
            <ModeDescText>• {MODE_DESCRIPTION[mode]}</ModeDescText>
          </ModeDescBox>
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
`;

const SectionCard = styled.section`
  background: #efefef;
  border-radius: 24px;
  padding: 20px 18px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  color: #2f3238;
  letter-spacing: -0.02em;
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

const ModeRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const ModeItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ModeButton = styled.button`
  width: 72px;
  height: 72px;
  border: none;
  background: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ModeIcon = styled.img`
  width: 72px;
  height: 72px;
  display: block;
`;

const ModeLabel = styled.span<{ $active: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#2dcd97' : '#a0a0a0')};
`;

const ModeDescBox = styled.div`
  border: 2px solid #b7b7b7;
  border-radius: 16px;
  padding: 12px 14px;
`;

const ModeDescText = styled.p`
  font-size: 14px;
  line-height: 1.45;
  color: #9f9f9f;
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
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #f04444;
  text-align: center;
`;

export default DebateCreatePage;
