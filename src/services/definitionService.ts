import api from "./api";
import type { ApiResponse } from "../types/api";
import type { Definition } from "../types/debate";

export const definitionService = {
  search: (keyword?: string) =>
    api.get<ApiResponse<{ definitions: Definition[] }>>("/definitions", {
      params: { keyword },
    }),
  getById: (definitionId: string) =>
    api.get<ApiResponse<{ definition: Definition }>>(`/definitions/${definitionId}`),
  getByDebate: (debateId: string) =>
    api.get<ApiResponse<{ definitions: Definition[] }>>(`/debates/${debateId}/definitions`),
};
