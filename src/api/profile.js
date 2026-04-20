import api from './axios.js'

export const getProfile = () =>
  api.get('/profile').then((r) => r.data)

export const updateEmail = (email) =>
  api.put('/profile/email', { email }).then((r) => r.data)

export const setSensitivity = (level) =>
  api.put('/profile/sensitivity', { level }).then((r) => r.data)

export const toggleDnd = () =>
  api.post('/profile/dnd').then((r) => r.data)

export const getPendingDnd = () =>
  api.get('/profile/dnd/pending').then((r) => r.data)

export const registerDeviceToken = (token) =>
  api.post('/profile/device-token', { token, platform: 'android' }).then((r) => r.data)

export const removeDeviceToken = (token) =>
  api.delete('/profile/device-token', { data: { token } }).then((r) => r.data)

export const linkTelegram = () =>
  api.post('/profile/link-telegram').then((r) => r.data)
