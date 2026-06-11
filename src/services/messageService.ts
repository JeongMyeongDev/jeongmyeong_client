import api from './api';
import type { PaginatedResponse, ApiResponse } from '../types/api';
import type { ChatRoom, Message } from '../types/message';

export const messageService = {
  getChatRooms: () =>
    api.get<PaginatedResponse<{ debates: ChatRoom[] }>>('/debates', {
      params: {
        status: 'OPEN',
        sort: 'updatedAt',
        direction: 'desc',
        limit: 20,
      },
    }),
  getMessages: (roomId: string) =>
    api.get<PaginatedResponse<{ posts: Message[] }>>(`/debates/${roomId}/posts`, {
      params: {
        page: 1,
        limit: 100,
      },
    }),
  sendMessage: (roomId: string, content: string) =>
    api.post<ApiResponse<{ post: { id: string; debateId: string; authorId: string; content: string; status: 'VISIBLE' | 'HIDDEN' | 'DELETED'; createdAt: string } }>>(`/debates/${roomId}/posts`, { content }),
};
