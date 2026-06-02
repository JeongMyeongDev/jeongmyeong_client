import { useCallback } from 'react';
import { useDebateStore } from '../stores/debateStore';
import { debateService } from '../services/debateService';
import type {
  CreateChildDebateRequest,
  CreateConsensusRequest,
  CreateDebateRequest,
  CreateSelectionTargetRequest,
  ListDebatesParams,
} from '../services/debateService';

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
    const { data } = await debateService.getById(id);
    setCurrentDebate(data.debate);
  }, [setCurrentDebate]);

  const fetchMessages = useCallback(async (id: string) => {
    const { data } = await debateService.getMessages(id);
    setMessages(data.posts);
  }, [setMessages]);

  const createDebate = useCallback(async (payload: CreateDebateRequest) => {
    const { data } = await debateService.create(payload);
    return data.debate;
  }, []);

  const joinDebate = useCallback(async (id: string) => {
    const { data } = await debateService.join(id);
    setCurrentDebate(
      currentDebate?.id === id ? { ...currentDebate, participantCount: data.participantCount } : currentDebate,
    );
    setDebates(
      debates.map((debate) =>
        debate.id === id ? { ...debate, participantCount: data.participantCount } : debate,
      ),
    );
    return data.participantCount;
  }, [currentDebate, debates, setCurrentDebate, setDebates]);

  const createMessage = useCallback(async (id: string, content: string) => {
    const { data } = await debateService.createPost(id, { content });
    await fetchMessages(id);
    return data.post;
  }, [fetchMessages]);

  const archiveDebate = useCallback(async (id: string) => {
    const { data } = await debateService.archive(id);
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

  const createChildDebateFromSelection = useCallback(async (
    selectionTargetId: string,
    payload: CreateChildDebateRequest,
  ) => {
    const { data } = await debateService.createChildDebateFromSelection(selectionTargetId, payload);
    return data.debate;
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
    joinDebate,
    createMessage,
    archiveDebate,
    createSelectionTarget,
    createConsensus,
    createChildDebateFromSelection,
    addMessage,
  };
};
