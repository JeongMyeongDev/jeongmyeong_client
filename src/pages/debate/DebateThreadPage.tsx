import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
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
import { definitionService } from "../../services/definitionService";
import { postService } from "../../services/postService";
import { useAuthStore } from "../../stores/authStore";
import ThreadSkeleton from "../../components/common/ThreadSkeleton";
import TagPicker from "../../components/tags/TagPicker";
import ReportModal from "../../components/moderation/ReportModal";
import { useModerationStore } from "../../stores/moderationStore";
import type {
  Comment,
  Consensus,
  ConsensusVoteType,
  Debate,
  DebateTag,
  DebateProgress,
  DebateStance,
  DebateType,
  Definition,
  DefinitionReference,
  DefinitionReferenceInput,
  DefinitionReferenceType,
  SelectionSource,
  SelectionTarget,
  StanceSummary,
} from "../../types/debate";
import type { ReportTargetType } from "../../types/moderation";

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

type ComposerSelection = {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  menuX: number;
  menuY: number;
};

type PendingDefinitionReference = DefinitionReferenceInput & {
  tempId: string;
  definition: Definition;
  replaceReferenceId?: string;
};

type DefinitionPickerTarget = "COMPOSER" | "EDIT";

type SelectionAction = "consensus" | "child";
type ConsensusFinalizeAction = "approve" | "reject" | "close";

type ConsensusDraft = {
  selection: PendingSelection;
  term: string;
  title: string;
  content: string;
};

type ChildDebateDraft = {
  selection: PendingSelection;
  title: string;
  description: string;
  debateType: DebateType;
  tags: DebateTag[];
};

type ParentDebateInfo = {
  parentDebate: Debate | null;
  selectedText: string | null;
  sourceSelectionTarget?: SelectionTarget | null;
};

type EditTarget =
  | {
      type: "POST";
      postId: string;
      content: string;
    }
  | {
      type: "COMMENT";
      postId: string;
      commentId: string;
      content: string;
    };

type DeleteTarget =
  | {
      type: "POST";
      postId: string;
    }
  | {
      type: "COMMENT";
      postId: string;
      commentId: string;
    };

