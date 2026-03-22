import api, { ApiResponse } from './index'
import type { BatchListItem, BatchDetail, Model, CreateBatchRequest, PaginationResponse } from '../types/api'

export const fetchBatches     = (params: Record<string, unknown>): Promise<ApiResponse<PaginationResponse<BatchListItem>>> => api.get('/batches', { params })
export const createBatch      = (data: CreateBatchRequest): Promise<ApiResponse<BatchDetail>> => api.post('/batches', data)
export const fetchBatchDetail = (id: string | number): Promise<ApiResponse<BatchDetail>> => api.get(`/batches/${id}`)
export const syncBatch        = (id: string | number): Promise<ApiResponse<unknown>> => api.post(`/batches/${id}/sync`)
export const submitBatch      = (id: string | number): Promise<ApiResponse<unknown>> => api.post(`/batches/${id}/submit`)
export const fetchModels      = (): Promise<ApiResponse<Model[]>> => api.get('/models')