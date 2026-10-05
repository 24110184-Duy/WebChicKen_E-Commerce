import { useSyncExternalStore } from 'react'
import { cartApi } from '../../features/cart/api/cartApi'
import { authStore } from './authStore'

export interface CartItem {
  id?: string // Cart item ID in backend
  skuId: string
  productId: string
  name: string
  skuName?: string
  priceMinor: number
  imageUrl: string
  quantity: number
  storeId: string
  storeName: string
  selected: boolean
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
}

const STORAGE_KEY = 'webchicken_guest_cart'

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
}

let state: CartState = {
  items: loadFromStorage(),
  isLoading: false,
}

const listeners = new Set<() => void>()

function emitChange() {
  saveToStorage(state.items)
  listeners.forEach((listener) => listener())
}

export const cartStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  syncWithBackend: async () => {
    if (!authStore.getState().isAuthenticated) return
    state = { ...state, isLoading: true }
    emitChange()

    try {
      const backendCart = await cartApi.getCart()
      if (backendCart && backendCart.storeGroups) {
        const syncedItems: CartItem[] = []
        backendCart.storeGroups.forEach((group) => {
          group.items.forEach((item) => {
            syncedItems.push({
              id: item.itemId,
              skuId: item.variantId || item.itemId,
              productId: item.productId,
              name: item.productName,
              skuName: item.variantAttribute,
              priceMinor: item.currentPriceMinor,
              imageUrl: item.thumbnailUrl,
              quantity: item.quantity,
              storeId: group.storeId,
              storeName: group.storeName,
              selected: true,
            })
          })
        })
        state = { items: syncedItems, isLoading: false }
        emitChange()
      } else {
        state = { ...state, isLoading: false }
        emitChange()
      }
    } catch {
      state = { ...state, isLoading: false }
      emitChange()
    }
  },

  addItem: async (item: Omit<CartItem, 'selected'>) => {
    const existingIndex = state.items.findIndex((i) => i.skuId === item.skuId)
    let newItems: CartItem[]

    if (existingIndex > -1) {
      newItems = state.items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
      )
    } else {
      newItems = [...state.items, { ...item, selected: true }]
    }

    state = { ...state, items: newItems }
    emitChange()

    // Async sync with backend if authenticated
    if (authStore.getState().isAuthenticated) {
      cartApi.addItem(item.productId, item.skuId, item.quantity).catch(() => {})
    }
  },

  updateQuantity: async (skuId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(skuId)
      return
    }

    const item = state.items.find((i) => i.skuId === skuId)
    state = {
      ...state,
      items: state.items.map((i) => (i.skuId === skuId ? { ...i, quantity } : i)),
    }
    emitChange()

    if (authStore.getState().isAuthenticated && item?.id) {
      cartApi.updateQuantity(item.id, quantity).catch(() => {})
    }
  },

  removeItem: async (skuId: string) => {
    const item = state.items.find((i) => i.skuId === skuId)
    state = {
      ...state,
      items: state.items.filter((i) => i.skuId !== skuId),
    }
    emitChange()

    if (authStore.getState().isAuthenticated && item?.id) {
      cartApi.removeItem(item.id).catch(() => {})
    }
  },

  toggleSelect: (skuId: string) => {
    state = {
      ...state,
      items: state.items.map((i) => (i.skuId === skuId ? { ...i, selected: !i.selected } : i)),
    }
    emitChange()
  },

  toggleSelectStore: (storeId: string, selected: boolean) => {
    state = {
      ...state,
      items: state.items.map((i) => (i.storeId === storeId ? { ...i, selected } : i)),
    }
    emitChange()
  },

  toggleSelectAll: (selected: boolean) => {
    state = {
      ...state,
      items: state.items.map((i) => ({ ...i, selected })),
    }
    emitChange()
  },

  clearCart: async () => {
    state = { ...state, items: [] }
    emitChange()

    if (authStore.getState().isAuthenticated) {
      cartApi.clearCart().catch(() => {})
    }
  },
}

export function useCartStore() {
  const current = useSyncExternalStore(cartStore.subscribe, cartStore.getState, cartStore.getState)

  const selectedItems = current.items.filter((i) => i.selected)
  const totalQuantity = current.items.reduce((sum, i) => sum + i.quantity, 0)
  const selectedQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmountMinor = selectedItems.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0)

  // Gom nhóm items theo shop/gian hàng
  const itemsByStore = current.items.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [],
      }
    }
    acc[item.storeId].items.push(item)
    return acc
  }, {} as Record<string, { storeId: string; storeName: string; items: CartItem[] }>)

  return {
    items: current.items,
    isLoading: current.isLoading,
    selectedItems,
    itemsByStore: Object.values(itemsByStore),
    totalQuantity,
    selectedQuantity,
    totalAmountMinor,
    syncWithBackend: cartStore.syncWithBackend,
    addItem: cartStore.addItem,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    toggleSelect: cartStore.toggleSelect,
    toggleSelectStore: cartStore.toggleSelectStore,
    toggleSelectAll: cartStore.toggleSelectAll,
    clearCart: cartStore.clearCart,
  }
}
