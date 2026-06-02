import api from './api';
import type { Definition } from '../types/debate';

interface DefinitionListResponse {
  success: boolean;
  definitions: Definition[];
  page?: number;
  limit?: number;
  totalCount?: number;
}

interface DefinitionDetailResponse {
  success: boolean;
  definition: Definition;
}

export interface ListDefinitionsParams {
  q?: string;
  scope?: Definition['scope'];
  debateId?: string;
  page?: number;
  limit?: number;
}

export const definitionService = {
  getList: (params?: ListDefinitionsParams) =>
    api.get<DefinitionListResponse>('/definitions', { params }),
  getById: (definitionId: string) =>
    api.get<DefinitionDetailResponse>(`/definitions/${definitionId}`),
  getByDebate: (debateId: string) =>
    api.get<DefinitionListResponse>(`/debates/${debateId}/definitions`),
};
