import { useSyncExternalStore } from 'react'
import { cartApi } from '../../features/cart/api/cartApi'
import { authStore } from './authStore'
import { toast } from '../../components/feedback/Toast'

export interface CartItem {
  id?: string // Cart item ID in backend
  skuId: string
  productId: string
  name: string
  skuName?: string
  priceMinor: number
  imageUrl: string
  quantity: number
  availableStock?: number
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
  // Chỉ tải giỏ hàng nếu người dùng đã đăng nhập; khách chưa đăng nhập luôn có giỏ hàng rỗng
  if (!authStore.getState().isAuthenticated) {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
    return []
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    if (!authStore.getState().isAuthenticated) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
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
    if (!authStore.getState().isAuthenticated) {
      cartStore.resetCart()
      return
    }
    state = { ...state, isLoading: true }
    emitChange()

    try {
      const backendCart = await cartApi.getCart()
      if (backendCart && backendCart.storeGroups) {
        const syncedItems: CartItem[] = []
        backendCart.storeGroups.forEach((group) => {
          group.items.forEach((item) => {
            const stock = typeof item.availableStock === 'number' ? item.availableStock : 9999
            const adjustedQty = stock > 0 ? Math.min(item.quantity, stock) : item.quantity
            syncedItems.push({
              id: item.itemId,
              skuId: item.variantId || item.itemId,
              productId: item.productId,
              name: item.productName,
              skuName: item.variantAttribute,
              priceMinor: item.currentPriceMinor,
              imageUrl: item.thumbnailUrl,
              quantity: adjustedQty,
              availableStock: item.availableStock,
              storeId: group.storeId,
              storeName: group.storeName,
              selected: true,
            })
          })
        })

        if (syncedItems.length > 0) {
          state = { items: syncedItems, isLoading: false }
          emitChange()
        } else if (state.items.length === 0) {
          state = { items: [], isLoading: false }
          emitChange()
        } else {
          // If local items exist but backend returned empty (e.g. race condition),
          // preserve local items and push them to backend
          state = { ...state, isLoading: false }
          emitChange()
          for (const localItem of state.items) {
            const variantId = localItem.skuId !== localItem.productId ? localItem.skuId : undefined
            cartApi.addItem(localItem.productId, variantId, localItem.quantity).catch(() => {})
          }
        }
      } else {
        state = { ...state, isLoading: false }
        emitChange()
      }
    } catch {
      state = { ...state, isLoading: false }
      emitChange()
    }
  },

  resetCart: () => {
    state = { items: [], isLoading: false }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
    listeners.forEach((listener) => listener())
  },

  addItem: async (item: Omit<CartItem, 'selected'>): Promise<boolean> => {
    if (!authStore.getState().isAuthenticated) {
      return false
    }

    const existingIndex = state.items.findIndex((i) => i.skuId === item.skuId)
    let newItems: CartItem[]

    if (existingIndex > -1) {
      const existing = state.items[existingIndex]
      const maxStock = typeof existing.availableStock === 'number'
        ? existing.availableStock
        : (typeof item.availableStock === 'number' ? item.availableStock : 9999)
      const targetQty = existing.quantity + item.quantity
      if (targetQty > maxStock) {
        toast.warning(`Sản phẩm này chỉ còn tối đa ${maxStock} trong kho!`)
      }
      const newQuantity = Math.min(targetQty, maxStock)
      newItems = state.items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: newQuantity, selected: true } : i
      )
    } else {
      const maxStock = typeof item.availableStock === 'number' ? item.availableStock : 9999
      if (item.quantity > maxStock) {
        toast.warning(`Sản phẩm này chỉ còn tối đa ${maxStock} trong kho!`)
      }
      const newQuantity = Math.min(item.quantity, maxStock)
      newItems = [...state.items, { ...item, quantity: newQuantity, selected: true }]
    }

    state = { ...state, items: newItems }
    emitChange()

    // Sync with backend if authenticated
    if (authStore.getState().isAuthenticated) {
      try {
        const variantId = item.skuId !== item.productId ? item.skuId : undefined
        const backendCart = await cartApi.addItem(item.productId, variantId, item.quantity)
        if (backendCart && backendCart.storeGroups) {
          const syncedItems: CartItem[] = []
          backendCart.storeGroups.forEach((group) => {
            group.items.forEach((backendItem) => {
              syncedItems.push({
                id: backendItem.itemId,
                skuId: backendItem.variantId || backendItem.itemId,
                productId: backendItem.productId,
                name: backendItem.productName,
                skuName: backendItem.variantAttribute,
                priceMinor: backendItem.currentPriceMinor,
                imageUrl: backendItem.thumbnailUrl,
                quantity: backendItem.quantity,
                availableStock: backendItem.availableStock,
                storeId: group.storeId,
                storeName: group.storeName,
                selected: true,
              })
            })
          })
          if (syncedItems.length > 0) {
            state = { ...state, items: syncedItems }
            emitChange()
          }
        }
      } catch (err) {
        console.warn('Backend cart addItem error:', err)
      }
    }

    return true
  },

  updateQuantity: async (skuId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(skuId)
      return
    }

    const item = state.items.find((i) => i.skuId === skuId)
    if (!item) return

    const maxStock = typeof item.availableStock === 'number' ? item.availableStock : 9999
    if (quantity > maxStock) {
      toast.warning(`Sản phẩm "${item.name}" chỉ còn tối đa ${maxStock} trong kho!`)
    }
    const finalQuantity = Math.min(quantity, maxStock)

    state = {
      ...state,
      items: state.items.map((i) => (i.skuId === skuId ? { ...i, quantity: finalQuantity } : i)),
    }
    emitChange()

    if (authStore.getState().isAuthenticated && item?.id) {
      cartApi.updateQuantity(item.id, finalQuantity).catch((err) => {
        console.warn('Backend updateQuantity error:', err)
        cartStore.syncWithBackend()
      })
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
    resetCart: cartStore.resetCart,
  }
}

// Tự động lắng nghe thay đổi xác thực:
// - Khi người dùng đăng xuất: xóa sạch giỏ hàng trên UI và localStorage ngay lập tức
// - Khi người dùng đăng nhập: đồng bộ giỏ hàng từ backend
let prevAuthenticated = authStore.getState().isAuthenticated
authStore.subscribe(() => {
  const currentAuthenticated = authStore.getState().isAuthenticated
  if (!currentAuthenticated && prevAuthenticated) {
    cartStore.resetCart()
  } else if (currentAuthenticated && !prevAuthenticated) {
    cartStore.syncWithBackend()
  }
  prevAuthenticated = currentAuthenticated
})
