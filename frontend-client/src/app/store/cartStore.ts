import { useSyncExternalStore } from 'react'

export interface CartItem {
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

  addItem: (item: Omit<CartItem, 'selected'>) => {
    const existingIndex = state.items.findIndex((i) => i.skuId === item.skuId)
    let newItems: CartItem[]

    if (existingIndex > -1) {
      newItems = state.items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
      )
    } else {
      newItems = [...state.items, { ...item, selected: true }]
    }

    state = { items: newItems }
    emitChange()
  },

  updateQuantity: (skuId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(skuId)
      return
    }
    state = {
      items: state.items.map((i) => (i.skuId === skuId ? { ...i, quantity } : i)),
    }
    emitChange()
  },

  removeItem: (skuId: string) => {
    state = {
      items: state.items.filter((i) => i.skuId !== skuId),
    }
    emitChange()
  },

  toggleSelect: (skuId: string) => {
    state = {
      items: state.items.map((i) => (i.skuId === skuId ? { ...i, selected: !i.selected } : i)),
    }
    emitChange()
  },

  toggleSelectStore: (storeId: string, selected: boolean) => {
    state = {
      items: state.items.map((i) => (i.storeId === storeId ? { ...i, selected } : i)),
    }
    emitChange()
  },

  toggleSelectAll: (selected: boolean) => {
    state = {
      items: state.items.map((i) => ({ ...i, selected })),
    }
    emitChange()
  },

  clearCart: () => {
    state = { items: [] }
    emitChange()
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
    selectedItems,
    itemsByStore: Object.values(itemsByStore),
    totalQuantity,
    selectedQuantity,
    totalAmountMinor,
    addItem: cartStore.addItem,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    toggleSelect: cartStore.toggleSelect,
    toggleSelectStore: cartStore.toggleSelectStore,
    toggleSelectAll: cartStore.toggleSelectAll,
    clearCart: cartStore.clearCart,
  }
}
