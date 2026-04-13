import api from './axios.js'

export const addKeyword = (word) =>
  api.post('/keywords', { word }).then((r) => r.data)

export const addStopWord = (word) =>
  api.post('/keywords/stop', { word }).then((r) => r.data)

export const removeKeyword = (word) =>
  api.delete(`/keywords/${encodeURIComponent(word)}`).then((r) => r.data)
