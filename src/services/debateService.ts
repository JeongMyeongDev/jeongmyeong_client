import api from './api';
import type { Debate, DebateMessage } from '../types/debate';

interface CreateDebateRequest {
  title: string;
  topic: string;
}

export const debateService = {
  getList: () => api.get<Debate[]>('/debates'),
  getById: (id: string) => api.get<Debate>(`/debates/${id}`),
  create: (data: CreateDebateRequest) => api.post<Debate>('/debates', data),
  getMessages: (id: string) => api.get<DebateMessage[]>(`/debates/${id}/messages`),
  getArchived: () => api.get<Debate[]>('/debates/archived'),
};
