import api from "./api";
import type { DebateTag } from "../types/debate";

interface TagsResponse {
  success: boolean;
  tags: Array<DebateTag & { createdAt?: string }>;
}

export const tagService = {
  getTags: (keyword?: string, limit = 20) =>
    api.get<TagsResponse>("/tags", {
      params: {
        keyword: keyword?.trim() || undefined,
        limit,
      },
    }),
};
