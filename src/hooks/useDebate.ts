import { useDebateStore } from '../stores/debateStore';
import { debateService } from '../services/debateService';

export const useDebate = () => {
  const { debates, currentDebate, messages, setDebates, setCurrentDebate, setMessages, addMessage } =
    useDebateStore();

  const fetchDebates = async () => {
    const { data } = await debateService.getList();
    setDebates(data);
  };

  const fetchDebate = async (id: string) => {
    const { data } = await debateService.getById(id);
    setCurrentDebate(data);
  };

  const fetchMessages = async (id: string) => {
    const { data } = await debateService.getMessages(id);
    setMessages(data);
  };

  return { debates, currentDebate, messages, fetchDebates, fetchDebate, fetchMessages, addMessage };
};
