import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import iconShowInfo from "../../assets/icon_show_info.svg";
import logoSymbol from "../../assets/logo_symbol.svg";
import { useDebate } from "../../hooks/useDebate";
import { usePageLoading } from "../../hooks/usePageLoading";
import { consensusService } from "../../services/consensusService";
import { debateService } from "../../services/debateService";
import { postService } from "../../services/postService";
import { useAuthStore } from "../../stores/authStore";
import ThreadSkeleton from "../../components/common/ThreadSkeleton";
import type {
  Comment,
  Consensus,
  ConsensusVoteType,
  SelectionSource,
} from "../../types/debate";

type ReplyTarget = {
  postId: string;
  parentCommentId?: string | null;
  authorName: string;
  mention?: string;
};

type CommentGroup = Comment & {
  replies: Comment[];
};

type PendingSelection = {
  sourceType: SelectionSource;
  sourceId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  menuX: number;
  menuY: number;
};

type SelectionAction = "consensus" | "child";
type ConsensusFinalizeAction = "approve" | "reject" | "close";

type ConsensusDraft = {
  selection: PendingSelection;
  term: string;
  title: string;
  content: string;
};

const SELECTION_SOURCE_SELECTOR =
  "[data-selection-source-type][data-selection-source-id]";

const CONSENSUS_STATUS_LABEL: Record<string, string> = {
  OPEN: "진행 중",
  APPROVED: "기준 정의 확정",
  REJECTED: "반려",
  CLOSED: "종료",
};

const buildConsensusSourceKey = (sourceType: SelectionSource, sourceId: string) =>
  `${sourceType}:${sourceId}`;

const getMentionPrefix = (name: string) => {
  const normalizedName = name.replace(/\s+/g, "") || "사용자";
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

const getSelectionSourceElement = (node: Node | null) => {
  if (!node) return null;
  const element =
    node instanceof Element
      ? node
      : node.parentNode instanceof Element
        ? node.parentNode
        : null;
  return element?.closest<HTMLElement>(SELECTION_SOURCE_SELECTOR) ?? null;
};

const clampMenuCoordinate = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const BackIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#353535"
    strokeWidth="2.2"
  >
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const SendIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#a6a6a6"
    strokeWidth="1.8"
  >
    <path d="M20 4 4 11.5l7 2.5 2.5 7L20 4Z" />
    <path d="m11 14 4-4" />
  </svg>
);

const DebateThreadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: debateId } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  const { currentDebate, messages, fetchDebate, fetchMessages, createMessage } =
    useDebate();
  const { user } = useAuthStore();
  const { isLoading, showLoadingUI, error, executeAsync } = usePageLoading();
  const draftKey = debateId ? `debate-thread:${debateId}:composer` : "";
  const [message, setMessage] = useState(() =>
    draftKey ? (localStorage.getItem(draftKey) ?? "") : "",
  );
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<string, Comment[]>
  >({});
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);
  const [consensuses, setConsensuses] = useState<Consensus[]>([]);
  const [consensusDraft, setConsensusDraft] = useState<ConsensusDraft | null>(
    null,
  );
  const [selectedConsensus, setSelectedConsensus] = useState<Consensus | null>(
    null,
  );
  const [voteComment, setVoteComment] = useState("");
  const [activeCardMenuKey, setActiveCardMenuKey] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canFinalizeConsensus =
    user?.role === "ADMIN" || currentDebate?.creator?.id === user?.id;

  const refreshConsensuses = async (id: string) => {
    const { data } = await debateService.getConsensuses(id);
    setConsensuses(data.consensuses);
  };

  useEffect(() => {
    if (!debateId) return;

    const loadThread = async () => {
      await executeAsync(async () => {
        await Promise.all([
          fetchDebate(debateId),
          fetchMessages(debateId),
          refreshConsensuses(debateId),
        ]);
      });
    };

    void loadThread();
  }, [debateId, fetchDebate, fetchMessages, executeAsync]);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftKey) return;
    localStorage.setItem(draftKey, message);
  }, [draftKey, message]);

  const threadMessages = useMemo(
    () =>
      messages
        .filter((item) => item.status !== "HIDDEN")
        .slice()
        .reverse(),
    [messages],
  );

  const consensusesBySource = useMemo(() => {
    const map = new Map<string, Consensus[]>();

    consensuses.forEach((consensus) => {
      const target = consensus.selectionTarget;
      if (!target?.sourceType || !target.sourceId) return;

      const key = buildConsensusSourceKey(target.sourceType, target.sourceId);
      const sourceConsensuses = map.get(key) ?? [];
      sourceConsensuses.push(consensus);
      map.set(key, sourceConsensuses);
    });

    return map;
  }, [consensuses]);

  const openConsensusCount = consensuses.filter(
    (consensus) => consensus.status === "OPEN",
  ).length;
  const approvedConsensusCount = consensuses.filter(
    (consensus) => consensus.status === "APPROVED",
  ).length;

  useEffect(() => {
    if (threadMessages.length === 0) {
      window.setTimeout(() => setCommentsByPostId({}), 0);
      return;
    }

    let isCurrent = true;

    const loadComments = async () => {
      const entries = await Promise.all(
        threadMessages.map(async (item) => {
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
  }, [threadMessages]);

  useEffect(() => {
    if (!debateId) return;
    const intervalId = window.setInterval(() => {
      void fetchMessages(debateId);
      void refreshConsensuses(debateId);
      const postIds = threadMessages.map((item) => item.id);
      void Promise.all(
        postIds.map(async (postId) => {
          try {
            const { data } = await postService.getComments(postId);
            return [postId, data.comments] as const;
          } catch {
            return [postId, commentsByPostId[postId] ?? []] as const;
          }
        }),
      ).then((entries) => {
        setCommentsByPostId((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [commentsByPostId, debateId, fetchMessages, threadMessages]);

  const clearSelectionMenu = () => {
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setPendingSelection(null), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        pendingSelection &&
        !selectionMenuRef.current?.contains(event.target as Node)
      ) {
        setPendingSelection(null);
      }
    };

    const handleSelectionChange = () => {
      if (!window.getSelection()?.toString().trim()) {
        setPendingSelection(null);
      }
    };

    const handleCardMenuPointerDown = (event: PointerEvent) => {
      if (
        activeCardMenuKey &&
        event.target instanceof Element &&
        !event.target.closest("[data-card-menu-root]")
      ) {
        setActiveCardMenuKey(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerdown", handleCardMenuPointerDown);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerdown", handleCardMenuPointerDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [activeCardMenuKey, pendingSelection]);

  const handleTextSelection = () => {
    window.setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString() ?? "";
      if (!selection || selection.rangeCount === 0 || !selectedText.trim()) {
        setPendingSelection(null);
        return;
      }

      const anchorSource = getSelectionSourceElement(selection.anchorNode);
      const focusSource = getSelectionSourceElement(selection.focusNode);
      if (!anchorSource || !focusSource) return;

      if (anchorSource !== focusSource) {
        setPendingSelection(null);
        setActionMessage("하나의 의견 또는 댓글 안에서만 선택할 수 있습니다.");
        selection.removeAllRanges();
        return;
      }

      if (currentDebate?.status !== "OPEN") {
        setPendingSelection(null);
        setActionMessage(
          "종료되었거나 보관된 토론에서는 선택 액션을 사용할 수 없습니다.",
        );
        selection.removeAllRanges();
        return;
      }

      const range = selection.getRangeAt(0);
      if (
        !anchorSource.contains(range.startContainer) ||
        !anchorSource.contains(range.endContainer)
      ) {
        setPendingSelection(null);
        setActionMessage("하나의 의견 또는 댓글 안에서만 선택할 수 있습니다.");
        selection.removeAllRanges();
        return;
      }

      const beforeRange = range.cloneRange();
      beforeRange.selectNodeContents(anchorSource);
      beforeRange.setEnd(range.startContainer, range.startOffset);

      const startOffset = beforeRange.toString().length;
      const endOffset = startOffset + selectedText.length;
      const rect = range.getBoundingClientRect();
      const sourceRect = anchorSource.getBoundingClientRect();
      const menuX = clampMenuCoordinate(
        rect.width
          ? rect.left + rect.width / 2
          : sourceRect.left + sourceRect.width / 2,
        88,
        window.innerWidth - 88,
      );
      const menuY = clampMenuCoordinate(
        (rect.height ? rect.top : sourceRect.top) - 10,
        72,
        window.innerHeight - 88,
      );

      setActionMessage("");
      setPendingSelection({
        sourceType: anchorSource.dataset.selectionSourceType as SelectionSource,
        sourceId: anchorSource.dataset.selectionSourceId ?? "",
        selectedText,
        startOffset,
        endOffset,
        menuX,
        menuY,
      });
    }, 0);
  };

  const getMutationErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
      if (error.response?.status === 409) {
        return "요청이 현재 상태와 충돌합니다.";
      }
    }
    return "요청을 처리하지 못했습니다.";
  };

  const startPostReply = (postId: string, authorName: string) => {
    setReplyTarget({ postId, parentCommentId: null, authorName });
    inputRef.current?.focus();
  };

  const startCommentReply = (postId: string, comment: Comment) => {
    if (comment.status !== "VISIBLE") return;

    const authorName = comment.author?.nickname ?? "사용자 이름";
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
      setMessage("");
    }
    setReplyTarget(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!debateId || !trimmedMessage || isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      if (replyTarget) {
        const content =
          replyTarget.mention &&
          !trimmedMessage.startsWith(replyTarget.mention.trim())
            ? `${replyTarget.mention}${trimmedMessage}`.trim()
            : trimmedMessage;

        await postService.createComment(replyTarget.postId, {
          content,
          parentCommentId: replyTarget.parentCommentId ?? undefined,
        });
        const { data } = await postService.getComments(replyTarget.postId);
        setCommentsByPostId((prev) => ({
          ...prev,
          [replyTarget.postId]: data.comments,
        }));
        setReplyTarget(null);
      } else {
        await createMessage(debateId, message.trim());
      }
      setMessage("");
      if (draftKey) localStorage.removeItem(draftKey);
      inputRef.current?.focus();
    } catch {
      setSubmitError("메시지를 전송하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshComments = async (postId: string) => {
    const { data } = await postService.getComments(postId);
    setCommentsByPostId((prev) => ({ ...prev, [postId]: data.comments }));
  };

  const handleUpdatePost = async (postId: string, content: string) => {
    const nextContent = window.prompt("수정할 내용을 입력하세요.", content);
    if (!nextContent?.trim() || !debateId) return;
    try {
      await postService.update(postId, { content: nextContent.trim() });
      await fetchMessages(debateId);
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("이 의견을 삭제할까요?") || !debateId) return;
    try {
      await postService.delete(postId);
      await fetchMessages(debateId);
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const handleUpdateComment = async (postId: string, comment: Comment) => {
    const nextContent = window.prompt(
      "수정할 댓글 내용을 입력하세요.",
      comment.content,
    );
    if (!nextContent?.trim()) return;
    try {
      await postService.updateComment(comment.id, {
        content: nextContent.trim(),
      });
      await refreshComments(postId);
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    try {
      await postService.deleteComment(commentId);
      await refreshComments(postId);
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const createSelectionTargetForAction = async (
    selection: PendingSelection,
  ) => {
    if (!debateId) return null;
    const { data } = await debateService.createSelectionTarget(debateId, {
      sourceType: selection.sourceType,
      sourceId: selection.sourceId,
      selectedText: selection.selectedText,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    return data.selectionTarget;
  };

  const handleSelectionAction = async (action: SelectionAction) => {
    if (!pendingSelection) return;
    if (currentDebate?.status !== "OPEN") {
      setSubmitError(
        "종료되었거나 보관된 토론에서는 선택 액션을 사용할 수 없습니다.",
      );
      clearSelectionMenu();
      return;
    }

    if (action === "consensus") {
      setConsensusDraft({
        selection: pendingSelection,
        term: pendingSelection.selectedText,
        title: "",
        content: "",
      });
      setPendingSelection(null);
      window.getSelection()?.removeAllRanges();
      return;
    }

    try {
      await createSelectionTargetForAction(pendingSelection);
      setActionMessage("하위 토론 생성은 다음 단계에서 연결됩니다.");
      clearSelectionMenu();
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const handleCopySelection = async () => {
    if (!pendingSelection) return;
    try {
      await navigator.clipboard.writeText(pendingSelection.selectedText);
      setActionMessage("선택한 내용을 복사했습니다.");
      clearSelectionMenu();
    } catch {
      setSubmitError("선택한 내용을 복사하지 못했습니다.");
    }
  };

  const handleSubmitConsensusDraft = async () => {
    if (!debateId || !consensusDraft || isSubmitting) return;
    if (currentDebate?.status !== "OPEN") {
      setSubmitError(
        "종료되었거나 보관된 토론에서는 합의안을 제안할 수 없습니다.",
      );
      return;
    }
    if (
      !consensusDraft.term.trim() ||
      !consensusDraft.title.trim() ||
      !consensusDraft.content.trim()
    ) {
      setSubmitError("용어, 제목, 내용을 모두 입력해 주세요.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const selectionTarget = await createSelectionTargetForAction(
        consensusDraft.selection,
      );
      if (!selectionTarget) return;

      await debateService.createConsensus(debateId, {
        selectionTargetId: selectionTarget.id,
        term: consensusDraft.term.trim(),
        title: consensusDraft.title.trim(),
        content: consensusDraft.content.trim(),
      });
      await refreshConsensuses(debateId);
      setConsensusDraft(null);
      setActionMessage("합의안을 제안했습니다.");
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConsensusDetail = async (consensus: Consensus) => {
    try {
      const { data } = await consensusService.getById(consensus.id);
      setSelectedConsensus(data.consensus);
      setVoteComment(data.consensus.myVote?.comment ?? "");
    } catch {
      setSelectedConsensus(consensus);
      setVoteComment(consensus.myVote?.comment ?? "");
    }
  };

  const handleVoteConsensus = async (
    consensusId: string,
    voteType: ConsensusVoteType,
    commentOverride?: string,
  ) => {
    if (!debateId || currentDebate?.status !== "OPEN") {
      setSubmitError(
        "종료되었거나 보관된 토론에서는 합의안에 투표할 수 없습니다.",
      );
      return;
    }

    try {
      const { data } = await consensusService.vote(consensusId, {
        voteType,
        comment: (commentOverride ?? voteComment).trim() || undefined,
      });
      if (data.consensus) setSelectedConsensus(data.consensus);
      await refreshConsensuses(debateId);
      setActionMessage("합의안 의견을 반영했습니다.");
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const handleFinalizeConsensus = async (
    consensusId: string,
    action: ConsensusFinalizeAction,
  ) => {
    if (!debateId) return;
    if (!canFinalizeConsensus) {
      setSubmitError("합의안을 확정할 권한이 없습니다.");
      return;
    }
    if (currentDebate?.status !== "OPEN") {
      setSubmitError("종료되었거나 보관된 토론에서는 합의안을 확정할 수 없습니다.");
      return;
    }

    const confirmMessage =
      action === "approve"
        ? "이 합의안을 승인하고 기준 정의로 저장할까요?"
        : action === "reject"
          ? "이 합의안을 반려할까요?"
          : "이 합의안을 종료할까요?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const { data } = await consensusService[action](consensusId);
      setSelectedConsensus(data.consensus);
      await refreshConsensuses(debateId);
      if (action === "approve") {
        await fetchDebate(debateId);
      }
      setSubmitError("");
      setActionMessage(
        action === "approve"
          ? "합의안이 승인되어 기준 정의로 저장되었습니다."
          : action === "reject"
            ? "합의안이 반려되었습니다."
            : "합의안이 종료되었습니다.",
      );
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    }
  };

  const openCardSelectionFallback = (
    sourceType: SelectionSource,
    sourceId: string,
    content: string,
  ) => {
    setActiveCardMenuKey(null);

    if (currentDebate?.status !== "OPEN") {
      setActionMessage(
        "종료되었거나 보관된 토론에서는 선택 액션을 사용할 수 없습니다.",
      );
      return;
    }

    const selectedText = window.prompt(
      "액션에 사용할 텍스트를 입력하세요.",
      content,
    );
    if (!selectedText?.trim()) return;

    const startOffset = content.indexOf(selectedText);
    if (startOffset < 0) {
      setActionMessage("입력한 텍스트를 원문에서 찾을 수 없습니다.");
      return;
    }

    setPendingSelection({
      sourceType,
      sourceId,
      selectedText,
      startOffset,
      endOffset: startOffset + selectedText.length,
      menuX: window.innerWidth / 2,
      menuY: Math.max(88, window.innerHeight - 180),
    });
  };

  const toggleCardMenu = (menuKey: string) => {
    setActiveCardMenuKey((current) => (current === menuKey ? null : menuKey));
  };

  const title = currentDebate?.title;
  const description = currentDebate?.description ?? "설명이 존재하지 않습니다.";

  const renderMessageText = (
    content: string,
    sourceType?: SelectionSource,
    sourceId?: string,
  ) => {
    const mentionMatch = content.match(/^(@[^\s]+)(\s+)([\s\S]*)$/);

    return (
      <MessageText
        data-selection-source-type={sourceType}
        data-selection-source-id={sourceId}
      >
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

  const renderInlineConsensusStack = (
    sourceType: SelectionSource,
    sourceId: string,
  ) => {
    const sourceConsensuses =
      consensusesBySource.get(buildConsensusSourceKey(sourceType, sourceId)) ??
      [];
    if (sourceConsensuses.length === 0) return null;

    return (
      <InlineConsensusStack>
        {sourceConsensuses.map((consensus) => {
          const canVote =
            currentDebate?.status === "OPEN" && consensus.status === "OPEN";

          return (
            <InlineConsensusCard key={consensus.id}>
              <ConsensusMetaRow>
                <ConsensusBadge>
                  {CONSENSUS_STATUS_LABEL[consensus.status] ??
                    consensus.status}
                </ConsensusBadge>
                <ConsensusTerm>{consensus.term}</ConsensusTerm>
              </ConsensusMetaRow>
              {consensus.selectionTarget?.selectedText && (
                <ConsensusQuote>
                  “{consensus.selectionTarget.selectedText}”
                </ConsensusQuote>
              )}
              <ConsensusTitle>{consensus.title}</ConsensusTitle>
              <ConsensusContent>{consensus.content}</ConsensusContent>
              <ConsensusCountRow>
                <span>찬성 {consensus.approveCount ?? 0}</span>
                <span>반대 {consensus.rejectCount ?? 0}</span>
                <span>의견 {consensus.commentCount ?? 0}</span>
              </ConsensusCountRow>
              <ConsensusActionRow>
                {canVote && (
                  <>
                    <ConsensusAction
                      type="button"
                      onClick={() => {
                        setVoteComment("");
                        setSelectedConsensus(consensus);
                        void handleVoteConsensus(consensus.id, "APPROVE", "");
                      }}
                    >
                      찬성
                    </ConsensusAction>
                    <ConsensusAction
                      type="button"
                      onClick={() => {
                        setVoteComment("");
                        setSelectedConsensus(consensus);
                        void handleVoteConsensus(consensus.id, "REJECT", "");
                      }}
                    >
                      반대
                    </ConsensusAction>
                    <ConsensusAction
                      type="button"
                      onClick={() => void openConsensusDetail(consensus)}
                    >
                      의견
                    </ConsensusAction>
                  </>
                )}
                <ConsensusAction
                  type="button"
                  onClick={() => void openConsensusDetail(consensus)}
                >
                  상세
                </ConsensusAction>
              </ConsensusActionRow>
            </InlineConsensusCard>
          );
        })}
      </InlineConsensusStack>
    );
  };

  const renderCommentCard = (comment: Comment, postId: string) => {
    const isDeleted = comment.status === "DELETED";
    const menuKey = `comment:${comment.id}`;
    const canManage = comment.author?.id === user?.id;

    return (
      <Fragment key={comment.id}>
        <MessageCard>
          <MetaRow>
            <NumberText>#1</NumberText>
            <Avatar />
            <AuthorName>{comment.author?.nickname ?? "사용자 이름"}</AuthorName>
            {!isDeleted && (
              <ActionGroup
                data-card-menu-root
                onClick={(event) => event.stopPropagation()}
              >
                <ReplyAction
                  type="button"
                  onClick={() => startCommentReply(postId, comment)}
                >
                  답글
                </ReplyAction>
                <MoreAction
                  type="button"
                  aria-label="댓글 선택 액션"
                  onClick={() => toggleCardMenu(menuKey)}
                >
                  ...
                </MoreAction>
                {activeCardMenuKey === menuKey && (
                  <CardMenu>
                    {canManage && (
                      <>
                        <CardMenuButton
                          type="button"
                          onClick={() => {
                            setActiveCardMenuKey(null);
                            void handleUpdateComment(postId, comment);
                          }}
                        >
                          수정
                        </CardMenuButton>
                        <CardMenuButton
                          type="button"
                          onClick={() => {
                            setActiveCardMenuKey(null);
                            void handleDeleteComment(postId, comment.id);
                          }}
                        >
                          삭제
                        </CardMenuButton>
                      </>
                    )}
                    <CardMenuButton
                      type="button"
                      onClick={() =>
                        openCardSelectionFallback(
                          "COMMENT",
                          comment.id,
                          comment.content,
                        )
                      }
                    >
                      선택
                    </CardMenuButton>
                  </CardMenu>
                )}
              </ActionGroup>
            )}
          </MetaRow>
          {renderMessageText(
            isDeleted ? "삭제된 댓글입니다." : comment.content,
            isDeleted ? undefined : "COMMENT",
            isDeleted ? undefined : comment.id,
          )}
        </MessageCard>
        {!isDeleted && renderInlineConsensusStack("COMMENT", comment.id)}
      </Fragment>
    );
  };

  return (
    <Wrapper>
      <Logo src={logoSymbol} alt="정명" />

      {showLoadingUI ? (
        <ThreadSkeleton />
      ) : (
        !isLoading &&
        currentDebate && (
          <>
            <Header>
        <IconButton
          type="button"
          aria-label="뒤로 가기"
          onClick={() => navigate(-1)}
        >
          <BackIcon />
        </IconButton>
        <HeaderText>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </HeaderText>
        <IconButton
          type="button"
          aria-label="토론 정보"
          onClick={() => navigate(`/debate/${debateId}/info`)}
        >
          <InfoIcon src={iconShowInfo} alt="" />
        </IconButton>
      </Header>

      <PromptCard>
        <PromptText>당신은 앞으로 AI의 전망을 잘 알고 있습니까?</PromptText>
        <PromptArrow aria-hidden />
      </PromptCard>

      <ThreadArea
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {error && <ErrorText>{error}</ErrorText>}
        {!error && threadMessages.length === 0 && (
          <EmptyCard>아직 의견이 없습니다. 첫 의견을 남겨보세요.</EmptyCard>
        )}
        {consensuses.length > 0 && (
          <ConsensusSummaryPanel>
            진행 중 합의안 {openConsensusCount}개 · 승인된 기준 정의{" "}
            {approvedConsensusCount}개
          </ConsensusSummaryPanel>
        )}
        {threadMessages.map((item) => {
          const comments = commentsByPostId[item.id] ?? [];
          const commentGroups = buildCommentGroups(comments);
          const isDeleted = item.status === "DELETED";
          const menuKey = `post:${item.id}`;
          const canManage = item.author.id === user?.id;

          return (
            <MessageGroup key={item.id}>
              <MessageCard>
                <MetaRow>
                  <NumberText>#1</NumberText>
                  <Avatar />
                  <AuthorName>{item.author.nickname}</AuthorName>
                  {!isDeleted && (
                    <ActionGroup
                      data-card-menu-root
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ReplyAction
                        type="button"
                        onClick={() =>
                          startPostReply(item.id, item.author.nickname)
                        }
                      >
                        답글
                      </ReplyAction>
                      <MoreAction
                        type="button"
                        aria-label="의견 선택 액션"
                        onClick={() => toggleCardMenu(menuKey)}
                      >
                        ...
                      </MoreAction>
                      {activeCardMenuKey === menuKey && (
                        <CardMenu>
                          {canManage && (
                            <>
                              <CardMenuButton
                                type="button"
                                onClick={() => {
                                  setActiveCardMenuKey(null);
                                  void handleUpdatePost(item.id, item.content);
                                }}
                              >
                                수정
                              </CardMenuButton>
                              <CardMenuButton
                                type="button"
                                onClick={() => {
                                  setActiveCardMenuKey(null);
                                  void handleDeletePost(item.id);
                                }}
                              >
                                삭제
                              </CardMenuButton>
                            </>
                          )}
                          <CardMenuButton
                            type="button"
                            onClick={() =>
                              openCardSelectionFallback(
                                "POST",
                                item.id,
                                item.content,
                              )
                            }
                          >
                            선택
                          </CardMenuButton>
                        </CardMenu>
                      )}
                    </ActionGroup>
                  )}
                </MetaRow>
                {renderMessageText(
                  isDeleted ? "삭제된 의견입니다." : item.content,
                  isDeleted ? undefined : "POST",
                  isDeleted ? undefined : item.id,
                )}
              </MessageCard>
              {!isDeleted && renderInlineConsensusStack("POST", item.id)}

              {commentGroups.length > 0 && (
                <CommentList>
                  {commentGroups.map((comment) => (
                    <CommentGroupItem key={comment.id}>
                      {renderCommentCard(comment, item.id)}
                      {comment.replies.length > 0 && (
                        <ReplyList>
                          {comment.replies.map((reply) =>
                            renderCommentCard(reply, item.id),
                          )}
                        </ReplyList>
                      )}
                    </CommentGroupItem>
                  ))}
                </CommentList>
              )}
            </MessageGroup>
          );
        })}
      </ThreadArea>

      {pendingSelection && (
        <SelectionMenu
          ref={selectionMenuRef}
          style={{
            left: pendingSelection.menuX,
            top: pendingSelection.menuY,
          }}
        >
          <SelectionMenuButton
            type="button"
            onClick={() => void handleSelectionAction("consensus")}
          >
            합의안
          </SelectionMenuButton>
          <SelectionMenuButton
            type="button"
            onClick={() => void handleSelectionAction("child")}
          >
            하위 토론
          </SelectionMenuButton>
          <SelectionMenuButton type="button" onClick={handleCopySelection}>
            복사
          </SelectionMenuButton>
        </SelectionMenu>
      )}

      {consensusDraft && (
        <SheetBackdrop onClick={() => setConsensusDraft(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>합의안 제안</SheetTitle>
            <SheetQuote>“{consensusDraft.selection.selectedText}”</SheetQuote>
            <SheetField>
              <SheetLabel>용어</SheetLabel>
              <SheetInput
                value={consensusDraft.term}
                onChange={(event) =>
                  setConsensusDraft((prev) =>
                    prev ? { ...prev, term: event.target.value } : prev,
                  )
                }
              />
            </SheetField>
            <SheetField>
              <SheetLabel>제목</SheetLabel>
              <SheetInput
                value={consensusDraft.title}
                onChange={(event) =>
                  setConsensusDraft((prev) =>
                    prev ? { ...prev, title: event.target.value } : prev,
                  )
                }
                placeholder="합의안 제목을 입력하세요."
              />
            </SheetField>
            <SheetField>
              <SheetLabel>내용 / 정의</SheetLabel>
              <SheetTextarea
                value={consensusDraft.content}
                onChange={(event) =>
                  setConsensusDraft((prev) =>
                    prev ? { ...prev, content: event.target.value } : prev,
                  )
                }
                placeholder="합의할 정의나 설명을 입력하세요."
              />
            </SheetField>
            <SheetActionRow>
              <SheetSecondaryButton
                type="button"
                onClick={() => setConsensusDraft(null)}
              >
                취소
              </SheetSecondaryButton>
              <SheetPrimaryButton
                type="button"
                onClick={() => void handleSubmitConsensusDraft()}
                disabled={isSubmitting}
              >
                제안
              </SheetPrimaryButton>
            </SheetActionRow>
          </BottomSheet>
        </SheetBackdrop>
      )}

      {selectedConsensus && (
        <SheetBackdrop onClick={() => setSelectedConsensus(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>{selectedConsensus.title}</SheetTitle>
            <ConsensusBadge>
              {CONSENSUS_STATUS_LABEL[selectedConsensus.status] ??
                selectedConsensus.status}
            </ConsensusBadge>
            {selectedConsensus.selectionTarget?.selectedText && (
              <SheetQuote>
                “{selectedConsensus.selectionTarget.selectedText}”
              </SheetQuote>
            )}
            <DetailTerm>{selectedConsensus.term}</DetailTerm>
            <DetailContent>{selectedConsensus.content}</DetailContent>
            <ConsensusCountRow>
              <span>찬성 {selectedConsensus.approveCount ?? 0}</span>
              <span>반대 {selectedConsensus.rejectCount ?? 0}</span>
              <span>의견 {selectedConsensus.commentCount ?? 0}</span>
            </ConsensusCountRow>
            {currentDebate?.status === "OPEN" &&
              selectedConsensus.status === "OPEN" && (
                <>
                  <SheetTextarea
                    value={voteComment}
                    onChange={(event) => setVoteComment(event.target.value)}
                    placeholder="의견을 남길 수 있습니다."
                  />
                  <ConsensusActionRow>
                    <ConsensusAction
                      type="button"
                      onClick={() =>
                        void handleVoteConsensus(
                          selectedConsensus.id,
                          "APPROVE",
                          "",
                        )
                      }
                    >
                      찬성
                    </ConsensusAction>
                    <ConsensusAction
                      type="button"
                      onClick={() =>
                        void handleVoteConsensus(
                          selectedConsensus.id,
                          "REJECT",
                          "",
                        )
                      }
                    >
                      반대
                    </ConsensusAction>
                    <ConsensusAction
                      type="button"
                      onClick={() =>
                        void handleVoteConsensus(selectedConsensus.id, "COMMENT")
                      }
                    >
                      의견
                    </ConsensusAction>
                  </ConsensusActionRow>
                </>
              )}
            {canFinalizeConsensus && selectedConsensus.status === "OPEN" && (
              <FinalizeSection>
                <FinalizeTitle>확정 관리</FinalizeTitle>
                <ConsensusActionRow>
                  <ConsensusAction
                    type="button"
                    disabled={currentDebate?.status !== "OPEN"}
                    onClick={() =>
                      void handleFinalizeConsensus(
                        selectedConsensus.id,
                        "approve",
                      )
                    }
                  >
                    기준 정의로 승인
                  </ConsensusAction>
                  <ConsensusAction
                    type="button"
                    disabled={currentDebate?.status !== "OPEN"}
                    onClick={() =>
                      void handleFinalizeConsensus(
                        selectedConsensus.id,
                        "reject",
                      )
                    }
                  >
                    반려
                  </ConsensusAction>
                  <ConsensusAction
                    type="button"
                    disabled={currentDebate?.status !== "OPEN"}
                    onClick={() =>
                      void handleFinalizeConsensus(selectedConsensus.id, "close")
                    }
                  >
                    종료
                  </ConsensusAction>
                </ConsensusActionRow>
              </FinalizeSection>
            )}
            {selectedConsensus.votes && selectedConsensus.votes.length > 0 && (
              <VoteList>
                {selectedConsensus.votes.map((vote) => (
                  <VoteItem key={vote.id}>
                    <VoteMeta>
                      {vote.user?.nickname ?? "사용자"} · {vote.voteType}
                    </VoteMeta>
                    {vote.comment && <VoteComment>{vote.comment}</VoteComment>}
                  </VoteItem>
                ))}
              </VoteList>
            )}
            <SheetActionRow>
              <SheetSecondaryButton
                type="button"
                onClick={() => setSelectedConsensus(null)}
              >
                닫기
              </SheetSecondaryButton>
            </SheetActionRow>
          </BottomSheet>
        </SheetBackdrop>
      )}
          </>
        )
      )}

      <ComposerWrap>
        {submitError && <SubmitError>{submitError}</SubmitError>}
        {actionMessage && <ActionNotice>{actionMessage}</ActionNotice>}
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
          <SendButton
            type="submit"
            aria-label="메시지 전송"
            disabled={!message.trim() || isSubmitting}
          >
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

const MessageCard = styled.div`
  width: 100%;
  min-height: clamp(64px, 16.7vw, 72px);
  border: none;
  border-radius: 4px;
  background: #ffffff;
  padding: clamp(10px, 2.8vw, 12px) clamp(12px, 3.3vw, 14px);
  position: relative;
  overflow: visible;
  text-align: left;
  cursor: default;
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

const ActionGroup = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  position: relative;
`;

const InlineAction = styled.button`
  border: none;
  background: transparent;
  color: #2dcd97;
  font-size: 12px;
  font-weight: 700;
  padding: 0;
`;

const MoreAction = styled(InlineAction)`
  min-width: 20px;
  color: #8f8f8f;
`;

const CardMenu = styled.div`
  position: absolute;
  top: 20px;
  right: 0;
  z-index: 30;
  width: 76px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CardMenuButton = styled.button`
  width: 100%;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
  text-align: center;

  &:active {
    background: #eefaf6;
    color: #2dcd97;
  }
`;

const MessageText = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
  user-select: text;
`;

const ReplyAction = styled.button`
  border: none;
  background: transparent;
  color: #2dcd97;
  font-size: 11px;
  font-weight: 700;
  padding: 0;
`;

const ConsensusSummaryPanel = styled.div`
  width: 100%;
  border-radius: 8px;
  background: #eefaf6;
  color: #2d8f73;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 12px;
`;

const InlineConsensusStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: -3px;
  padding-left: clamp(14px, 4vw, 18px);
`;

const ConsensusMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ConsensusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2dcd97;
  font-size: 11px;
  font-weight: 700;
  padding: 0 8px;
`;

const ConsensusTerm = styled.span`
  min-width: 0;
  color: #8f8f8f;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ConsensusQuote = styled.blockquote`
  margin: 0 0 8px;
  border-left: 3px solid #d8f5ec;
  padding-left: 8px;
  color: #a0a0a0;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ConsensusTitle = styled.h3`
  margin: 0 0 4px;
  color: #555555;
  font-size: var(--body-sm);
  font-weight: 700;
  line-height: 1.35;
`;

const ConsensusContent = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ConsensusCountRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  color: #a0a0a0;
  font-size: 11px;
`;

const ConsensusActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
`;

const ConsensusAction = styled.button`
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #6f6f6f;
  font-size: 12px;
  font-weight: 700;
  padding: 0 10px;

  &:disabled {
    opacity: 0.45;
  }
`;

const InlineConsensusCard = styled.section`
  width: min(100%, calc(100% - 4px));
  border-radius: 4px;
  border-left: 2px solid #d8f5ec;
  background: #fbfffd;
  padding: 5px 8px 6px;

  ${ConsensusMetaRow} {
    gap: 6px;
    margin-bottom: 3px;
  }

  ${ConsensusBadge} {
    height: 17px;
    font-size: 10px;
    padding: 0 6px;
  }

  ${ConsensusTerm} {
    font-size: 11px;
  }

  ${ConsensusQuote} {
    margin-bottom: 3px;
    border-left-width: 2px;
    padding-left: 6px;
    font-size: 11px;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  ${ConsensusTitle} {
    margin-bottom: 2px;
    font-size: 12px;
    line-height: 1.2;
  }

  ${ConsensusContent} {
    font-size: 11px;
    line-height: 1.25;
    -webkit-line-clamp: 1;
  }

  ${ConsensusCountRow} {
    gap: 8px;
    margin-top: 4px;
    font-size: 10px;
  }

  ${ConsensusActionRow} {
    gap: 6px;
    margin-top: 5px;
  }

  ${ConsensusAction} {
    height: 22px;
    font-size: 11px;
    padding: 0 8px;
  }
`;

const SheetBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const BottomSheet = styled.div`
  width: 100%;
  max-width: var(--app-max-width);
  max-height: min(82dvh, 720px);
  overflow-y: auto;
  border-radius: 18px 18px 0 0;
  background: #ffffff;
  padding: 18px var(--page-x) max(18px, env(safe-area-inset-bottom));
`;

const SheetTitle = styled.h2`
  margin: 0 0 12px;
  color: #2f3238;
  font-size: var(--title-sm);
  font-weight: 700;
`;

const SheetQuote = styled.blockquote`
  margin: 0 0 12px;
  border-left: 3px solid #2dcd97;
  padding-left: 10px;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const SheetField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
`;

const SheetLabel = styled.span`
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
`;

const SheetInput = styled.input`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  font-size: 14px;
  padding: 0 12px;
  outline: none;
`;

const SheetTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  font-size: 14px;
  line-height: 1.45;
  padding: 10px 12px;
  resize: vertical;
  outline: none;
`;

const SheetActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

const SheetSecondaryButton = styled.button`
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #7f7f7f;
  font-size: 14px;
  font-weight: 700;
  padding: 0 16px;
`;

const SheetPrimaryButton = styled(SheetSecondaryButton)`
  background: #2dcd97;
  color: #ffffff;

  &:disabled {
    opacity: 0.6;
  }
`;

const DetailTerm = styled.p`
  margin: 10px 0 6px;
  color: #555555;
  font-size: var(--body-sm);
  font-weight: 700;
`;

const DetailContent = styled.p`
  margin: 0 0 12px;
  color: #7f7f7f;
  font-size: var(--body-sm);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const VoteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;

const VoteItem = styled.div`
  border-radius: 8px;
  background: #f7f7f7;
  padding: 8px 10px;
`;

const VoteMeta = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: 11px;
  font-weight: 700;
`;

const VoteComment = styled.p`
  margin: 4px 0 0;
  color: #6f6f6f;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const FinalizeSection = styled.section`
  margin-top: 14px;
  border-radius: 8px;
  background: #f7f7f7;
  padding: 10px;
`;

const FinalizeTitle = styled.h3`
  margin: 0;
  color: #555555;
  font-size: 12px;
  font-weight: 700;
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
  padding: clamp(8px, 2.3vw, 10px) var(--page-x)
    max(clamp(8px, 2.3vw, 10px), env(safe-area-inset-bottom));
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

const ActionNotice = styled.p`
  margin: 0 0 8px;
  text-align: center;
  color: #2dcd97;
  font-size: 12px;
`;

const SelectionMenu = styled.div`
  position: fixed;
  z-index: 40;
  transform: translate(-50%, -100%);
  min-width: 176px;
  height: 38px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0 8px;
`;

const SelectionMenuButton = styled.button`
  height: 28px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #2f3238;
  font-size: 12px;
  font-weight: 700;
  padding: 0 9px;

  &:active {
    background: #eefaf6;
    color: #2dcd97;
  }
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
