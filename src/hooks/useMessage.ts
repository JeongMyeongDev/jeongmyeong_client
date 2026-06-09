import { useCallback } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { messageService } from '../services/messageService';

export const useMessage = () => {
  const { chatRooms, currentMessages, setChatRooms, setCurrentMessages } = useMessageStore();

  const fetchChatRooms = useCallback(async () => {
    const { data } = await messageService.getChatRooms();
    setChatRooms(Array.isArray(data.debates) ? data.debates : []);
  }, [setChatRooms]);

  const fetchMessages = useCallback(async (roomId: string) => {
    const { data } = await messageService.getMessages(roomId);
    setCurrentMessages(Array.isArray(data.posts) ? data.posts : []);
  }, [setCurrentMessages]);

  const sendMessage = useCallback(async (roomId: string, content: string) => {
    await messageService.sendMessage(roomId, content);
    await fetchMessages(roomId);
  }, [fetchMessages]);

  return { chatRooms, currentMessages, fetchChatRooms, fetchMessages, sendMessage };
};
