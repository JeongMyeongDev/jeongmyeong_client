import { useCallback } from 'react';
import { useDebateStore } from '../stores/debateStore';
import { debateService } from '../services/debateService';
import type {
  CreateConsensusRequest,
  CreateDebateRequest,
  CreatePostRequest,
  CreateSelectionTargetRequest,
  CloseDebateRequest,
  ListDebatesParams,
} from '../services/debateService';

// 가장 마지막으로 요청한 토론/메시지 id를 추적해, 늦게 도착한 이전 요청 응답이
// 이후에 탐색한 토론의 상태를 덮어쓰지 않도록 막는다 (네트워크 응답 순서 역전 대비).
let latestRequestedDebateId: string | null = null;
let latestRequestedMessagesId: string | null = null;

export const useDebate = () => {
  const { debates, currentDebate, messages, setDebates, setCurrentDebate, setMessages, addMessage } =
    useDebateStore();

  const fetchDebates = useCallback(async (params?: ListDebatesParams) => {
    const { data } = await debateService.getList(params);
    setDebates(data.debates);
  }, [setDebates]);

  const fetchArchivedDebates = useCallback(async (params?: Omit<ListDebatesParams, 'status'>) => {
    const { data } = await debateService.getArchived(params);
    setDebates(data.debates);
  }, [setDebates]);

  const fetchDebate = useCallback(async (id: string) => {
    latestRequestedDebateId = id;
    const { data } = await debateService.getById(id);
    if (latestRequestedDebateId !== id) return;
    setCurrentDebate(data.debate);
  }, [setCurrentDebate]);

  const fetchMessages = useCallback(async (id: string) => {
    latestRequestedMessagesId = id;
    const { data } = await debateService.getMessages(id);
    if (latestRequestedMessagesId !== id) return;
    setMessages(data.posts);
  }, [setMessages]);

  const createDebate = useCallback(async (payload: CreateDebateRequest) => {
    const { data } = await debateService.create(payload);
    return data.debate;
  }, []);

  const createMessage = useCallback(async (id: string, content: string, payload?: Omit<CreatePostRequest, 'content'>) => {
    const { data } = await debateService.createPost(id, { content, ...payload });
    await fetchMessages(id);
    return data.post;
  }, [fetchMessages]);

  const archiveDebate = useCallback(async (id: string) => {
    const { data } = await debateService.archive(id);
    setCurrentDebate(currentDebate?.id === id ? { ...currentDebate, ...data.debate } : currentDebate);
    setDebates(debates.map((debate) => (debate.id === id ? { ...debate, ...data.debate } : debate)));
    return data.debate;
  }, [currentDebate, debates, setCurrentDebate, setDebates]);

  const closeDebate = useCallback(async (id: string, payload?: CloseDebateRequest) => {
    const { data } = await debateService.close(id, payload);
    setCurrentDebate(currentDebate?.id === id ? { ...currentDebate, ...data.debate } : currentDebate);
    setDebates(debates.map((debate) => (debate.id === id ? { ...debate, ...data.debate } : debate)));
    return data.debate;
  }, [currentDebate, debates, setCurrentDebate, setDebates]);

  const createSelectionTarget = useCallback(async (id: string, payload: CreateSelectionTargetRequest) => {
    const { data } = await debateService.createSelectionTarget(id, payload);
    return data.selectionTarget;
  }, []);

  const createConsensus = useCallback(async (id: string, payload: CreateConsensusRequest) => {
    const { data } = await debateService.createConsensus(id, payload);
    return data.consensus;
  }, []);

  return {
    debates,
    currentDebate,
    messages,
    fetchDebates,
    fetchArchivedDebates,
    fetchDebate,
    fetchMessages,
    createDebate,
    createMessage,
    closeDebate,
    archiveDebate,
    createSelectionTarget,
    createConsensus,
    addMessage,
  };
};
