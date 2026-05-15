import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const uploadCSV = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100)),
  })
}

export const getProfile   = ()        => api.get('/profile')
export const getDatasets  = ()        => api.get('/datasets')
export const getFilterOpts= ()        => api.get('/filter-options')
export const getCharts    = (filters) => api.get('/visualizations', { params: filters ? { filters: JSON.stringify(filters) } : {} })
export const getSummary   = ()        => api.get('/summary')
export const sendChat     = (message) => api.post('/chat', { message })
export const clearChat    = ()        => api.delete('/chat/history')
export const resetAll     = ()        => api.delete('/reset')
export const activateDataset = (id)   => api.post(`/datasets/${id}/activate`)
