import api from './axios.js'

export const register = (email, password) =>
  api.post('/auth/web/register', { email, password }).then((r) => r.data)

export const login = (email, password) =>
  api.post('/auth/web/login', { email, password }).then((r) => r.data)

export const telegramLogin = (widgetData) =>
  api.post('/auth/token', widgetData).then((r) => r.data)

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, new_password: newPassword }).then((r) => r.data)

export const verifyEmail = (token) =>
  api.get('/auth/verify-email', { params: { token } }).then((r) => r.data)

export const verifyEmailChange = (token) =>
  api.get('/auth/verify-email-change', { params: { token } }).then((r) => r.data)

export const resendVerification = () =>
  api.post('/auth/resend-verification').then((r) => r.data)
