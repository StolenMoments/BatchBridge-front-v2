import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
})

// 공통 에러 처리
api.interceptors.response.use(
  res => res.data,
  err => {
    const error = err.response?.data?.error
    return Promise.reject(error || { code: 'UNKNOWN_ERROR', message: '알 수 없는 오류' })
  }
)

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

export default api