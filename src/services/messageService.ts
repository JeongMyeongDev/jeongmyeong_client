import api from './api';
import type { ChatRoom, Message } from '../types/message';

export const messageService = {
  getChatRooms: () => api.get<ChatRoom[]>('/messages/rooms'),
  getMessages: (roomId: string) => api.get<Message[]>(`/messages/rooms/${roomId}`),
  sendMessage: (roomId: string, content: string) =>
    api.post<Message>(`/messages/rooms/${roomId}`, { content }),
};