type ReportTarget = {
  targetType: ReportTargetType;
  targetId: string;
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

const DEBATE_TYPE_OPTIONS: Array<{ value: DebateType; label: string }> = [
  { value: "FREE", label: "자유 토론" },
  { value: "CONSENSUS", label: "합의 토론" },
  { value: "PROS_CONS", label: "찬반 토론" },
];

const STANCE_LABEL: Record<DebateStance, string> = {
  PRO: "찬성",
  CON: "반대",
  NEUTRAL: "중립",
};

const EMPTY_STANCE_SUMMARY: StanceSummary = {
  PRO: 0,
  CON: 0,
  NEUTRAL: 0,
  total: 0,
};

const STANCE_FILTERS: Array<"ALL" | DebateStance> = [
  "ALL",
  "PRO",
  "CON",
  "NEUTRAL",
];

const getMentionPrefix = (name: string) => {
  const normalizedName = name.replace(/\s+/g, "") || "사용자";
  return `@${normalizedName} `;
};

const getReplyGroupKey = (postId: string, commentId: string) => `${postId}:${commentId}`;
const getInlineStackKey = (sourceType: SelectionSource, sourceId: string) =>
  `${sourceType}:${sourceId}`;

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

const getOffsetInsideElement = (
  element: HTMLElement,
  container: Node,
  offset: number,
) => {
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(element);
  beforeRange.setEnd(container, offset);
  const textOffset = beforeRange.toString().length;
  beforeRange.detach();
  return textOffset;
};

const clampMenuCoordinate = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeDefinitionTerm = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const definitionMatchesSelectedText = (
  definition: Definition,
  selectedText?: string,
) => {
  const normalizedSelectedText = normalizeDefinitionTerm(selectedText ?? "");
  if (!normalizedSelectedText) return false;
  if (normalizeDefinitionTerm(definition.term) === normalizedSelectedText) {
    return true;
  }
  return (
    definition.terms?.some(
      (term) =>
        normalizeDefinitionTerm(term.originalTerm) === normalizedSelectedText ||
        normalizeDefinitionTerm(term.normalizedTerm) === normalizedSelectedText,
    ) ?? false
  );
};

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
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  const composerSelectionMenuRef = useRef<HTMLDivElement>(null);
  const editSelectionMenuRef = useRef<HTMLDivElement>(null);
  const selectionDragSourceRef = useRef<HTMLElement | null>(null);
  const { currentDebate, messages, fetchDebate, fetchMessages, createMessage } =
    useDebate();
  const { user } = useAuthStore();
  const { canWrite, canCreateDebate, isSuspended } = useModerationStore();
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
  const [composerSelection, setComposerSelection] =
    useState<ComposerSelection | null>(null);
  const [editSelection, setEditSelection] = useState<ComposerSelection | null>(
    null,
  );
  const [pendingDefinitionReferences, setPendingDefinitionReferences] =
    useState<PendingDefinitionReference[]>([]);
  const [pendingEditDefinitionReferences, setPendingEditDefinitionReferences] =
    useState<PendingDefinitionReference[]>([]);
  const [isDefinitionPickerOpen, setIsDefinitionPickerOpen] = useState(false);
  const [definitionPickerSelection, setDefinitionPickerSelection] =
    useState<ComposerSelection | null>(null);
  const [definitionPickerTarget, setDefinitionPickerTarget] =
    useState<DefinitionPickerTarget>("COMPOSER");
  const [definitionPickerTab, setDefinitionPickerTab] =
    useState<DefinitionReferenceType>("DEBATE_STANDARD");
  const [debateDefinitions, setDebateDefinitions] = useState<Definition[]>([]);
  const [globalDefinitions, setGlobalDefinitions] = useState<Definition[]>([]);
  const [globalDefinitionKeyword, setGlobalDefinitionKeyword] = useState("");
  const [activeDefinitionReference, setActiveDefinitionReference] =
    useState<DefinitionReference | null>(null);
  const [consensuses, setConsensuses] = useState<Consensus[]>([]);
  const [consensusDraft, setConsensusDraft] = useState<ConsensusDraft | null>(
    null,
  );
  const [childDebates, setChildDebates] = useState<Debate[]>([]);
  const [parentDebateInfo, setParentDebateInfo] =
    useState<ParentDebateInfo | null>(null);
  const [childDebateDraft, setChildDebateDraft] =
    useState<ChildDebateDraft | null>(null);
  const [progress, setProgress] = useState<DebateProgress | null>(null);
  const [myStance, setMyStance] = useState<DebateStance | null>(null);
  const [stanceSummary, setStanceSummary] =
    useState<StanceSummary>(EMPTY_STANCE_SUMMARY);
  const [stanceFilter, setStanceFilter] = useState<"ALL" | DebateStance>("ALL");
  const [selectedConsensus, setSelectedConsensus] = useState<Consensus | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editScrollTop, setEditScrollTop] = useState(0);
  const [existingEditDefinitionReferences, setExistingEditDefinitionReferences] =
    useState<DefinitionReference[]>([]);
  const [
    removedEditDefinitionReferenceIds,
    setRemovedEditDefinitionReferenceIds,
  ] = useState<string[]>([]);
  const [replacingEditDefinitionReference, setReplacingEditDefinitionReference] =
    useState<DefinitionReference | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [voteComment, setVoteComment] = useState("");
  const [activeCardMenuKey, setActiveCardMenuKey] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoiningDebate, setIsJoiningDebate] = useState(false);
  const [expandedReplyGroups, setExpandedReplyGroups] = useState<Record<string, boolean>>({});
  const [expandedConsensusStacks, setExpandedConsensusStacks] = useState<Record<string, boolean>>({});
  const [expandedChildDebateStacks, setExpandedChildDebateStacks] = useState<Record<string, boolean>>({});
  const canFinalizeConsensus =
    user?.role === "ADMIN" || currentDebate?.creator?.id === user?.id;
  const isDebateReadOnly =
    currentDebate?.status === "CLOSED" || currentDebate?.status === "ARCHIVED";
  const isConsensusBlocked =
    currentDebate?.debateType === "CONSENSUS" && Boolean(progress?.isBlocked);
  const isSanctionWriteBlocked = !canWrite();
  const isCurrentUserParticipant =
    Boolean(currentDebate?.isParticipant) ||
    Boolean(
      user &&
        currentDebate?.participants?.some(
          (participant) => participant.user.id === user.id,
        ),
    );
  const isJoinRequired =
    currentDebate?.status === "OPEN" && !isCurrentUserParticipant;
  const shouldShowJoinCta =
    isJoinRequired && !isConsensusBlocked && !isSanctionWriteBlocked;
  const isComposerDisabled =
    isDebateReadOnly || isConsensusBlocked || isSanctionWriteBlocked || isJoinRequired;
  const readOnlyMessage =
    isSuspended()
      ? "정지된 계정입니다. 제재 내역을 확인해 주세요."
      : isSanctionWriteBlocked
      ? "제재로 인해 현재 작성할 수 없습니다."
      : currentDebate?.status === "ARCHIVED"
      ? "아카이브된 토론입니다."
      : currentDebate?.status === "CLOSED"
        ? "종료된 토론입니다."
        : "";

  const refreshConsensuses = async (id: string) => {
    const { data } = await debateService.getConsensuses(id);
    setConsensuses(data.consensuses);
  };

  const refreshChildDebates = async (id: string) => {
    const { data } = await debateService.getChildDebates(id);
    setChildDebates(data.childDebates);
  };

  const refreshParentDebate = async (id: string) => {
    const { data } = await debateService.getParent(id);
    setParentDebateInfo({
      parentDebate: data.parentDebate,
      selectedText: data.selectedText,
      sourceSelectionTarget: data.sourceSelectionTarget,
    });
  };

  const refreshProgress = async (id: string) => {
    const { data } = await debateService.getProgress(id);
    setProgress(data.progress);
  };

  const refreshStanceState = async (id: string) => {
    const [summaryResponse, myStanceResponse] = await Promise.all([
      debateService.getStanceSummary(id),
      user ? debateService.getMyStance(id) : Promise.resolve(null),
    ]);
    setStanceSummary(summaryResponse.data.summary);
    setMyStance(myStanceResponse?.data.stance?.stance ?? null);
  };

  useEffect(() => {
    if (!debateId) return;

    const loadThread = async () => {
      await executeAsync(async () => {
        await Promise.all([
          fetchDebate(debateId),
          fetchMessages(debateId),
          refreshConsensuses(debateId),
          refreshChildDebates(debateId),
          refreshParentDebate(debateId),
          refreshProgress(debateId),
          refreshStanceState(debateId),
        ]);
      });
    };

    void loadThread();
  }, [debateId, fetchDebate, fetchMessages, executeAsync, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftKey) return;
    localStorage.setItem(draftKey, message);
  }, [draftKey, message]);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  useEffect(() => {
    if (!isDefinitionPickerOpen || !debateId) return;

    let isCurrent = true;
    void definitionService.getByDebate(debateId).then(({ data }) => {
      if (isCurrent) setDebateDefinitions(data.definitions);
    });

    return () => {
      isCurrent = false;
    };
  }, [debateId, isDefinitionPickerOpen]);

  useEffect(() => {
    if (!isDefinitionPickerOpen) return;

    const keyword =
      globalDefinitionKeyword.trim() || definitionPickerSelection?.selectedText || "";
    const timer = window.setTimeout(() => {
      void definitionService.search(keyword).then(({ data }) => {
        setGlobalDefinitions(data.definitions);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [definitionPickerSelection?.selectedText, globalDefinitionKeyword, isDefinitionPickerOpen]);

  const threadMessages = useMemo(
    () =>
      messages
        .filter((item) => item.status !== "HIDDEN")
        .filter((item) => stanceFilter === "ALL" || item.stance === stanceFilter)
        .slice()
        .reverse(),
    [messages, stanceFilter],
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

  const childDebatesBySource = useMemo(() => {
    const map = new Map<string, Debate[]>();

    childDebates.forEach((childDebate) => {
      const target = childDebate.sourceSelectionTarget;
      if (!target?.sourceType || !target.sourceId) return;

      const key = buildConsensusSourceKey(target.sourceType, target.sourceId);
      const sourceChildDebates = map.get(key) ?? [];
      sourceChildDebates.push(childDebate);
      map.set(key, sourceChildDebates);
    });

    return map;
  }, [childDebates]);

  const openConsensusCount = consensuses.filter(
    (consensus) => consensus.status === "OPEN",
  ).length;
  const approvedConsensusCount = consensuses.filter(
    (consensus) => consensus.status === "APPROVED",
  ).length;
  const isConsensusDebate = currentDebate?.debateType === "CONSENSUS";
  const isProsConsDebate = currentDebate?.debateType === "PROS_CONS";
  const parentDebate = parentDebateInfo?.parentDebate ?? null;
  const parentDebateSelectedText =
    parentDebateInfo?.selectedText ??
    parentDebateInfo?.sourceSelectionTarget?.selectedText ??
    null;
  const matchingDebateDefinitions = useMemo(
    () =>
      debateDefinitions.filter((definition) =>
        definitionMatchesSelectedText(
          definition,
          definitionPickerSelection?.selectedText,
        ),
      ),
    [debateDefinitions, definitionPickerSelection?.selectedText],
  );
  const visibleExistingEditDefinitionReferences = useMemo(
    () =>
      existingEditDefinitionReferences.filter(
        (reference) => !removedEditDefinitionReferenceIds.includes(reference.id),
      ),
    [existingEditDefinitionReferences, removedEditDefinitionReferenceIds],
  );

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
      void refreshChildDebates(debateId);
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

  const clearComposerSelectionMenu = () => {
    setComposerSelection(null);
    const input = inputRef.current;
    if (input) input.setSelectionRange(input.selectionEnd ?? 0, input.selectionEnd ?? 0);
  };

  const handleComposerMessageChange = (nextMessage: string) => {
    setMessage(nextMessage);
    setPendingDefinitionReferences((prev) =>
      prev.filter(
        (reference) =>
          nextMessage.slice(reference.startOffset, reference.endOffset) ===
          reference.selectedText,
      ),
    );
  };

  const handleEditContentChange = (nextContent: string) => {
    setEditContent(nextContent);
    setPendingEditDefinitionReferences((prev) =>
      prev.filter(
        (reference) =>
          nextContent.slice(reference.startOffset, reference.endOffset) ===
          reference.selectedText,
      ),
    );
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setPendingSelection(null), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      selectionDragSourceRef.current = getSelectionSourceElement(
        event.target as Node,
      );

      if (
        pendingSelection &&
        !selectionMenuRef.current?.contains(event.target as Node)
      ) {
        setPendingSelection(null);
      }
      if (
        composerSelection &&
        !composerSelectionMenuRef.current?.contains(event.target as Node) &&
        event.target !== inputRef.current
      ) {
        setComposerSelection(null);
      }
      if (
        editSelection &&
        !editSelectionMenuRef.current?.contains(event.target as Node) &&
        event.target !== editInputRef.current
      ) {
        setEditSelection(null);
      }
    };

    const handlePointerUp = () => {
      handleTextSelection();
      handleComposerSelection();
      handleEditSelection();
      window.setTimeout(() => {
        selectionDragSourceRef.current = null;
      }, 0);
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
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("touchend", handlePointerUp);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerdown", handleCardMenuPointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("touchend", handlePointerUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [activeCardMenuKey, composerSelection, editSelection, pendingSelection]);

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
      const source =
        selectionDragSourceRef.current ?? anchorSource ?? focusSource;
      if (!source) return;

      if (anchorSource !== focusSource && !selectionDragSourceRef.current) {
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
        !selectionDragSourceRef.current &&
        (!source.contains(range.startContainer) ||
          !source.contains(range.endContainer))
      ) {
        setPendingSelection(null);
        setActionMessage("하나의 의견 또는 댓글 안에서만 선택할 수 있습니다.");
        selection.removeAllRanges();
        return;
      }

      const sourceText = source.textContent ?? "";
      const startOffset = source.contains(range.startContainer)
        ? getOffsetInsideElement(source, range.startContainer, range.startOffset)
        : 0;
      const endOffset = source.contains(range.endContainer)
        ? getOffsetInsideElement(source, range.endContainer, range.endOffset)
        : sourceText.length;
      const normalizedStartOffset = Math.min(startOffset, endOffset);
      const normalizedEndOffset = Math.max(startOffset, endOffset);
      const sourceSelectedText = sourceText.slice(
        normalizedStartOffset,
        normalizedEndOffset,
      );
      if (!sourceSelectedText.trim()) {
        setPendingSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
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
        sourceType: source.dataset.selectionSourceType as SelectionSource,
        sourceId: source.dataset.selectionSourceId ?? "",
        selectedText: sourceSelectedText,
        startOffset: normalizedStartOffset,
        endOffset: normalizedEndOffset,
        menuX,
        menuY,
      });
    }, 0);
  };

  const handleComposerSelection = () => {
    window.setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      if (document.activeElement !== input) return;

      const startOffset = input.selectionStart ?? 0;
      const endOffset = input.selectionEnd ?? 0;
      const selectedText = input.value.slice(startOffset, endOffset);
      if (startOffset === endOffset || !selectedText.trim()) {
        setComposerSelection(null);
        return;
      }

      if (currentDebate?.status === "CLOSED") {
        setActionMessage("종료된 토론에서는 정의를 연결할 수 없습니다.");
        setComposerSelection(null);
        return;
      }
      if (currentDebate?.status === "ARCHIVED") {
        setActionMessage("아카이브된 토론은 읽기 전용입니다.");
        setComposerSelection(null);
        return;
      }
      if (currentDebate?.status !== "OPEN") {
        setComposerSelection(null);
        return;
      }

      const rect = input.getBoundingClientRect();
      setComposerSelection({
        selectedText,
        startOffset,
        endOffset,
        menuX: clampMenuCoordinate(rect.left + rect.width / 2, 88, window.innerWidth - 88),
        menuY: clampMenuCoordinate(rect.top - 10, 72, window.innerHeight - 88),
      });
    }, 0);
  };

  const handleEditSelection = () => {
    window.setTimeout(() => {
      const input = editInputRef.current;
      if (!input || !editTarget) return;
      if (document.activeElement !== input) return;

      const startOffset = input.selectionStart ?? 0;
      const endOffset = input.selectionEnd ?? 0;
      const selectedText = input.value.slice(startOffset, endOffset);
      if (startOffset === endOffset || !selectedText.trim()) {
        setEditSelection(null);
        return;
      }

      if (currentDebate?.status === "CLOSED") {
        setActionMessage("종료된 토론에서는 정의를 연결할 수 없습니다.");
        setEditSelection(null);
        return;
      }
      if (currentDebate?.status === "ARCHIVED") {
        setActionMessage("아카이브된 토론은 읽기 전용입니다.");
        setEditSelection(null);
        return;
      }
      if (currentDebate?.status !== "OPEN") {
        setEditSelection(null);
        return;
      }

      const rect = input.getBoundingClientRect();
      setEditSelection({
        selectedText,
        startOffset,
        endOffset,
        menuX: clampMenuCoordinate(
          rect.left + rect.width / 2,
          88,
          window.innerWidth - 88,
        ),
        menuY: clampMenuCoordinate(rect.top - 10, 72, window.innerHeight - 88),
      });
    }, 0);
  };

  const removeExistingEditDefinitionReference = (referenceId: string) => {
    setRemovedEditDefinitionReferenceIds((prev) =>
      prev.includes(referenceId) ? prev : [...prev, referenceId],
    );
    setPendingEditDefinitionReferences((prev) =>
      prev.filter((reference) => reference.replaceReferenceId !== referenceId),
    );
  };

  const changeExistingEditDefinitionReference = (
    reference: DefinitionReference,
  ) => {
    setReplacingEditDefinitionReference(reference);
    setDefinitionPickerTarget("EDIT");
    setDefinitionPickerSelection({
      selectedText: reference.selectedText,
      startOffset: reference.startOffset,
      endOffset: reference.endOffset,
      menuX: window.innerWidth / 2,
      menuY: Math.max(88, window.innerHeight - 180),
    });
    setDefinitionPickerTab(reference.referenceType);
    setGlobalDefinitionKeyword(reference.selectedText);
    setIsDefinitionPickerOpen(true);
    setEditSelection(null);
  };

  const cancelPendingEditDefinitionReference = (
    reference: PendingDefinitionReference,
  ) => {
    setPendingEditDefinitionReferences((prev) =>
      prev.filter((item) => item.tempId !== reference.tempId),
    );
    if (reference.replaceReferenceId) {
      setRemovedEditDefinitionReferenceIds((prev) =>
        prev.filter((id) => id !== reference.replaceReferenceId),
      );
    }
  };

  const openDefinitionPicker = () => {
    const selection = composerSelection ?? editSelection;
    if (!selection) return;
    setDefinitionPickerTab("DEBATE_STANDARD");
    setDefinitionPickerTarget(editSelection ? "EDIT" : "COMPOSER");
    setGlobalDefinitionKeyword(selection.selectedText);
    setDefinitionPickerSelection(selection);
    setIsDefinitionPickerOpen(true);
    setComposerSelection(null);
    setEditSelection(null);
  };

  const connectDefinition = (
    definition: Definition,
    referenceType: DefinitionReferenceType,
  ) => {
    const selection = definitionPickerSelection;
    if (!selection) return;

    const nextReference: PendingDefinitionReference = {
      tempId: `${definition.id}:${selection.startOffset}:${selection.endOffset}:${Date.now()}`,
      definitionId: definition.id,
      selectedText: selection.selectedText,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      referenceType,
      definition,
      replaceReferenceId:
        definitionPickerTarget === "EDIT"
          ? replacingEditDefinitionReference?.id
          : undefined,
    };

    const setReferences =
      definitionPickerTarget === "EDIT"
        ? setPendingEditDefinitionReferences
        : setPendingDefinitionReferences;

    setReferences((prev) => [
      ...prev.filter(
        (reference) =>
          reference.startOffset !== nextReference.startOffset ||
          reference.endOffset !== nextReference.endOffset,
      ),
      nextReference,
    ]);
    if (nextReference.replaceReferenceId) {
      setRemovedEditDefinitionReferenceIds((prev) =>
        prev.includes(nextReference.replaceReferenceId!)
          ? prev
          : [...prev, nextReference.replaceReferenceId!],
      );
      setReplacingEditDefinitionReference(null);
    }
    setIsDefinitionPickerOpen(false);
    setDefinitionPickerSelection(null);
    setActionMessage(
      referenceType === "GLOBAL_REFERENCE"
        ? "전체 정의를 참고 정의로 연결했습니다."
        : "정의가 연결되었습니다.",
    );
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

  const toggleReplyGroup = (postId: string, commentId: string) => {
    const groupKey = getReplyGroupKey(postId, commentId);
    setExpandedReplyGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const toggleConsensusStack = (sourceType: SelectionSource, sourceId: string) => {
    const stackKey = getInlineStackKey(sourceType, sourceId);
    setExpandedConsensusStacks((prev) => ({ ...prev, [stackKey]: !prev[stackKey] }));
  };

  const toggleChildDebateStack = (sourceType: SelectionSource, sourceId: string) => {
    const stackKey = getInlineStackKey(sourceType, sourceId);
    setExpandedChildDebateStacks((prev) => ({ ...prev, [stackKey]: !prev[stackKey] }));
  };

  const handleStanceChange = async (nextStance: DebateStance) => {
    if (!debateId || isDebateReadOnly || isSubmitting) return;
    if (myStance && myStance !== nextStance) {
      const confirmed = window.confirm(
        "입장을 변경하시겠습니까? 이후 작성하는 의견에는 새 입장이 표시됩니다. 기존 글의 입장은 변경되지 않습니다.",
      );
      if (!confirmed) return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const { data } = await debateService.updateStance(debateId, nextStance);
      setMyStance(data.stance?.stance ?? nextStance);
      if (data.summary) setStanceSummary(data.summary);
      setActionMessage(`${STANCE_LABEL[nextStance]} 입장으로 설정했습니다.`);
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinDebate = async () => {
    if (!debateId || isJoiningDebate) return;

    setSubmitError("");
    setIsJoiningDebate(true);
    try {
      await debateService.join(debateId);
      await fetchDebate(debateId);
      setActionMessage("토론에 참여했습니다.");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsJoiningDebate(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!debateId || !trimmedMessage || isSubmitting) return;
    if (isComposerDisabled) {
      setSubmitError(
        isSuspended()
          ? "정지된 계정입니다. 제재 내역을 확인해 주세요."
          : isSanctionWriteBlocked
          ? "제재로 인해 현재 작성할 수 없습니다."
          : isConsensusBlocked
          ? "진행 중인 합의 또는 하위 토론이 있어 새 의견을 작성할 수 없습니다."
          : currentDebate?.status === "ARCHIVED"
          ? "아카이브된 토론은 읽기 전용입니다."
          : "종료된 토론에서는 새 내용을 작성할 수 없습니다.",
      );
      return;
    }
    if (isProsConsDebate && !myStance) {
      setSubmitError("찬반 토론에서는 입장을 선택해야 의견을 작성할 수 있습니다.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const definitionReferences = pendingDefinitionReferences.map(
        ({ tempId: _tempId, definition: _definition, ...reference }) => reference,
      );

      if (replyTarget) {
        const content =
          replyTarget.mention &&
          !message.startsWith(replyTarget.mention)
            ? `${replyTarget.mention}${message}`
            : message;

        const referencesForSubmit =
          content === message
            ? definitionReferences
            : definitionReferences.map((reference) => ({
                ...reference,
                startOffset: reference.startOffset + replyTarget.mention!.length,
                endOffset: reference.endOffset + replyTarget.mention!.length,
              }));

        await postService.createComment(replyTarget.postId, {
          content,
          parentCommentId: replyTarget.parentCommentId ?? undefined,
          definitionReferences: referencesForSubmit,
        });
        const { data } = await postService.getComments(replyTarget.postId);
        setCommentsByPostId((prev) => ({
          ...prev,
          [replyTarget.postId]: data.comments,
        }));
        if (replyTarget.parentCommentId) {
          setExpandedReplyGroups((prev) => ({
            ...prev,
            [getReplyGroupKey(replyTarget.postId, replyTarget.parentCommentId as string)]: true,
          }));
        }
        setReplyTarget(null);
      } else {
        await createMessage(debateId, message, {
          definitionReferences,
          stance: myStance ?? undefined,
        });
      }
      setMessage("");
      setPendingDefinitionReferences([]);
      if (draftKey) localStorage.removeItem(draftKey);
      inputRef.current?.focus();
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshComments = async (postId: string) => {
    const { data } = await postService.getComments(postId);
    setCommentsByPostId((prev) => ({ ...prev, [postId]: data.comments }));
  };

  const openPostEditor = (
    postId: string,
    content: string,
    definitionReferences: DefinitionReference[] = [],
  ) => {
    setSubmitError("");
    setActionMessage("");
    setEditContent(content);
    setEditScrollTop(0);
    setExistingEditDefinitionReferences(definitionReferences);
    setRemovedEditDefinitionReferenceIds([]);
    setReplacingEditDefinitionReference(null);
    setPendingEditDefinitionReferences([]);
    setEditTarget({ type: "POST", postId, content });
  };

  const openCommentEditor = (postId: string, comment: Comment) => {
    setSubmitError("");
    setActionMessage("");
    setEditContent(comment.content);
    setEditScrollTop(0);
    setExistingEditDefinitionReferences(comment.definitionReferences ?? []);
    setRemovedEditDefinitionReferenceIds([]);
    setReplacingEditDefinitionReference(null);
    setPendingEditDefinitionReferences([]);
    setEditTarget({
      type: "COMMENT",
      postId,
      commentId: comment.id,
      content: comment.content,
    });
  };

  const cancelInlineEdit = () => {
    setEditTarget(null);
    setEditContent("");
    setEditScrollTop(0);
    setEditSelection(null);
    setExistingEditDefinitionReferences([]);
    setRemovedEditDefinitionReferenceIds([]);
    setReplacingEditDefinitionReference(null);
    setPendingEditDefinitionReferences([]);
    setSubmitError("");
  };

  const handleSubmitEdit = async () => {
    if (!editTarget || isSubmitting) return;
    const contentToSave = editContent;
    if (!contentToSave.trim()) {
      setSubmitError("수정할 내용을 입력해 주세요.");
      return;
    }
    if (editTarget.type === "POST" && !debateId) return;

    setIsSubmitting(true);
    try {
      const definitionReferences = pendingEditDefinitionReferences.map(
        ({
          tempId: _tempId,
          definition: _definition,
          replaceReferenceId: _replaceReferenceId,
          ...reference
        }) => reference,
      );
      const removedReferenceIds = Array.from(
        new Set(removedEditDefinitionReferenceIds),
      );

      await Promise.all(
        removedReferenceIds.map((referenceId) =>
          postService.deleteDefinitionReference(referenceId),
        ),
      );

      if (editTarget.type === "POST") {
        const activeDebateId = debateId;
        if (!activeDebateId) return;
        await postService.update(editTarget.postId, { content: contentToSave });
        await Promise.all(
          definitionReferences.map((reference) =>
            postService.createDefinitionReference(editTarget.postId, reference),
          ),
        );
        await fetchMessages(activeDebateId);
      } else {
        await postService.updateComment(editTarget.commentId, {
          content: contentToSave,
        });
        await Promise.all(
          definitionReferences.map((reference) =>
            postService.createCommentDefinitionReference(
              editTarget.commentId,
              reference,
            ),
          ),
        );
        await refreshComments(editTarget.postId);
      }
      setEditTarget(null);
      setEditContent("");
      setEditScrollTop(0);
      setEditSelection(null);
      setExistingEditDefinitionReferences([]);
      setRemovedEditDefinitionReferenceIds([]);
      setReplacingEditDefinitionReference(null);
      setPendingEditDefinitionReferences([]);
      setSubmitError("");
      setActionMessage(
        editTarget.type === "POST"
          ? "의견을 수정했습니다."
          : "댓글을 수정했습니다.",
      );
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPostDeleteConfirm = (postId: string) => {
    setSubmitError("");
    setDeleteTarget({ type: "POST", postId });
  };

  const openCommentDeleteConfirm = (postId: string, commentId: string) => {
    setSubmitError("");
    setDeleteTarget({ type: "COMMENT", postId, commentId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isSubmitting) return;
    if (deleteTarget.type === "POST" && !debateId) return;

    setIsSubmitting(true);
    try {
      if (deleteTarget.type === "POST") {
        const activeDebateId = debateId;
        if (!activeDebateId) return;
        await postService.delete(deleteTarget.postId);
        await fetchMessages(activeDebateId);
      } else {
        await postService.deleteComment(deleteTarget.commentId);
        await refreshComments(deleteTarget.postId);
      }
      setDeleteTarget(null);
      setSubmitError("");
      setActionMessage(
        deleteTarget.type === "POST"
          ? "의견을 삭제했습니다."
          : "댓글을 삭제했습니다.",
      );
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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
    if (isConsensusBlocked) {
      setSubmitError("진행 중인 합의 또는 하위 토론이 있어 새 선택 액션을 사용할 수 없습니다.");
      clearSelectionMenu();
      return;
    }

    if (action === "consensus") {
      if (!canWrite()) {
        setSubmitError("제재로 인해 현재 작성할 수 없습니다.");
        clearSelectionMenu();
        return;
      }
      setSubmitError("");
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

    if (!canCreateDebate()) {
      setSubmitError("제재로 인해 현재 토론을 생성할 수 없습니다.");
      clearSelectionMenu();
      return;
    }
    setSubmitError("");
    setChildDebateDraft({
      selection: pendingSelection,
      title: "",
      description: "",
      debateType: "FREE",
      tags: [],
    });
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
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
    if (!canWrite()) {
      setSubmitError("제재로 인해 현재 작성할 수 없습니다.");
      return;
    }
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
      setExpandedConsensusStacks((prev) => ({
        ...prev,
        [getInlineStackKey(
          consensusDraft.selection.sourceType,
          consensusDraft.selection.sourceId,
        )]: true,
      }));
      await refreshConsensuses(debateId);
      setConsensusDraft(null);
      setSubmitError("");
      setActionMessage("합의안을 제안했습니다.");
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitChildDebateDraft = async () => {
    if (!debateId || !childDebateDraft || isSubmitting) return;
    if (!canCreateDebate()) {
      setSubmitError("제재로 인해 현재 토론을 생성할 수 없습니다.");
      return;
    }
    if (currentDebate?.status !== "OPEN") {
      setSubmitError("종료되었거나 보관된 토론에서는 하위 토론을 만들 수 없습니다.");
      return;
    }
    if (!childDebateDraft.title.trim() || !childDebateDraft.description.trim()) {
      setSubmitError("제목과 설명을 모두 입력해 주세요.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const selectionTarget = await createSelectionTargetForAction(
        childDebateDraft.selection,
      );
      if (!selectionTarget) return;

      await debateService.createChildDebate(selectionTarget.id, {
        title: childDebateDraft.title.trim(),
        description: childDebateDraft.description.trim(),
        debateType: childDebateDraft.debateType,
        tagIds: childDebateDraft.tags.map((tag) => tag.id),
      });
      setExpandedChildDebateStacks((prev) => ({
        ...prev,
        [getInlineStackKey(
          childDebateDraft.selection.sourceType,
          childDebateDraft.selection.sourceId,
        )]: true,
      }));
      await refreshChildDebates(debateId);
      setChildDebateDraft(null);
      setActionMessage("하위 토론을 만들었습니다.");
    } catch (error) {
      setSubmitError(getMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConsensusDetail = async (consensus: Consensus) => {
    setSubmitError("");
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
    if (!canWrite()) {
      setSubmitError("제재로 인해 현재 작성할 수 없습니다.");
      return;
    }
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
      setSubmitError("");
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

  const getDefinitionReferenceLabel = (referenceType: DefinitionReferenceType) =>
    referenceType === "DEBATE_STANDARD" ? "기준 정의" : "참고 정의";

  const renderReferencedContent = (
    content: string,
    references: DefinitionReference[] = [],
  ) => {
    const validReferences = references
      .filter(
        (reference) =>
          content.slice(reference.startOffset, reference.endOffset) ===
          reference.selectedText,
      )
      .sort((a, b) => a.startOffset - b.startOffset);

    if (validReferences.length === 0) return content;

    const nodes: ReactNode[] = [];
    let cursor = 0;

    validReferences.forEach((reference) => {
      if (reference.startOffset < cursor) return;
      if (cursor < reference.startOffset) {
        nodes.push(content.slice(cursor, reference.startOffset));
      }
      nodes.push(
        <DefinitionReferenceMark
          key={reference.id}
          type="button"
          data-reference-type={reference.referenceType}
          onClick={(event) => {
            event.stopPropagation();
            setActiveDefinitionReference(reference);
          }}
        >
          {reference.selectedText}
        </DefinitionReferenceMark>,
      );
      cursor = reference.endOffset;
    });

    if (cursor < content.length) nodes.push(content.slice(cursor));
    return nodes;
  };

  const renderEditHighlightedContent = () => {
    const references = [
      ...visibleExistingEditDefinitionReferences,
      ...pendingEditDefinitionReferences.map((reference) => ({
        id: reference.tempId,
        selectedText: reference.selectedText,
        startOffset: reference.startOffset,
        endOffset: reference.endOffset,
        referenceType: reference.referenceType,
      })),
    ]
      .filter(
        (reference) =>
          editContent.slice(reference.startOffset, reference.endOffset) ===
          reference.selectedText,
      )
      .sort((a, b) => a.startOffset - b.startOffset);

    const nodes: ReactNode[] = [];
    let cursor = 0;

    references.forEach((reference) => {
      if (reference.startOffset < cursor) return;
      if (cursor < reference.startOffset) {
        nodes.push(editContent.slice(cursor, reference.startOffset));
      }
      nodes.push(
        <InlineEditHighlightMark
          key={reference.id}
          data-reference-type={reference.referenceType}
        >
          {reference.selectedText}
        </InlineEditHighlightMark>,
      );
      cursor = reference.endOffset;
    });

    if (cursor < editContent.length) nodes.push(editContent.slice(cursor));
    return nodes.length > 0 ? nodes : editContent;
  };

  const renderMessageText = (
    content: string,
    sourceType?: SelectionSource,
    sourceId?: string,
    definitionReferences?: DefinitionReference[],
  ) => {
    const mentionMatch = content.match(/^(@[^\s]+)(\s+)([\s\S]*)$/);

    return (
      <MessageText
        data-selection-source-type={sourceType}
        data-selection-source-id={sourceId}
      >
        {definitionReferences?.length ? (
          renderReferencedContent(content, definitionReferences)
        ) : mentionMatch ? (
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

    const stackKey = getInlineStackKey(sourceType, sourceId);
    const isExpanded = Boolean(expandedConsensusStacks[stackKey]);

    return (
      <InlineConsensusStack>
        <InlineStackToggleButton
          type="button"
          aria-expanded={isExpanded}
          onClick={() => toggleConsensusStack(sourceType, sourceId)}
        >
          {isExpanded
            ? "합의안 숨기기"
            : `합의안 ${sourceConsensuses.length}개 보기`}
        </InlineStackToggleButton>
        {isExpanded &&
          sourceConsensuses.map((consensus) => {
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

  const renderInlineChildDebateStack = (
    sourceType: SelectionSource,
    sourceId: string,
  ) => {
    const sourceChildDebates =
      childDebatesBySource.get(buildConsensusSourceKey(sourceType, sourceId)) ??
      [];
    if (sourceChildDebates.length === 0) return null;

    const stackKey = getInlineStackKey(sourceType, sourceId);
    const isExpanded = Boolean(expandedChildDebateStacks[stackKey]);

    return (
      <InlineChildDebateStack>
        <InlineStackToggleButton
          type="button"
          aria-expanded={isExpanded}
          onClick={() => toggleChildDebateStack(sourceType, sourceId)}
        >
          {isExpanded
            ? "하위 토론 숨기기"
            : `하위 토론 ${sourceChildDebates.length}개 보기`}
        </InlineStackToggleButton>
        {isExpanded && (
          <>
            <InlineChildDebateTitle>연결된 하위 토론</InlineChildDebateTitle>
            {sourceChildDebates.map((childDebate) => (
              <InlineChildDebateCard key={childDebate.id}>
                <ChildDebateTitleText>{childDebate.title}</ChildDebateTitleText>
                {childDebate.sourceSelectionTarget?.selectedText && (
                  <ChildDebateQuote>
                    {childDebate.sourceSelectionTarget.selectedText}
                  </ChildDebateQuote>
                )}
                <ChildDebateAction
                  type="button"
                  onClick={() => navigate(`/debate/${childDebate.id}`)}
                >
                  이동
                </ChildDebateAction>
              </InlineChildDebateCard>
            ))}
          </>
        )}
      </InlineChildDebateStack>
    );
  };

  const renderCommentCard = (
    comment: Comment,
    postId: string,
    displayNumber: string,
  ) => {
    const isDeleted = comment.status === "DELETED";
    const menuKey = `comment:${comment.id}`;
    const canManage = comment.author?.id === user?.id;
    const isEditing =
      editTarget?.type === "COMMENT" && editTarget.commentId === comment.id;

    return (
      <Fragment key={comment.id}>
        <MessageCard>
          <MetaRow>
            <NumberText>#{displayNumber}</NumberText>
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
                          openCommentEditor(postId, comment);
                        }}
                      >
                        수정
                        </CardMenuButton>
                        <CardMenuButton
                        type="button"
                        onClick={() => {
                          setActiveCardMenuKey(null);
                          openCommentDeleteConfirm(postId, comment.id);
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
                    <CardMenuButton
                      type="button"
                      onClick={() => {
                        setActiveCardMenuKey(null);
                        setReportTarget({ targetType: "COMMENT", targetId: comment.id });
                      }}
                    >
                      신고
                    </CardMenuButton>
                    <CardMenuButton
                      type="button"
                      onClick={() => {
                        setActiveCardMenuKey(null);
                        const authorId = comment.authorId ?? comment.author?.id;
                        if (authorId) {
                          setReportTarget({ targetType: "USER", targetId: authorId });
                        }
                      }}
                    >
                      작성자 신고
                    </CardMenuButton>
                  </CardMenu>
                )}
              </ActionGroup>
            )}
          </MetaRow>
          {isEditing ? (
            <InlineEditBox>
              {submitError && <InlineEditError>{submitError}</InlineEditError>}
              <InlineEditTextareaWrap>
                <InlineEditHighlightLayer aria-hidden>
                  <InlineEditHighlightText
                    style={{ transform: `translateY(-${editScrollTop}px)` }}
                  >
                    {renderEditHighlightedContent()}
                  </InlineEditHighlightText>
                </InlineEditHighlightLayer>
                <InlineEditTextarea
                  ref={editInputRef}
                  value={editContent}
                  onChange={(event) => handleEditContentChange(event.target.value)}
                  onScroll={(event) =>
                    setEditScrollTop(event.currentTarget.scrollTop)
                  }
                  onMouseUp={handleEditSelection}
                  onKeyUp={handleEditSelection}
                  onTouchEnd={handleEditSelection}
                  autoFocus
                />
              </InlineEditTextareaWrap>
              {(visibleExistingEditDefinitionReferences.length > 0 ||
                pendingEditDefinitionReferences.length > 0) && (
                <EditReferencePreview>
                  {visibleExistingEditDefinitionReferences.map((reference) => (
                    <EditReferenceChip key={reference.id}>
                      <span>{reference.selectedText}</span>
                      <small>
                        {getDefinitionReferenceLabel(reference.referenceType)} ·{" "}
                        {reference.definition.term}
                      </small>
                      <ReferenceButtonGroup>
                        <ReferenceRemoveButton
                          type="button"
                          onClick={() =>
                            changeExistingEditDefinitionReference(reference)
                          }
                        >
                          변경
                        </ReferenceRemoveButton>
                        <ReferenceRemoveButton
                          type="button"
                          onClick={() =>
                            removeExistingEditDefinitionReference(reference.id)
                          }
                        >
                          삭제
                        </ReferenceRemoveButton>
                      </ReferenceButtonGroup>
                    </EditReferenceChip>
                  ))}
                  {pendingEditDefinitionReferences.map((reference) => (
                    <EditReferenceChip key={reference.tempId}>
                      <span>{reference.selectedText}</span>
                      <small>
                        {getDefinitionReferenceLabel(reference.referenceType)} ·{" "}
                        {reference.definition.term}
                      </small>
                      <ReferenceRemoveButton
                        type="button"
                        aria-label="정의 연결 취소"
                        onClick={() =>
                          cancelPendingEditDefinitionReference(reference)
                        }
                      >
                        취소
                      </ReferenceRemoveButton>
                    </EditReferenceChip>
                  ))}
                </EditReferencePreview>
              )}
              <InlineEditActions>
                <InlineEditCancelButton type="button" onClick={cancelInlineEdit}>
                  취소
                </InlineEditCancelButton>
                <InlineEditSaveButton
                  type="button"
                  onClick={() => void handleSubmitEdit()}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  저장
                </InlineEditSaveButton>
              </InlineEditActions>
            </InlineEditBox>
          ) : (
            renderMessageText(
              isDeleted ? "삭제된 댓글입니다." : comment.content,
              isDeleted ? undefined : "COMMENT",
              isDeleted ? undefined : comment.id,
              isDeleted ? undefined : comment.definitionReferences,
            )
          )}
        </MessageCard>
        {!isDeleted && renderInlineConsensusStack("COMMENT", comment.id)}
        {!isDeleted && renderInlineChildDebateStack("COMMENT", comment.id)}
      </Fragment>
    );
  };

  return (
    <Wrapper>
      <Logo
        src={logoSymbol}
        alt="정명 홈"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') navigate('/');
        }}
      />

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
      <DebateReportButton
        type="button"
        onClick={() =>
          debateId && setReportTarget({ targetType: "DEBATE", targetId: debateId })
        }
      >
        토론 신고
      </DebateReportButton>
      {parentDebate && (
        <ChildDebateNotice>
          <ChildDebateNoticeBadge>하위 토론</ChildDebateNoticeBadge>
          <ChildDebateNoticeBody>
            <ChildDebateNoticeTitle>
              상위 토론에서 갈라진 토론입니다
            </ChildDebateNoticeTitle>
            <ChildDebateNoticeParent>{parentDebate.title}</ChildDebateNoticeParent>
            {parentDebateSelectedText && (
              <ChildDebateNoticeQuote>
                {parentDebateSelectedText}
              </ChildDebateNoticeQuote>
            )}
          </ChildDebateNoticeBody>
          <ChildDebateNoticeAction
            type="button"
            onClick={() => navigate(`/debate/${parentDebate.id}`)}
          >
            상위 토론
          </ChildDebateNoticeAction>
        </ChildDebateNotice>
      )}

      <ThreadArea
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {error && <ErrorText>{error}</ErrorText>}
        {!error && threadMessages.length === 0 && (
          <EmptyCard>아직 의견이 없습니다. 첫 의견을 남겨보세요.</EmptyCard>
        )}
        {isConsensusDebate && (
          <ConsensusSummaryPanel>
            진행 중 합의안 {openConsensusCount}개 · 승인된 기준 정의{" "}
            {approvedConsensusCount}개
          </ConsensusSummaryPanel>
        )}
        {isProsConsDebate && (
          <StancePanel>
            <StancePanelTitle>입장 선택</StancePanelTitle>
            <StanceHelpText>
              최종 입장 분포 · 찬성 {stanceSummary.PRO} · 반대 {stanceSummary.CON} · 중립 {stanceSummary.NEUTRAL}
            </StanceHelpText>
            <StanceButtonRow>
              {(["PRO", "CON", "NEUTRAL"] as DebateStance[]).map((stance) => (
                <StanceButton
                  key={stance}
                  type="button"
                  data-active={myStance === stance}
                  disabled={isDebateReadOnly || isJoinRequired || isSubmitting}
                  onClick={() => void handleStanceChange(stance)}
                >
                  {STANCE_LABEL[stance]}
                </StanceButton>
              ))}
            </StanceButtonRow>
            <StanceHelpText>
              글 작성 당시의 입장이 글에 남습니다. 입장을 바꿔도 기존 글은 변경되지 않습니다.
            </StanceHelpText>
            <StanceFilterRow>
              {STANCE_FILTERS.map((filter) => (
                <StanceFilterButton
                  key={filter}
                  type="button"
                  data-active={stanceFilter === filter}
                  onClick={() => setStanceFilter(filter)}
                >
                  {filter === "ALL" ? "전체" : STANCE_LABEL[filter]}
                </StanceFilterButton>
              ))}
            </StanceFilterRow>
          </StancePanel>
        )}
        {currentDebate.status !== "OPEN" && (
          <ReadOnlyPanel>
            종료되었거나 보관된 토론입니다. 하위 토론 생성은 사용할 수 없습니다.
          </ReadOnlyPanel>
        )}
        {threadMessages.map((item, postIndex) => {
          const postNumber = postIndex + 1;
          const comments = commentsByPostId[item.id] ?? [];
          const commentGroups = buildCommentGroups(comments);
          const isDeleted = item.status === "DELETED";
          const menuKey = `post:${item.id}`;
          const canManage = item.author.id === user?.id;
          const isEditing =
            editTarget?.type === "POST" && editTarget.postId === item.id;

          return (
            <MessageGroup key={item.id}>
              <MessageCard>
                <MetaRow>
                  <NumberText>#{postNumber}</NumberText>
                  <Avatar />
                  <AuthorName>{item.author.nickname}</AuthorName>
                  {item.stance && (
                    <PostStanceBadge data-stance={item.stance}>
                      {STANCE_LABEL[item.stance]}
                    </PostStanceBadge>
                  )}
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
                                  openPostEditor(
                                    item.id,
                                    item.content,
                                    item.definitionReferences,
                                  );
                                }}
                              >
                                수정
                              </CardMenuButton>
                              <CardMenuButton
                                type="button"
                                onClick={() => {
                                  setActiveCardMenuKey(null);
                                  openPostDeleteConfirm(item.id);
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
                          <CardMenuButton
                            type="button"
                            onClick={() => {
                              setActiveCardMenuKey(null);
                              setReportTarget({ targetType: "POST", targetId: item.id });
                            }}
                          >
                            신고
                          </CardMenuButton>
                          <CardMenuButton
                            type="button"
                            onClick={() => {
                              setActiveCardMenuKey(null);
                              setReportTarget({ targetType: "USER", targetId: item.author.id });
                            }}
                          >
                            작성자 신고
                          </CardMenuButton>
                        </CardMenu>
                      )}
                    </ActionGroup>
                  )}
                </MetaRow>
                {isEditing ? (
                  <InlineEditBox>
                    {submitError && (
                      <InlineEditError>{submitError}</InlineEditError>
                    )}
                    <InlineEditTextareaWrap>
                      <InlineEditHighlightLayer aria-hidden>
                        <InlineEditHighlightText
                          style={{ transform: `translateY(-${editScrollTop}px)` }}
                        >
                          {renderEditHighlightedContent()}
                        </InlineEditHighlightText>
                      </InlineEditHighlightLayer>
                      <InlineEditTextarea
                        ref={editInputRef}
                        value={editContent}
                        onChange={(event) =>
                          handleEditContentChange(event.target.value)
                        }
                        onScroll={(event) =>
                          setEditScrollTop(event.currentTarget.scrollTop)
                        }
                        onMouseUp={handleEditSelection}
                        onKeyUp={handleEditSelection}
                        onTouchEnd={handleEditSelection}
                        autoFocus
                      />
                    </InlineEditTextareaWrap>
                    {(visibleExistingEditDefinitionReferences.length > 0 ||
                      pendingEditDefinitionReferences.length > 0) && (
                      <EditReferencePreview>
                        {visibleExistingEditDefinitionReferences.map((reference) => (
                          <EditReferenceChip key={reference.id}>
                            <span>{reference.selectedText}</span>
                            <small>
                              {getDefinitionReferenceLabel(reference.referenceType)} ·{" "}
                              {reference.definition.term}
                            </small>
                            <ReferenceButtonGroup>
                              <ReferenceRemoveButton
                                type="button"
                                onClick={() =>
                                  changeExistingEditDefinitionReference(reference)
                                }
                              >
                                변경
                              </ReferenceRemoveButton>
                              <ReferenceRemoveButton
                                type="button"
                                onClick={() =>
                                  removeExistingEditDefinitionReference(reference.id)
                                }
                              >
                                삭제
                              </ReferenceRemoveButton>
                            </ReferenceButtonGroup>
                          </EditReferenceChip>
                        ))}
                        {pendingEditDefinitionReferences.map((reference) => (
                          <EditReferenceChip key={reference.tempId}>
                            <span>{reference.selectedText}</span>
                            <small>
                              {getDefinitionReferenceLabel(reference.referenceType)} ·{" "}
                              {reference.definition.term}
                            </small>
                            <ReferenceRemoveButton
                              type="button"
                              aria-label="정의 연결 취소"
                              onClick={() =>
                                cancelPendingEditDefinitionReference(reference)
                              }
                            >
                              취소
                            </ReferenceRemoveButton>
                          </EditReferenceChip>
                        ))}
                      </EditReferencePreview>
                    )}
                    <InlineEditActions>
                      <InlineEditCancelButton
                        type="button"
                        onClick={cancelInlineEdit}
                      >
                        취소
                      </InlineEditCancelButton>
                      <InlineEditSaveButton
                        type="button"
                        onClick={() => void handleSubmitEdit()}
                        disabled={isSubmitting || !editContent.trim()}
                      >
                        저장
                      </InlineEditSaveButton>
                    </InlineEditActions>
                  </InlineEditBox>
                ) : (
                  renderMessageText(
                    isDeleted ? "삭제된 의견입니다." : item.content,
                    isDeleted ? undefined : "POST",
                    isDeleted ? undefined : item.id,
                    isDeleted ? undefined : item.definitionReferences,
                  )
                )}
              </MessageCard>
              {!isDeleted && renderInlineConsensusStack("POST", item.id)}
              {!isDeleted && renderInlineChildDebateStack("POST", item.id)}

              {commentGroups.length > 0 && (
                <CommentList>
                  {commentGroups.map((comment, commentIndex) => {
                    const commentNumber = `${postNumber}-${commentIndex + 1}`;
                    return (
                    <CommentGroupItem key={comment.id}>
                      {renderCommentCard(comment, item.id, commentNumber)}
                      {comment.replies.length > 0 && (
                        <>
                          <ReplyToggleButton type="button" onClick={() => toggleReplyGroup(item.id, comment.id)}>
                            {expandedReplyGroups[getReplyGroupKey(item.id, comment.id)]
                              ? "답글 숨기기"
                              : `답글 ${comment.replies.length}개 보기`}
                          </ReplyToggleButton>
                          {expandedReplyGroups[getReplyGroupKey(item.id, comment.id)] && (
                            <ReplyList>
                              {comment.replies.map((reply, replyIndex) =>
                                renderCommentCard(
                                  reply,
                                  item.id,
                                  `${commentNumber}-${replyIndex + 1}`,
                                ),
                              )}
                            </ReplyList>
                          )}
                        </>
                      )}
                    </CommentGroupItem>
                    );
                  })}
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
          {currentDebate?.status === "OPEN" && (
            <SelectionMenuButton
              type="button"
              onClick={() => void handleSelectionAction("child")}
            >
              하위 토론
            </SelectionMenuButton>
          )}
          <SelectionMenuButton type="button" onClick={handleCopySelection}>
            복사
          </SelectionMenuButton>
        </SelectionMenu>
      )}

      {composerSelection && (
        <SelectionMenu
          ref={composerSelectionMenuRef}
          style={{
            left: composerSelection.menuX,
            top: composerSelection.menuY,
          }}
        >
          <SelectionMenuButton type="button" onClick={openDefinitionPicker}>
            정의 연결
          </SelectionMenuButton>
          <SelectionMenuButton type="button" onClick={clearComposerSelectionMenu}>
            취소
          </SelectionMenuButton>
        </SelectionMenu>
      )}

      {editSelection && (
        <SelectionMenu
          ref={editSelectionMenuRef}
          style={{
            left: editSelection.menuX,
            top: editSelection.menuY,
          }}
        >
          <SelectionMenuButton type="button" onClick={openDefinitionPicker}>
            정의 연결
          </SelectionMenuButton>
          <SelectionMenuButton type="button" onClick={() => setEditSelection(null)}>
            취소
          </SelectionMenuButton>
        </SelectionMenu>
      )}

      {isDefinitionPickerOpen && definitionPickerSelection && (
        <SheetBackdrop
          onClick={() => {
            setIsDefinitionPickerOpen(false);
            setDefinitionPickerSelection(null);
            setReplacingEditDefinitionReference(null);
          }}
        >
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>연결할 정의를 선택해 주세요</SheetTitle>
            <SheetQuote>{definitionPickerSelection.selectedText}</SheetQuote>
            <PickerTabs>
              <PickerTabButton
                type="button"
                data-active={definitionPickerTab === "DEBATE_STANDARD"}
                onClick={() => setDefinitionPickerTab("DEBATE_STANDARD")}
              >
                이 토론 기준 정의
              </PickerTabButton>
              <PickerTabButton
                type="button"
                data-active={definitionPickerTab === "GLOBAL_REFERENCE"}
                onClick={() => setDefinitionPickerTab("GLOBAL_REFERENCE")}
              >
                전체 정의 검색
              </PickerTabButton>
            </PickerTabs>
            {definitionPickerTab === "DEBATE_STANDARD" ? (
              <DefinitionResultList>
                {matchingDebateDefinitions.length === 0 && (
                  <EmptyResultText>연결할 기준 정의가 없습니다.</EmptyResultText>
                )}
                {matchingDebateDefinitions.map((definition) => (
                  <DefinitionResultCard key={definition.id}>
                    <DefinitionResultTitle>{definition.term}</DefinitionResultTitle>
                    <DefinitionResultContent>{definition.content}</DefinitionResultContent>
                    <DefinitionResultMeta>기준 정의</DefinitionResultMeta>
                    <SheetPrimaryButton
                      type="button"
                      onClick={() => connectDefinition(definition, "DEBATE_STANDARD")}
                    >
                      연결
                    </SheetPrimaryButton>
                  </DefinitionResultCard>
                ))}
              </DefinitionResultList>
            ) : (
              <>
                <SheetInput
                  value={globalDefinitionKeyword}
                  onChange={(event) =>
                    setGlobalDefinitionKeyword(event.target.value)
                  }
                  placeholder="전체 정의 검색"
                />
                <DefinitionResultList>
                  {globalDefinitions.length === 0 && (
                    <EmptyResultText>검색된 정의가 없습니다.</EmptyResultText>
                  )}
                  {globalDefinitions.map((definition) => (
                    <DefinitionResultCard key={definition.id}>
                      <DefinitionResultTitle>{definition.term}</DefinitionResultTitle>
                      <DefinitionResultContent>{definition.content}</DefinitionResultContent>
                      <DefinitionResultMeta>
                        참고 정의
                        {definition.sourceDebate?.title
                          ? ` · ${definition.sourceDebate.title}`
                          : ""}
                      </DefinitionResultMeta>
                      <SheetPrimaryButton
                        type="button"
                        onClick={() => connectDefinition(definition, "GLOBAL_REFERENCE")}
                      >
                        연결
                      </SheetPrimaryButton>
                    </DefinitionResultCard>
                  ))}
                </DefinitionResultList>
                <DefinitionPolicyText>
                  글로벌 정의는 현재 토론의 기준 정의로 자동 등록되지 않습니다.
                </DefinitionPolicyText>
              </>
            )}
            <SheetActionRow>
              <SheetSecondaryButton
                type="button"
                onClick={() => {
                  setIsDefinitionPickerOpen(false);
                  setDefinitionPickerSelection(null);
                  setReplacingEditDefinitionReference(null);
                }}
              >
                취소
              </SheetSecondaryButton>
            </SheetActionRow>
          </BottomSheet>
        </SheetBackdrop>
      )}

      {deleteTarget && (
        <SheetBackdrop
          onClick={() => {
            setDeleteTarget(null);
            setSubmitError("");
          }}
        >
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>
              {deleteTarget.type === "POST" ? "의견 삭제" : "댓글 삭제"}
            </SheetTitle>
            {submitError && <SheetError>{submitError}</SheetError>}
            <DeleteConfirmText>
              {deleteTarget.type === "POST"
                ? "이 의견을 삭제할까요?"
                : "이 댓글을 삭제할까요?"}
            </DeleteConfirmText>
            <SheetActionRow>
              <SheetSecondaryButton
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setSubmitError("");
                }}
              >
                취소
              </SheetSecondaryButton>
              <DangerButton
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isSubmitting}
              >
                삭제
              </DangerButton>
            </SheetActionRow>
          </BottomSheet>
        </SheetBackdrop>
      )}

      {consensusDraft && (
        <SheetBackdrop onClick={() => setConsensusDraft(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>합의안 제안</SheetTitle>
            {submitError && <SheetError>{submitError}</SheetError>}
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

      {childDebateDraft && (
        <SheetBackdrop onClick={() => setChildDebateDraft(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>하위 토론 만들기</SheetTitle>
            {submitError && <SheetError>{submitError}</SheetError>}
            <SheetQuote>{childDebateDraft.selection.selectedText}</SheetQuote>
            <SheetField>
              <SheetLabel>제목</SheetLabel>
              <SheetInput
                value={childDebateDraft.title}
                onChange={(event) =>
                  setChildDebateDraft((prev) =>
                    prev ? { ...prev, title: event.target.value } : prev,
                  )
                }
                placeholder="하위 토론 제목"
              />
            </SheetField>
            <SheetField>
              <SheetLabel>설명</SheetLabel>
              <SheetTextarea
                value={childDebateDraft.description}
                onChange={(event) =>
                  setChildDebateDraft((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
                placeholder="토론에서 다룰 쟁점을 적어주세요."
              />
            </SheetField>
            <SheetField>
              <SheetLabel>토론 방식</SheetLabel>
              <SheetSelect
                value={childDebateDraft.debateType}
                onChange={(event) =>
                  setChildDebateDraft((prev) =>
                    prev
                      ? { ...prev, debateType: event.target.value as DebateType }
                      : prev,
                  )
                }
              >
                {DEBATE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SheetSelect>
            </SheetField>
            <SheetField>
              <SheetLabel>태그</SheetLabel>
              <TagPicker
                selectedTags={childDebateDraft.tags}
                onChange={(tags) =>
                  setChildDebateDraft((prev) => (prev ? { ...prev, tags } : prev))
                }
                placeholder="태그를 검색하세요"
              />
            </SheetField>
            <SheetActionRow>
              <SheetSecondaryButton
                type="button"
                onClick={() => setChildDebateDraft(null)}
              >
                취소
              </SheetSecondaryButton>
              <SheetPrimaryButton
                type="button"
                onClick={() => void handleSubmitChildDebateDraft()}
                disabled={isSubmitting}
              >
                만들기
              </SheetPrimaryButton>
            </SheetActionRow>
          </BottomSheet>
        </SheetBackdrop>
      )}

      {selectedConsensus && (
        <SheetBackdrop onClick={() => setSelectedConsensus(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>{selectedConsensus.title}</SheetTitle>
            {submitError && <SheetError>{submitError}</SheetError>}
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
                onClick={() =>
                  setReportTarget({
                    targetType: "CONSENSUS",
                    targetId: selectedConsensus.id,
                  })
                }
              >
                신고
              </SheetSecondaryButton>
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

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          onClose={() => setReportTarget(null)}
          onSubmitted={(message) => setActionMessage(message)}
        />
      )}

      {activeDefinitionReference && (
        <SheetBackdrop onClick={() => setActiveDefinitionReference(null)}>
          <BottomSheet onClick={(event) => event.stopPropagation()}>
            <SheetTitle>{activeDefinitionReference.definition.term}</SheetTitle>
            <ConsensusBadge>
              {getDefinitionReferenceLabel(activeDefinitionReference.referenceType)}
            </ConsensusBadge>
            <DetailContent>{activeDefinitionReference.definition.content}</DetailContent>
            {activeDefinitionReference.definition.sourceDebate && (
              <SourceLinkButton
                type="button"
                onClick={() => {
                  const sourceDebateId =
                    activeDefinitionReference.definition.sourceDebate?.id;
                  setActiveDefinitionReference(null);
                  if (sourceDebateId) navigate(`/debate/${sourceDebateId}`);
                }}
              >
                출처 토론 · {activeDefinitionReference.definition.sourceDebate.title}
              </SourceLinkButton>
            )}
            {activeDefinitionReference.definition.sourceConsensus && (
              <DefinitionPolicyText>
                출처 합의안 · {activeDefinitionReference.definition.sourceConsensus.title}
              </DefinitionPolicyText>
            )}
            <SheetActionRow>
              <SheetSecondaryButton
                type="button"
                onClick={() => setActiveDefinitionReference(null)}
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
        {readOnlyMessage && (
          <ReadOnlyComposerNotice>{readOnlyMessage}</ReadOnlyComposerNotice>
        )}
        {submitError && <SubmitError>{submitError}</SubmitError>}
        {actionMessage && (
          <ComposerToastLayer>
            <ActionNotice>{actionMessage}</ActionNotice>
          </ComposerToastLayer>
        )}
        {!readOnlyMessage && shouldShowJoinCta ? (
          <JoinComposerPanel>
            <JoinComposerText>
              이 토론에 참여하면 의견을 남길 수 있습니다.
            </JoinComposerText>
            <JoinComposerButton
              type="button"
              disabled={isJoiningDebate}
              onClick={() => void handleJoinDebate()}
            >
              {isJoiningDebate ? "참여 중..." : "참여하기"}
            </JoinComposerButton>
          </JoinComposerPanel>
        ) : (
          !readOnlyMessage && (
            <>
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
                  onChange={(event) => handleComposerMessageChange(event.target.value)}
                  onMouseUp={handleComposerSelection}
                  onKeyUp={handleComposerSelection}
                  onTouchEnd={handleComposerSelection}
                  placeholder="입력창.."
                  aria-label="토론 메시지 입력"
                  disabled={isComposerDisabled}
                />
                <SendButton
                  type="submit"
                  aria-label="메시지 전송"
                  disabled={!message.trim() || isSubmitting || isComposerDisabled}
                >
                  <SendIcon />
                </SendButton>
              </Composer>
              {pendingDefinitionReferences.length > 0 && (
                <ComposerReferencePreview>
                  {pendingDefinitionReferences.map((reference) => (
                    <ComposerReferenceChip key={reference.tempId}>
                      <span>{reference.selectedText}</span>
                      <small>
                        {getDefinitionReferenceLabel(reference.referenceType)} ·{" "}
                        {reference.definition.term}
                      </small>
                      <ReferenceRemoveButton
                        type="button"
                        aria-label="정의 연결 취소"
                        onClick={() =>
                          setPendingDefinitionReferences((prev) =>
                            prev.filter((item) => item.tempId !== reference.tempId),
                          )
                        }
                      >
                        취소
                      </ReferenceRemoveButton>
                    </ComposerReferenceChip>
                  ))}
                </ComposerReferencePreview>
              )}
            </>
          )
        )}
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
  margin: var(--page-top) auto clamp(36px, 13.5vw, 58px);
  cursor: pointer;
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

const DebateReportButton = styled.button`
  display: block;
  margin: -4px var(--page-x) 8px auto;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #8f8f8f;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
`;

const ChildDebateNotice = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 10px;
  align-items: center;
  margin: 0 var(--page-x) 10px;
  border-left: 3px solid #2dcd97;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 12px;
`;

const ChildDebateNoticeBadge = styled.span`
  grid-column: 1 / -1;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  height: 22px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2d8f73;
  font-size: 11px;
  font-weight: 700;
  padding: 0 8px;
`;

const ChildDebateNoticeBody = styled.div`
  min-width: 0;
`;

const ChildDebateNoticeTitle = styled.strong`
  display: block;
  color: #555555;
  font-size: 13px;
  line-height: 1.35;
`;

const ChildDebateNoticeParent = styled.p`
  margin: 3px 0 0;
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChildDebateNoticeQuote = styled.blockquote`
  margin: 6px 0 0;
  border-left: 2px solid #d8f5ec;
  padding-left: 7px;
  color: #9a9a9a;
  font-size: 12px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const ChildDebateNoticeAction = styled.button`
  grid-column: 2;
  grid-row: 2;
  min-width: 76px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
  white-space: nowrap;
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

const ReplyToggleButton = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #2dcd97;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 4px;
  margin-left: 4px;
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

const PostStanceBadge = styled.span`
  height: 20px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 999px;
  background: #eefaf6;
  color: #2d8f73;
  font-size: 10px;
  font-weight: 800;
  padding: 0 7px;

  &[data-stance="CON"] {
    background: #fff1f1;
    color: #d84a4a;
  }

  &[data-stance="NEUTRAL"] {
    background: #f0f0f0;
    color: #777777;
  }
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

const DefinitionReferenceMark = styled.button`
  display: inline;
  border: none;
  border-bottom: 1px solid #2dcd97;
  background: rgba(45, 205, 151, 0.08);
  color: #4f7569;
  font: inherit;
  line-height: inherit;
  padding: 0 2px;
  cursor: pointer;

  &[data-reference-type="GLOBAL_REFERENCE"] {
    border-bottom-style: dashed;
    background: rgba(76, 126, 230, 0.08);
    color: #526a9d;
  }
`;

const InlineEditBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const InlineEditTextareaWrap = styled.div`
  position: relative;
  width: 100%;
  min-height: 72px;
  border-radius: 8px;
  background: #f0f0f0;
  overflow: hidden;
`;

const InlineEditHighlightLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
`;

const InlineEditHighlightText = styled.div`
  min-height: 72px;
  color: #555555;
  font-size: var(--body-sm);
  line-height: 1.45;
  padding: 9px 10px;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const InlineEditHighlightMark = styled.span`
  border-bottom: 1px solid #2dcd97;
  background: rgba(45, 205, 151, 0.16);
  color: #3f6f62;

  &[data-reference-type="GLOBAL_REFERENCE"] {
    border-bottom-style: dashed;
    background: rgba(76, 126, 230, 0.14);
    color: #526a9d;
  }
`;

const InlineEditTextarea = styled.textarea`
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 72px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: transparent;
  caret-color: #555555;
  font-size: var(--body-sm);
  line-height: 1.45;
  padding: 9px 10px;
  resize: vertical;
  outline: none;
  overflow-wrap: anywhere;
`;

const InlineEditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const EditReferencePreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EditReferenceChip = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0 8px;
  align-items: center;
  border-radius: 8px;
  background: #f7f7f7;
  padding: 6px 8px;

  span,
  small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #555555;
    font-size: 12px;
    font-weight: 700;
  }

  small {
    color: #8f8f8f;
    font-size: 11px;
  }
`;

const InlineEditButton = styled.button`
  height: 28px;
  border: none;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;

  &:disabled {
    opacity: 0.55;
  }
`;

const InlineEditCancelButton = styled(InlineEditButton)`
  background: #f0f0f0;
  color: #7f7f7f;
`;

const InlineEditSaveButton = styled(InlineEditButton)`
  background: #2dcd97;
  color: #ffffff;
`;

const InlineEditError = styled.p`
  margin: 0;
  color: #f04444;
  font-size: 12px;
  line-height: 1.35;
  word-break: keep-all;
  overflow-wrap: anywhere;
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

const StancePanel = styled(ConsensusSummaryPanel)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
  color: #555555;
`;

const StancePanelTitle = styled.strong`
  font-size: 12px;
  color: #555555;
`;

const StanceButtonRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
`;

const StanceButton = styled.button`
  height: 32px;
  border: 1px solid #d8d8d8;
  border-radius: 999px;
  background: #f7f7f7;
  color: #6f6f6f;
  font-size: 12px;
  font-weight: 700;

  &[data-active="true"] {
    border-color: #2dcd97;
    background: #2dcd97;
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.55;
  }
`;

const StanceHelpText = styled.p`
  margin: 0;
  color: #9a9a9a;
  font-size: 12px;
  line-height: 1.35;
`;

const StanceFilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
`;

const StanceFilterButton = styled.button`
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #7f7f7f;
  font-size: 11px;
  font-weight: 700;

  &[data-active="true"] {
    background: #eefaf6;
    color: #2d8f73;
  }
`;

const ReadOnlyPanel = styled(ConsensusSummaryPanel)`
  background: #f1f1f1;
  color: #888888;
`;

const InlineConsensusStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: -3px;
  padding-left: clamp(14px, 4vw, 18px);
`;

const InlineStackToggleButton = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #2dcd97;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 4px;
`;

const InlineChildDebateStack = styled(InlineConsensusStack)`
  gap: 6px;
`;

const InlineChildDebateTitle = styled.span`
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
`;

const InlineChildDebateCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 10px;
  align-items: center;
  border-radius: 8px;
  background: #ffffff;
  border-left: 3px solid #2dcd97;
  padding: 9px 10px;
`;

const ChildDebateTitleText = styled.strong`
  min-width: 0;
  color: #555555;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChildDebateQuote = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  color: #9a9a9a;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ChildDebateAction = styled.button`
  grid-column: 2;
  grid-row: 1;
  min-width: 48px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #eefaf6;
  color: #2dcd97;
  font-size: 12px;
  font-weight: 700;
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

const SheetError = styled.p`
  margin: -4px 0 12px;
  color: #f04444;
  font-size: 12px;
  line-height: 1.4;
  word-break: keep-all;
  overflow-wrap: anywhere;
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

const SheetSelect = styled.select`
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

const PickerTabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 0 0 12px;
`;

const PickerTabButton = styled.button`
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;

  &[data-active="true"] {
    background: #2dcd97;
    color: #ffffff;
  }
`;

const DefinitionResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

const DefinitionResultCard = styled.div`
  border-radius: 8px;
  background: #f7f7f7;
  padding: 10px;
`;

const DefinitionResultTitle = styled.h3`
  margin: 0 0 4px;
  color: #555555;
  font-size: 14px;
  font-weight: 700;
`;

const DefinitionResultContent = styled.p`
  margin: 0;
  color: #7f7f7f;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const DefinitionResultMeta = styled.p`
  margin: 6px 0 8px;
  color: #2d8f73;
  font-size: 11px;
  font-weight: 700;
`;

const EmptyResultText = styled.p`
  margin: 4px 0;
  color: #a0a0a0;
  font-size: 12px;
  text-align: center;
`;

const DefinitionPolicyText = styled.p`
  margin: 10px 0 0;
  color: #8f8f8f;
  font-size: 12px;
  line-height: 1.4;
`;

const SourceLinkButton = styled.button`
  width: 100%;
  min-height: 34px;
  border: none;
  border-radius: 8px;
  background: #eefaf6;
  color: #2d8f73;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 10px;
  text-align: left;
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

const DangerButton = styled(SheetSecondaryButton)`
  background: #f04444;
  color: #ffffff;

  &:disabled {
    opacity: 0.6;
  }
`;

const DeleteConfirmText = styled.p`
  margin: 0;
  color: #555555;
  font-size: var(--body-sm);
  line-height: 1.5;
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
  overflow: visible;
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

const JoinComposerPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
`;

const JoinComposerText = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: 13px;
  line-height: 1.35;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const JoinComposerButton = styled.button`
  height: clamp(36px, 9.3vw, 40px);
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 0 16px;
  white-space: nowrap;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const ComposerReferencePreview = styled.div`
  display: flex;
  position: absolute;
  left: var(--page-x);
  right: var(--page-x);
  bottom: calc(100% + 8px);
  flex-direction: row;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ComposerToastLayer = styled.div`
  position: absolute;
  left: var(--page-x);
  right: var(--page-x);
  bottom: calc(100% + 8px);
  z-index: 2;
  pointer-events: none;
  animation: toast-lifecycle 2600ms ease forwards;

  @keyframes toast-lifecycle {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    8%,
    84% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(4px);
    }
  }

  & ~ ${ComposerReferencePreview} {
    bottom: calc(100% + 48px);
  }
`;

const ComposerReferenceChip = styled.div`
  display: grid;
  grid-template-columns: minmax(88px, 1fr) auto;
  gap: 0 8px;
  align-items: center;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  padding: 6px 8px;
  min-width: min(260px, 82vw);
  max-width: min(320px, 88vw);

  span,
  small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #555555;
    font-size: 12px;
    font-weight: 700;
  }

  small {
    color: #8f8f8f;
    font-size: 11px;
  }
`;

const ReferenceRemoveButton = styled.button`
  grid-row: 1 / span 2;
  grid-column: 2;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #eeeeee;
  color: #7f7f7f;
  font-size: 11px;
  font-weight: 700;
  padding: 0 10px;
`;

const ReferenceButtonGroup = styled.div`
  grid-row: 1 / span 2;
  grid-column: 2;
  display: inline-flex;
  gap: 4px;

  ${ReferenceRemoveButton} {
    grid-row: auto;
    grid-column: auto;
    padding: 0 8px;
  }
`;

const SubmitError = styled.p`
  margin: 0 0 8px;
  text-align: center;
  color: #f04444;
  font-size: 12px;
`;

const ReadOnlyComposerNotice = styled.p`
  margin: 0 0 8px;
  text-align: center;
  color: #8f8f8f;
  font-size: 13px;
`;

const ActionNotice = styled.p`
  margin: 0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  padding: 8px 10px;
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
