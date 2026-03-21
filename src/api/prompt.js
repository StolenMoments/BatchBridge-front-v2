import api from './index'

export const addPrompt    = (batchId, data)            => api.post(`/batches/${batchId}/prompts`, data)
export const updatePrompt = (batchId, promptId, data)  => api.put(`/batches/${batchId}/prompts/${promptId}`, data)
export const deletePrompt = (batchId, promptId)        => api.delete(`/batches/${batchId}/prompts/${promptId}`)
