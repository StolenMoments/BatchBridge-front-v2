import api, { ApiResponse } from './index'
import type { CreatePromptRequest, Prompt } from '../types/api'

export const addPrompt    = (batchId: string | number, data: CreatePromptRequest): Promise<ApiResponse<Prompt>> => api.post(`/batches/${batchId}/prompts`, data)
export const updatePrompt = (batchId: string | number, promptId: string | number, data: Partial<CreatePromptRequest>): Promise<ApiResponse<Prompt>> => api.put(`/batches/${batchId}/prompts/${promptId}`, data)
export const deletePrompt = (batchId: string | number, promptId: string | number): Promise<ApiResponse<unknown>> => api.delete(`/batches/${batchId}/prompts/${promptId}`)