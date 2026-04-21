import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToast } from '@/composables/useToast.js'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const { toasts } = useToast()
    toasts.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a toast with default type "info"', () => {
    const { addToast, toasts } = useToast()
    addToast('Hello')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Hello')
    expect(toasts.value[0].type).toBe('info')
  })

  it('adds a toast with custom type', () => {
    const { addToast, toasts } = useToast()
    addToast('Error!', 'error')

    expect(toasts.value[0].type).toBe('error')
  })

  it('auto-removes toast after duration', () => {
    const { addToast, toasts } = useToast()
    addToast('Temporary', 'info', 2000)

    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })

  it('uses default duration of 4000ms', () => {
    const { addToast, toasts } = useToast()
    addToast('Default timing')

    vi.advanceTimersByTime(3999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('manually removes a toast by id', () => {
    const { addToast, removeToast, toasts } = useToast()
    addToast('First')
    addToast('Second')

    const firstId = toasts.value[0].id
    removeToast(firstId)

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Second')
  })

  it('assigns unique IDs', () => {
    const { addToast, toasts } = useToast()
    addToast('A')
    addToast('B')

    expect(toasts.value[0].id).not.toBe(toasts.value[1].id)
  })

  it('supports multiple toasts simultaneously', () => {
    const { addToast, toasts } = useToast()
    addToast('First', 'info', 1000)
    addToast('Second', 'error', 3000)

    expect(toasts.value).toHaveLength(2)

    vi.advanceTimersByTime(1000)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Second')

    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })
})
