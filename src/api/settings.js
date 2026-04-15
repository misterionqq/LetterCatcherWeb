import api from './axios.js'

export const getServerInfo = () =>
  api.get('/settings/server-info').then((r) => r.data)
