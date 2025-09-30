// hooks/use-toast.ts
"use client"

import * as React from "react"

// Tipos locales (no dependemos de ui/toast)
type ToastActionElement = React.ReactNode
type ToastVariant = "default" | "destructive"

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: ToastVariant
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type Action =
  | { type: typeof actionTypes.ADD_TOAST; toast: ToasterToast }
  | { type: typeof actionTypes.UPDATE_TOAST; toast: Partial<ToasterToast> & { id: string } }
  | { type: typeof actionTypes.DISMISS_TOAST; toastId?: string }
  | { type: typeof actionTypes.REMOVE_TOAST; toastId?: string }

interface State { toasts: ToasterToast[] }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const listeners = new Set<(state: State) => void>()
let memoryState: State = { toasts: [] }

function genId() {
  return Math.random().toString(36).slice(2)
}

function dispatch(action: Action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST: {
      memoryState = {
        ...memoryState,
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      }
      break
    }
    case actionTypes.UPDATE_TOAST: {
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }
      break
    }
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action
      if (toastId) addToRemoveQueue(toastId)
      else memoryState.toasts.forEach((t) => addToRemoveQueue(t.id))
      break
    }
    case actionTypes.REMOVE_TOAST: {
      if (action.toastId) toastTimeouts.delete(action.toastId)
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
      }
      break
    }
  }
  listeners.forEach((l) => l(memoryState))
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  const toast = React.useCallback((props: Omit<ToasterToast, "id">) => {
    const id = genId()
    dispatch({ type: actionTypes.ADD_TOAST, toast: { id, ...props } })

    const update = (patch: Partial<ToasterToast>) =>
      dispatch({ type: actionTypes.UPDATE_TOAST, toast: { id, ...patch } })

    const dismiss = () =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

    return { id, update, dismiss }
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId })
  }, [])

  return { ...state, toast, dismiss }
}
