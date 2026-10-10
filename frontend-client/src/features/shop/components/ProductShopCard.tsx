import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  MessageSquare,
  Send,
  X,
} from 'lucide-react'
import { shopApi } from '../api/shopApi'
import { catalogApi } from '../../catalog/api/catalogApi'
import type { StoreInfo } from '../types/shopTypes'
import { formatMoney } from '../../../shared/lib/formatMoney'

export interface ProductShopCardProps {
  storeId?: string
  initialStoreName?: string
  productId?: string
  productName?: string
  productImage?: string
  productPrice?: number
}

interface ChatMessage {
  id: string
  sender: 'shop' | 'buyer'
  text: string
  time: string
  isProductCard?: boolean
}

export const ProductShopCard: React.FC<ProductShopCardProps> = ({
  storeId,
  initialStoreName,
  productName,
  productImage,
  productPrice,
}) => {
  const navigate = useNavigate()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [productCount, setProductCount] = useState<number>(24)
  const [loading, setLoading] = useState<boolean>(true)

  // Live Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchStoreData = async () => {
      setLoading(true)
      if (storeId) {
        try {
          const [storeData, productsRes] = await Promise.all([
            shopApi.getStoreById(storeId),
            catalogApi.getProducts({ storeId, size: 1 }),
          ])

          if (isMounted) {
            if (storeData) setStore(storeData)
            if (productsRes && typeof productsRes.total === 'number' && productsRes.total > 0) {
              setProductCount(productsRes.total)
            }
          }
        } catch {
          // Fallback handled gracefully
        }
      }
      if (isMounted) setLoading(false)
    }

    fetchStoreData()

    return () => {
      isMounted = false
    }
  }, [storeId])

  // Initialize chat greeting when chat is first opened
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages([
        {
          id: 'welcome',
          sender: 'shop',
          text: `Xin chào! Cảm ơn bạn đã quan tâm đến gian hàng của chúng mình. Bạn cần hỗ trợ thêm thông tin gì về "${productName || 'sản phẩm này'}" không ạ?`,
          time: timeStr,
        },
      ])
    }
  }, [isChatOpen, messages.length, productName])

  const storeName = store?.storeName || initialStoreName || 'ChickyMall Official'
  const isMall = store?.storeType === 'ADMIN' || store?.storeType === 'MALL'

  // Format joined duration
  const getJoinedDuration = () => {
    if (!store?.createdAt) return '9 tháng trước'
    try {
      const created = new Date(store.createdAt)
      const now = new Date()
      const diffMonths = Math.max(1, Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      if (diffMonths >= 12) {
        const years = Math.floor(diffMonths / 12)
        return `${years} năm trước`
      }
      return `${diffMonths} tháng trước`
    } catch {
      return '6 tháng trước'
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim()) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const buyerMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'buyer',
      text: inputMessage.trim(),
      time: timeStr,
    }

    setMessages((prev) => [...prev, buyerMsg])
    setInputMessage('')

    // Simulated automated assistant response from shop
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const autoReply: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'shop',
        text: 'Cảm ơn tin nhắn của bạn! Nhân viên chăm sóc khách hàng của shop sẽ phản hồi lại ngay trong ít phút nhé.',
        time: replyTime,
      }
      setMessages((prev) => [...prev, autoReply])
    }, 900)
  }

  const handleSendProductCard = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const productCardMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'buyer',
      text: `Hỏi về sản phẩm: ${productName || ''}`,
      time: timeStr,
      isProductCard: true,
    }
    setMessages((prev) => [...prev, productCardMsg])

    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const autoReply: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'shop',
        text: `Dạ sản phẩm "${productName || ''}" hiện đang còn sẵn hàng trong kho với mức giá ưu đãi nhất, shop đóng gói và gửi hàng ngay hôm nay bạn nhé!`,
        time: replyTime,
      }
      setMessages((prev) => [...prev, autoReply])
    }, 1000)
  }

  const handleViewShop = () => {
    if (storeId) {
      navigate(`/search?storeId=${storeId}`)
    } else {
      navigate('/search')
    }
  }

  if (loading) {
    return (
      <div className="pdp-shop-card" style={{ opacity: 0.7 }}>
        <div className="pdp-shop-left">
          <div className="pdp-shop-avatar-wrapper">
            <div className="pdp-shop-avatar" style={{ background: '#f1f5f9', border: 'none' }} />
          </div>
          <div className="pdp-shop-details">
            <div style={{ height: 18, width: 150, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 14, width: 80, background: '#f1f5f9', borderRadius: 4 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Shopee-style Shop Profile Card */}
      <div className="pdp-shop-card">
        {/* Left Column: Avatar & Brand Info */}
        <div className="pdp-shop-left">
          <div className="pdp-shop-avatar-wrapper">
            <div className="pdp-shop-avatar">
              <span className="pdp-shop-avatar-letter">{storeName.charAt(0).toUpperCase()}</span>
            </div>
            <div className={`pdp-shop-badge ${isMall ? 'mall' : 'favorite'}`}>
              {isMall ? 'Mall' : 'Yêu thích+'}
            </div>
          </div>

          <div className="pdp-shop-details">
            <h3 className="pdp-shop-name" onClick={handleViewShop} title={storeName}>
              {storeName}
            </h3>
            <div className="pdp-shop-status">
              <span className="pdp-shop-online-dot" />
              <span>Online</span>
            </div>

            <div className="pdp-shop-actions">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="pdp-shop-btn pdp-shop-btn-chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Ngay</span>
              </button>

              <button
                type="button"
                onClick={handleViewShop}
                className="pdp-shop-btn pdp-shop-btn-view"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Xem Shop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Divider Line */}
        <div className="pdp-shop-divider" />

        {/* Right Column: Statistics Grid (2 rows x 3 columns) */}
        <div className="pdp-shop-right">
          <div className="pdp-shop-grid">
            {/* Row 1 */}
            <div className="pdp-shop-stat-item">
              <span className="pdp-shop-stat-label">Đánh Giá</span>
              <span className="pdp-shop-stat-value">32,8k</span>
            </div>

            <div className="pdp-shop-stat-item">
              <span className="pdp-shop-stat-label">Tỉ Lệ Phản Hồi</span>
              <span className="pdp-shop-stat-value">98%</span>
            </div>

            <div className="pdp-shop-stat-item">
              <span className="pdp-shop-stat-label">Tham Gia</span>
              <span className="pdp-shop-stat-value">{getJoinedDuration()}</span>
            </div>

            {/* Row 2 */}
            <div className="pdp-shop-stat-item">
              <span className="pdp-shop-stat-label">Sản Phẩm</span>
              <span className="pdp-shop-stat-value">{productCount}</span>
            </div>

            <div className="pdp-shop-stat-item">
              <span className="pdp-shop-stat-label">Thời Gian Phản Hồi</span>
              <span className="pdp-shop-stat-value">trong vài giờ</span>
            </div>

            <div className="pdp-shop-stat-item">
              <span className="pdp-shop-stat-label">Người Theo Dõi</span>
              <span className="pdp-shop-stat-value">8,3k</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shopee-style Live Web Mini-Chat Popup */}
      {isChatOpen && (
        <div className="pdp-chat-popup">
          {/* Chat Header */}
          <div className="pdp-chat-header">
            <div className="pdp-chat-header-info">
              <div className="pdp-chat-header-avatar">
                {storeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="pdp-chat-header-title">{storeName}</div>
                <div className="pdp-chat-header-status">
                  <span className="pdp-shop-online-dot" />
                  <span>Đang hoạt động</span>
                </div>
              </div>
            </div>

            <div className="pdp-chat-header-tools">
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="pdp-chat-close-btn"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Floating Banner in Chat */}
          {productName && (
            <div className="pdp-chat-product-banner">
              {productImage && (
                <img
                  src={productImage}
                  alt={productName}
                  className="pdp-chat-product-thumb"
                />
              )}
              <div className="pdp-chat-product-info">
                <div className="pdp-chat-product-name">{productName}</div>
                {productPrice !== undefined && (
                  <div className="pdp-chat-product-price">
                    {formatMoney(productPrice)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSendProductCard}
                className="pdp-chat-send-product-btn"
              >
                Gửi sản phẩm
              </button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="pdp-chat-body">
            <div className="pdp-chat-date-pill">Hôm nay</div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`pdp-chat-msg-row ${m.sender === 'buyer' ? 'buyer' : 'shop'}`}
              >
                {m.sender === 'shop' && (
                  <div className="pdp-chat-msg-avatar">
                    {storeName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="pdp-chat-msg-bubble-wrap">
                  <div className={`pdp-chat-bubble ${m.sender === 'buyer' ? 'buyer' : 'shop'}`}>
                    {m.isProductCard ? (
                      <div className="pdp-chat-embedded-product">
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>
                          SẢN PHẨM QUAN TÂM
                        </div>
                        <div style={{ fontWeight: 600 }}>{productName}</div>
                        {productPrice !== undefined && (
                          <div style={{ color: '#ee4d2d', fontWeight: 800, marginTop: 2 }}>
                            {formatMoney(productPrice)}
                          </div>
                        )}
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                  <span className="pdp-chat-time">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Footer */}
          <form onSubmit={handleSendMessage} className="pdp-chat-footer">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn để tư vấn với Shop..."
              className="pdp-chat-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="pdp-chat-send-btn"
              title="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
export default ProductShopCard
