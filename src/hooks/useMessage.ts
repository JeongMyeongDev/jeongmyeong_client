import { useMessageStore } from '../stores/messageStore';
import { messageService } from '../services/messageService';

export const useMessage = () => {
  const { chatRooms, currentMessages, setChatRooms, setCurrentMessages, addMessage } =
    useMessageStore();

  const fetchChatRooms = async () => {
    const { data } = await messageService.getChatRooms();
    setChatRooms(data);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await messageService.getMessages(roomId);
    setCurrentMessages(data);
  };

  const sendMessage = async (roomId: string, content: string) => {
    const { data } = await messageService.sendMessage(roomId, content);
    addMessage(data);
  };

  return { chatRooms, currentMessages, fetchChatRooms, fetchMessages, sendMessage };
};
