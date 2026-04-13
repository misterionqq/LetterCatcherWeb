import api from './axios.js'

export const getHealth = () =>
  api.get('/health').then((r) => r.data)
