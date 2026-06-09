import api from './api';
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

interface UpdatePostResponse {
  success: boolean;
  post: UpdatedPost;
}

interface DeletePostResponse {
  success: boolean;
  post: DeletedPost;
}

interface UpdateCommentResponse {
  success: boolean;
  comment: { id: string; content: string; updatedAt: string };
}

interface DeleteCommentResponse {
  success: boolean;
  comment: { id: string; status: string; deletedAt: string };
}

interface CommentListResponse {
  success: boolean;
  comments: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
  selection?: CommentSelection;
}

interface CreateCommentResponse {
  success: boolean;
  comment: Comment;
  selectionTarget: Pick<SelectionTarget, 'id'> | null;
}

export const postService = {
  update: (postId: string, data: UpdatePostRequest) =>
    api.patch<UpdatePostResponse>(`/posts/${postId}`, data),
  delete: (postId: string) => api.delete<DeletePostResponse>(`/posts/${postId}`),
  updateComment: (commentId: string, data: UpdatePostRequest) =>
    api.patch<UpdateCommentResponse>(`/comments/${commentId}`, data),
  deleteComment: (commentId: string) => api.delete<DeleteCommentResponse>(`/comments/${commentId}`),
  getComments: (postId: string) => api.get<CommentListResponse>(`/posts/${postId}/comments`),
  createComment: (postId: string, data: CreateCommentRequest) =>
    api.post<CreateCommentResponse>(`/posts/${postId}/comments`, data),
};
