import api from './api';
import type { ApiResponse } from '../types/api';
import type {
  Comment,
  CommentSelection,
  DeletedPost,
  DefinitionReference,
  DefinitionReferenceInput,
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
  definitionReferences?: DefinitionReferenceInput[];
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
  getDefinitionReferences: (postId: string) =>
    api.get<ApiResponse<{ definitionReferences: DefinitionReference[] }>>(`/posts/${postId}/definition-references`),
  createDefinitionReference: (postId: string, data: DefinitionReferenceInput) =>
    api.post<ApiResponse<{ definitionReference: DefinitionReference }>>(`/posts/${postId}/definition-references`, data),
  getCommentDefinitionReferences: (commentId: string) =>
    api.get<ApiResponse<{ definitionReferences: DefinitionReference[] }>>(`/comments/${commentId}/definition-references`),
  createCommentDefinitionReference: (commentId: string, data: DefinitionReferenceInput) =>
    api.post<ApiResponse<{ definitionReference: DefinitionReference }>>(`/comments/${commentId}/definition-references`, data),
  deleteDefinitionReference: (definitionReferenceId: string) =>
    api.delete<ApiResponse<{ definitionReference: Pick<DefinitionReference, 'id'> }>>(`/definition-references/${definitionReferenceId}`),
};
