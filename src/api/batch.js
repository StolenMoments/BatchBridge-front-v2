import api from './index'

export const fetchBatches     = (params) => api.get('/batches', { params })
export const createBatch      = (data)   => api.post('/batches', data)
export const fetchBatchDetail = (id)     => api.get(`/batches/${id}`)
export const syncBatch        = (id)     => api.post(`/batches/${id}/sync`)
export const fetchModels      = ()       => api.get('/models')
