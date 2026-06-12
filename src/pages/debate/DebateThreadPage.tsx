import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import iconShowInfo from '../../assets/icon_show_info.svg';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useDebate } from '../../hooks/useDebate';
import { postService } from '../../services/postService';
import type { Comment } from '../../types/debate';

type ReplyTarget = {
  postId: string;
  authorName: string;
};

const BackIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2.2">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const SendIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a6a6a6" strokeWidth="1.8">
    <path d="M20 4 4 11.5l7 2.5 2.5 7L20 4Z" />
    <path d="m11 14 4-4" />
  </svg>
);

const DebateThreadPage = () => {
  const navigate = useNavigate();
  const { id: debateId } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentDebate, messages, fetchDebate, fetchMessages, createMessage } = useDebate();
  const [message, setMessage] = useState('');
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, Comment[]>>({});
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!debateId) return;

    const loadThread = async () => {
      try {
        await Promise.all([fetchDebate(debateId), fetchMessages(debateId)]);
        setLoadError('');
      } catch {
        setLoadError('토론 내용을 불러오지 못했습니다.');
      }
    };

    void loadThread();
  }, [debateId, fetchDebate, fetchMessages]);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleMessages = useMemo(
    () => messages.filter((item) => item.status === 'VISIBLE').slice().reverse(),
    [messages],
  );

  useEffect(() => {
    if (visibleMessages.length === 0) {
      setCommentsByPostId({});
      return;
    }

    let isCurrent = true;

    const loadComments = async () => {
      const entries = await Promise.all(
        visibleMessages.map(async (item) => {
          try {
            const { data } = await postService.getComments(item.id);
            return [item.id, data.comments] as const;
          } catch {
            return [item.id, []] as const;
          }
        }),
      );

      if (isCurrent) {
        setCommentsByPostId(Object.fromEntries(entries));
      }
    };

    void loadComments();

    return () => {
      isCurrent = false;
    };
  }, [visibleMessages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!debateId || !message.trim() || isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (replyTarget) {
        await postService.createComment(replyTarget.postId, { content: message.trim() });
        const { data } = await postService.getComments(replyTarget.postId);
        setCommentsByPostId((prev) => ({ ...prev, [replyTarget.postId]: data.comments }));
        setReplyTarget(null);
      } else {
        await createMessage(debateId, message.trim());
      }
      setMessage('');
      inputRef.current?.focus();
    } catch {
      setSubmitError('메시지를 전송하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = currentDebate?.title ?? '기술 토론';
  const description = currentDebate?.description ?? 'AI가 사람의 직업을 대체 할 수 있을까?';

  return (
    <Wrapper>
      <Logo src={logoSymbol} alt="정명" />

      <Header>
        <IconButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
        <HeaderText>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </HeaderText>
        <IconButton type="button" aria-label="토론 정보" onClick={() => navigate(`/debate/${debateId}/info`)}>
          <InfoIcon src={iconShowInfo} alt="" />
        </IconButton>
      </Header>

      <PromptCard>
        <PromptText>{description}</PromptText>
        <PromptArrow aria-hidden />
      </PromptCard>

      <ThreadArea>
        {loadError && <ErrorText>{loadError}</ErrorText>}
        {!loadError && visibleMessages.length === 0 && (
          <EmptyCard>아직 의견이 없습니다. 첫 의견을 남겨보세요.</EmptyCard>
        )}
        {visibleMessages.map((item, messageIndex) => {
          const comments = commentsByPostId[item.id] ?? [];
          const postNumber = `#${messageIndex + 1}`;

          return (
            <MessageGroup key={item.id}>
              <MessageNode $depth={0}>
                <MessageCard
                  type="button"
                  onClick={() => {
                    setReplyTarget({ postId: item.id, authorName: item.author.nickname });
                    inputRef.current?.focus();
                  }}
                >
                  <MetaRow>
                    <NumberText>{postNumber}</NumberText>
                    <Avatar />
                    <AuthorName>{item.author.nickname}</AuthorName>
                  </MetaRow>
                  <MessageText>{item.content}</MessageText>
                </MessageCard>
              </MessageNode>

              {comments.map((comment, commentIndex) => (
                <MessageNode key={comment.id} $depth={1}>
                  <Connector aria-hidden />
                  <MessageCard
                    type="button"
                    onClick={() => {
                      setReplyTarget({ postId: item.id, authorName: comment.author?.nickname ?? '사용자 이름' });
                      inputRef.current?.focus();
                    }}
                  >
                    <MetaRow>
                      <NumberText>{postNumber}-{commentIndex + 1}</NumberText>
                      <Avatar />
                      <AuthorName>{comment.author?.nickname ?? '사용자 이름'}</AuthorName>
                    </MetaRow>
                    <MessageText>{comment.content}</MessageText>
                  </MessageCard>
                </MessageNode>
              ))}
            </MessageGroup>
          );
        })}
      </ThreadArea>

      <ComposerWrap>
        {submitError && <SubmitError>{submitError}</SubmitError>}
        {replyTarget && (
          <ReplyBanner>
            <span>{replyTarget.authorName}에게 답글 작성 중</span>
            <ReplyCancelButton type="button" onClick={() => setReplyTarget(null)}>
              취소
            </ReplyCancelButton>
          </ReplyBanner>
        )}
        <Composer onSubmit={handleSubmit}>
          <HashButton type="button" aria-label="태그">
            #
          </HashButton>
          <MessageInput
            ref={inputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="입력창.."
            aria-label="토론 메시지 입력"
          />
          <SendButton type="submit" aria-label="메시지 전송" disabled={!message.trim() || isSubmitting}>
            <SendIcon />
          </SendButton>
        </Composer>
      </ComposerWrap>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 0 0 90px;

  @media (max-width: 375px) {
    padding-bottom: 82px;
  }
`;

const Logo = styled.img`
  width: 68px;
  height: 40px;
  display: block;
  margin: 0 auto 58px;

  @media (max-width: 375px) {
    width: 58px;
    height: 34px;
    margin-bottom: 36px;
  }
`;

const Header = styled.header`
  height: 80px;
  padding: 0 24px;
  background: #ffffff;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 12px;

  @media (max-width: 375px) {
    height: 68px;
    padding: 0 18px;
    grid-template-columns: 36px 1fr 36px;
    gap: 8px;
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  @media (max-width: 375px) {
    width: 36px;
    height: 36px;
  }
`;

const InfoIcon = styled.img`
  width: 34px;
  height: 34px;

  @media (max-width: 375px) {
    width: 30px;
    height: 30px;
  }
`;

const HeaderText = styled.div`
  min-width: 0;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 375px) {
    font-size: 18px;
  }
`;

const Description = styled.p`
  margin: 4px 0 0;
  color: #a0a0a0;
  font-size: 14px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 375px) {
    font-size: 12px;
  }
`;

const PromptCard = styled.section`
  width: calc(100% - 48px);
  min-height: 104px;
  margin: 18px auto 88px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;

  @media (max-width: 375px) {
    width: calc(100% - 32px);
    min-height: 88px;
    margin: 14px auto 56px;
    border-radius: 20px;
    gap: 16px;
  }
`;

const PromptText = styled.p`
  margin: 0;
  color: #b0b0b0;
  font-size: 14px;
`;

const PromptArrow = styled.span`
  width: 22px;
  height: 22px;
  border-right: 2px solid #a6a6a6;
  border-bottom: 2px solid #a6a6a6;
  transform: rotate(45deg);
`;

const ThreadArea = styled.section`
  padding: 0 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 375px) {
    padding: 0 10px 20px;
    gap: 12px;
  }
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageNode = styled.div<{ $depth: number }>`
  position: relative;
  margin-left: ${({ $depth }) => `${Math.min($depth * 18, 108)}px`};

  @media (max-width: 375px) {
    margin-left: ${({ $depth }) => `${Math.min($depth * 14, 84)}px`};
  }
`;

const Connector = styled.span`
  position: absolute;
  left: -14px;
  top: -18px;
  width: 18px;
  height: 34px;
  border-left: 1px solid #cfcfcf;
  border-bottom: 1px solid #cfcfcf;
  border-radius: 0 0 0 16px;
`;

const MessageCard = styled.button`
  width: 100%;
  min-height: 72px;
  border: none;
  border-radius: 4px;
  background: #ffffff;
  padding: 12px 14px;
  overflow: hidden;
  text-align: left;

  @media (max-width: 375px) {
    min-height: 64px;
    padding: 10px 12px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
`;

const NumberText = styled.span`
  color: #b5b5b5;
  font-size: 12px;
`;

const Avatar = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #b8b8b8;
  flex-shrink: 0;
`;

const AuthorName = styled.span`
  min-width: 0;
  color: #b0b0b0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MessageText = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const EmptyCard = styled.div`
  border-radius: 12px;
  background: #ffffff;
  padding: 18px;
  color: #a0a0a0;
  font-size: 14px;
  text-align: center;
`;

const ErrorText = styled(EmptyCard)`
  color: #f04444;
`;

const ComposerWrap = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  padding: 10px 16px max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.04);

  @media (max-width: 375px) {
    padding: 8px 12px max(8px, env(safe-area-inset-bottom));
  }
`;

const Composer = styled.form`
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 8px;

  @media (max-width: 375px) {
    grid-template-columns: 36px 1fr 36px;
  }
`;

const HashButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  color: #a6a6a6;
  font-size: 22px;
  font-weight: 500;

  @media (max-width: 375px) {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
`;

const MessageInput = styled.input`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #555555;
  font-size: 15px;
  padding: 0 18px;
  outline: none;

  &::placeholder {
    color: #9f9f9f;
  }

  @media (max-width: 375px) {
    height: 36px;
    font-size: 14px;
    padding: 0 14px;
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:disabled {
    opacity: 0.45;
  }

  @media (max-width: 375px) {
    width: 36px;
    height: 36px;
  }
`;

const SubmitError = styled.p`
  margin: 0 0 8px;
  text-align: center;
  color: #f04444;
  font-size: 12px;
`;

const ReplyBanner = styled.div`
  height: 34px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: #f0f0f0;
  color: #8f8f8f;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
`;

const ReplyCancelButton = styled.button`
  border: none;
  background: transparent;
  color: #2dcd97;
  font-size: 13px;
  font-weight: 700;
  padding: 0;
`;

export default DebateThreadPage;
