import api from './axios.js'

export const register = (email, password) =>
  api.post('/auth/web/register', { email, password }).then((r) => r.data)

export const login = (email, password) =>
  api.post('/auth/web/login', { email, password }).then((r) => r.data)

export const telegramLogin = (telegramId) =>
  api.post('/auth/token', { telegram_id: telegramId, telegram_hash: 'web' }).then((r) => r.data)
