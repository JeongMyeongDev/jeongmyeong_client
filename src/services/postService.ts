import api from './api';
import type { ApiResponse } from '../types/api';
import type {
  Comment,
  CommentSelection,
  DeletedPost,
  SelectionTarget,
  UpdatedPost,
} from '../types/debate';

export interface UpdatePostRequest {
  content: string;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
  selection?: CommentSelection;
}

export const postService = {
  update: (postId: string, data: UpdatePostRequest) =>
    api.patch<ApiResponse<{ post: UpdatedPost }>>(`/posts/${postId}`, data),
  delete: (postId: string) => api.delete<ApiResponse<{ post: DeletedPost }>>(`/posts/${postId}`),
  updateComment: (commentId: string, data: UpdatePostRequest) =>
    api.patch<ApiResponse<{ comment: { id: string; content: string; updatedAt: string } }>>(`/comments/${commentId}`, data),
  deleteComment: (commentId: string) => api.delete<ApiResponse<{ comment: { id: string; status: string; deletedAt: string } }>>(`/comments/${commentId}`),
  getComments: (postId: string) => api.get<ApiResponse<{ comments: Comment[] }>>(`/posts/${postId}/comments`),
  createComment: (postId: string, data: CreateCommentRequest) =>
    api.post<ApiResponse<{ comment: Comment; selectionTarget: Pick<SelectionTarget, 'id'> | null }>>(`/posts/${postId}/comments`, data),
};
