import api from './axios.js'

export const getHistory = (limit = 50) =>
  api.get('/emails/history', { params: { limit } }).then((r) => r.data)

export const getStats = () =>
  api.get('/emails/stats').then((r) => r.data)
