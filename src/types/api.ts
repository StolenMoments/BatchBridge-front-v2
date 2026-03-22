
export interface BatchListItem {
  id: string | number;
  label: string;
  model: string;
  promptCount?: number;
  status: string;
  createdAt?: string;
  completedAt?: string;
}

export interface Prompt {
  id: string | number;
  label?: string;
  systemPrompt?: string;
  userPrompt: string;
  status: string;
  responseContent?: string;
  errorMessage?: string;
}

export interface BatchDetail {
  id: string | number;
  label: string;
  model: string;
  status: string;
  createdAt?: string;
  completedAt?: string;
  submittedAt?: string;
  prompts?: Prompt[];
}

export interface Model {
  id: string;
  displayName: string;
}

export interface CreateBatchRequest {
  label?: string;
  model: string;
  prompt?: CreatePromptRequest;
}

export interface PaginationResponse<T> {
  content: T[];
  totalPages: number;
}

export interface CreatePromptRequest {
  label?: string;
  systemPrompt?: string;
  userPrompt: string;
}