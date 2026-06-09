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
  parentCommentId?: string | null;
  authorName: string;
  mention?: string;
};

type CommentGroup = Comment & {
  replies: Comment[];
};

const getMentionPrefix = (name: string) => {
  const normalizedName = name.replace(/\s+/g, '') || '사용자';
  return `@${normalizedName} `;
};

const buildCommentGroups = (comments: Comment[]) => {
  const commentMap = new Map(comments.map((comment) => [comment.id, comment]));
  const rootIdMap = new Map<string, string>();

  const getRootId = (comment: Comment) => {
    const cachedRootId = rootIdMap.get(comment.id);
    if (cachedRootId) return cachedRootId;

    const visitedIds = new Set<string>();
    let current = comment;

    while (current.parentCommentId) {
      if (visitedIds.has(current.id)) break;
      visitedIds.add(current.id);

      const parent = commentMap.get(current.parentCommentId);
      if (!parent) break;

      current = parent;
    }

    rootIdMap.set(comment.id, current.id);
    return current.id;
  };

  const groups = new Map<string, CommentGroup>();

  comments.forEach((comment) => {
    if (getRootId(comment) === comment.id) {
      groups.set(comment.id, { ...comment, replies: [] });
    }
  });

  comments.forEach((comment) => {
    const rootId = getRootId(comment);
    if (rootId === comment.id) return;

    const rootGroup = groups.get(rootId);
    if (rootGroup) {
      rootGroup.replies.push(comment);
    } else {
      groups.set(comment.id, { ...comment, replies: [] });
    }
  });

  return Array.from(groups.values());
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

  const startPostReply = (postId: string, authorName: string) => {
    setReplyTarget({ postId, parentCommentId: null, authorName });
    inputRef.current?.focus();
  };

  const startCommentReply = (postId: string, comment: Comment) => {
    const authorName = comment.author?.nickname ?? '사용자 이름';
    const mention = getMentionPrefix(authorName);

    setReplyTarget({
      postId,
      parentCommentId: comment.parentCommentId ?? comment.id,
      authorName,
      mention,
    });
    setMessage((prev) => (prev.trim() ? prev : mention));
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    if (replyTarget?.mention && message.trim() === replyTarget.mention.trim()) {
      setMessage('');
    }
    setReplyTarget(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!debateId || !trimmedMessage || isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (replyTarget) {
        const content =
          replyTarget.mention && !trimmedMessage.startsWith(replyTarget.mention.trim())
            ? `${replyTarget.mention}${trimmedMessage}`.trim()
            : trimmedMessage;

        await postService.createComment(replyTarget.postId, {
          content,
          parentCommentId: replyTarget.parentCommentId ?? undefined,
        });
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

  const title = currentDebate?.title;
  const description = currentDebate?.description ?? '설명이 존재하지 않습니다.';

  const renderMessageText = (content: string) => {
    const mentionMatch = content.match(/^(@[^\s]+)(\s+)([\s\S]*)$/);

    return (
      <MessageText>
        {mentionMatch ? (
          <>
            <MentionText>{mentionMatch[1]}</MentionText>
            {mentionMatch[2]}
            {mentionMatch[3]}
          </>
        ) : (
          content
        )}
      </MessageText>
    );
  };

  const renderCommentCard = (comment: Comment, postId: string) => (
    <MessageCard key={comment.id} type="button" onClick={() => startCommentReply(postId, comment)}>
      <MetaRow>
        <NumberText>#1</NumberText>
        <Avatar />
        <AuthorName>{comment.author?.nickname ?? '사용자 이름'}</AuthorName>
      </MetaRow>
      {renderMessageText(comment.content)}
    </MessageCard>
  );

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
        <PromptText>당신은 앞으로 AI의 전망을 잘 알고 있습니까?</PromptText>
        <PromptArrow aria-hidden />
      </PromptCard>

      <ThreadArea>
        {loadError && <ErrorText>{loadError}</ErrorText>}
        {!loadError && visibleMessages.length === 0 && (
          <EmptyCard>아직 의견이 없습니다. 첫 의견을 남겨보세요.</EmptyCard>
        )}
        {visibleMessages.map((item) => {
          const comments = commentsByPostId[item.id] ?? [];
          const commentGroups = buildCommentGroups(comments);

          return (
            <MessageGroup key={item.id}>
              <MessageCard
                type="button"
                onClick={() => startPostReply(item.id, item.author.nickname)}
              >
                <MetaRow>
                  <NumberText>#1</NumberText>
                  <Avatar />
                  <AuthorName>{item.author.nickname}</AuthorName>
                </MetaRow>
                {renderMessageText(item.content)}
              </MessageCard>

              {commentGroups.length > 0 && (
                <CommentList>
                  {commentGroups.map((comment) => (
                    <CommentGroupItem key={comment.id}>
                      {renderCommentCard(comment, item.id)}
                      {comment.replies.length > 0 && (
                        <ReplyList>{comment.replies.map((reply) => renderCommentCard(reply, item.id))}</ReplyList>
                      )}
                    </CommentGroupItem>
                  ))}
                </CommentList>
              )}
            </MessageGroup>
          );
        })}
      </ThreadArea>

      <ComposerWrap>
        {submitError && <SubmitError>{submitError}</SubmitError>}
        {replyTarget && (
          <ReplyBanner>
            <span>
              {replyTarget.mention
                ? `${replyTarget.mention.trim()} 답글 작성 중`
                : `${replyTarget.authorName} 의견에 댓글 작성 중`}
            </span>
            <ReplyCancelButton type="button" onClick={cancelReply}>
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
  padding: 0 0 calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin: 0 auto clamp(36px, 13.5vw, 58px);
`;

const Header = styled.header`
  height: clamp(68px, 18.6vw, 80px);
  padding: 0 clamp(18px, 5.6vw, 24px);
  background: #ffffff;
  display: grid;
  grid-template-columns: clamp(36px, 9.3vw, 40px) 1fr clamp(36px, 9.3vw, 40px);
  align-items: center;
  gap: clamp(8px, 2.8vw, 12px);
`;

const IconButton = styled.button`
  width: clamp(36px, 9.3vw, 40px);
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const InfoIcon = styled.img`
  width: clamp(30px, 7.9vw, 34px);
  height: clamp(30px, 7.9vw, 34px);
`;

const HeaderText = styled.div`
  min-width: 0;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: var(--title-sm);
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Description = styled.p`
  margin: 4px 0 0;
  color: #a0a0a0;
  font-size: var(--body-sm);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PromptCard = styled.section`
  width: min(378px, calc(100% - var(--page-x) - var(--page-x)));
  min-height: clamp(88px, 24.2vw, 104px);
  margin: clamp(14px, 4.2vw, 18px) auto clamp(56px, 20.5vw, 88px);
  border-radius: var(--card-radius);
  background: #ffffff;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 5.1vw, 22px);
`;

const PromptText = styled.p`
  margin: 0;
  color: #b0b0b0;
  font-size: var(--body-sm);
`;

const PromptArrow = styled.span`
  width: 22px;
  height: 22px;
  border-right: 2px solid #a6a6a6;
  border-bottom: 2px solid #a6a6a6;
  transform: rotate(45deg);
`;

const ThreadArea = styled.section`
  padding: 0 var(--page-x) clamp(20px, 5.6vw, 24px);
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 3.3vw, 14px);
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: clamp(24px, 7.9vw, 34px);
`;

const CommentGroupItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReplyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: clamp(16px, 5.6vw, 24px);
`;

const MessageCard = styled.button`
  width: 100%;
  min-height: clamp(64px, 16.7vw, 72px);
  border: none;
  border-radius: 4px;
  background: #ffffff;
  padding: clamp(10px, 2.8vw, 12px) clamp(12px, 3.3vw, 14px);
  overflow: hidden;
  text-align: left;
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
  font-size: var(--body-sm);
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const MentionText = styled.span`
  color: #2dcd97;
  font-weight: 700;
`;

const EmptyCard = styled.div`
  border-radius: 12px;
  background: #ffffff;
  padding: clamp(14px, 4.2vw, 18px);
  color: #a0a0a0;
  font-size: var(--body-sm);
  text-align: center;
`;

const ErrorText = styled(EmptyCard)`
  color: #f04444;
`;

const ComposerWrap = styled.div`
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  z-index: 20;
  width: 100%;
  max-width: var(--app-max-width);
  transform: translateX(-50%);
  background: #ffffff;
  padding: clamp(8px, 2.3vw, 10px) var(--page-x) max(clamp(8px, 2.3vw, 10px), env(safe-area-inset-bottom));
  box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.04);
`;

const Composer = styled.form`
  display: grid;
  grid-template-columns: clamp(36px, 9.3vw, 40px) 1fr clamp(36px, 9.3vw, 40px);
  align-items: center;
  gap: 8px;
`;

const HashButton = styled.button`
  width: clamp(36px, 9.3vw, 40px);
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  color: #a6a6a6;
  font-size: clamp(20px, 5.1vw, 22px);
  font-weight: 500;
`;

const MessageInput = styled.input`
  width: 100%;
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #555555;
  font-size: 15px;
  padding: 0 clamp(14px, 4.2vw, 18px);
  outline: none;

  &::placeholder {
    color: #9f9f9f;
  }
`;

const SendButton = styled.button`
  width: clamp(36px, 9.3vw, 40px);
  height: clamp(36px, 9.3vw, 40px);
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
