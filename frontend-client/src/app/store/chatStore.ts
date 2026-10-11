import { useSyncExternalStore } from 'react'

export interface ChatProductContext {
  id?: string
  name?: string
  image?: string
  priceMinor?: number
}

interface ChatState {
  isOpen: boolean
  activeStoreId: string | null
  activeStoreName: string | null
  activeProduct: ChatProductContext | null
  unreadTotal: number
}

let state: ChatState = {
  isOpen: false,
  activeStoreId: null,
  activeStoreName: null,
  activeProduct: null,
  unreadTotal: 0,
}

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export const chatStore = {
  getState: () => state,

  open: (storeId?: string, storeName?: string, product?: ChatProductContext) => {
    state = {
      ...state,
      isOpen: true,
      activeStoreId: storeId ?? state.activeStoreId,
      activeStoreName: storeName ?? state.activeStoreName,
      activeProduct: product ?? state.activeProduct,
    }
    emit()
  },

  selectStore: (storeId: string, storeName?: string) => {
    state = {
      ...state,
      activeStoreId: storeId,
      activeStoreName: storeName || 'Gian hàng',
    }
    emit()
  },

  clearActiveStore: () => {
    state = {
      ...state,
      activeStoreId: null,
      activeStoreName: null,
      activeProduct: null,
    }
    emit()
  },

  clearActiveProduct: () => {
    state = {
      ...state,
      activeProduct: null,
    }
    emit()
  },

  close: () => {
    state = { ...state, isOpen: false }
    emit()
  },

  toggle: () => {
    state = { ...state, isOpen: !state.isOpen }
    emit()
  },

  setUnreadTotal: (count: number) => {
    if (state.unreadTotal !== count) {
      state = { ...state, unreadTotal: count }
      emit()
    }
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useChatStore() {
  const currentState = useSyncExternalStore(chatStore.subscribe, chatStore.getState)
  return {
    isOpen: currentState.isOpen,
    activeStoreId: currentState.activeStoreId,
    activeStoreName: currentState.activeStoreName,
    activeProduct: currentState.activeProduct,
    unreadTotal: currentState.unreadTotal,
    openChat: chatStore.open,
    selectStore: chatStore.selectStore,
    clearActiveStore: chatStore.clearActiveStore,
    clearActiveProduct: chatStore.clearActiveProduct,
    closeChat: chatStore.close,
    toggleChat: chatStore.toggle,
    setUnreadTotal: chatStore.setUnreadTotal,
  }
}
