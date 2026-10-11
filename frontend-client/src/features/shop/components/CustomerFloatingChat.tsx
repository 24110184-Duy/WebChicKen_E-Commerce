import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  Store,
  ChevronDown,
  ShoppingBag,
  CheckCheck
} from 'lucide-react'
import { useChatStore } from '../../../app/store/chatStore'
import { useAuthStore } from '../../../app/store/authStore'
import { chatApi } from '../api/chatApi'
import type { ChatMessage, ChatConversation } from '../types/chatTypes'
import { formatMoney } from '../../../shared/lib/formatMoney'
import { Link } from 'react-router-dom'

export const CustomerFloatingChat: React.FC = () => {
  const {
    isOpen,
    activeStoreId,
    activeStoreName,
    activeProduct,
    unreadTotal,
    closeChat,
    toggleChat,
    selectStore,
    clearActiveStore,
    clearActiveProduct,
    setUnreadTotal,
  } = useChatStore()

  const { user } = useAuthStore()

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Poll tổng số tin chưa đọc định kỳ mỗi 10 giây
  useEffect(() => {
    if (!user) return

    const fetchUnread = async () => {
      try {
        const count = await chatApi.getUnreadCount('customer')
        setUnreadTotal(count)
      } catch {
        // im lặng nếu có lỗi
      }
    }

    fetchUnread()
    const timer = setInterval(fetchUnread, 10000)
    return () => clearInterval(timer)
  }, [user, setUnreadTotal])

  // Lấy danh bạ các cuộc hội thoại khi chat mở và chưa chọn store cụ thể
  const fetchConversations = useCallback(async () => {
    if (!user) return
    try {
      const convs = await chatApi.getConversations('customer')
      setConversations(convs)
    } catch {
      // im lặng nếu có lỗi
    }
  }, [user])

  useEffect(() => {
    if (isOpen && !activeStoreId && user) {
      fetchConversations()
    }
  }, [isOpen, activeStoreId, user, fetchConversations])

  // Tải tin nhắn của cuộc trò chuyện hiện tại và poll mỗi 3 giây
  const fetchCurrentMessages = useCallback(async () => {
    if (!activeStoreId || !user) return
    try {
      const msgs = await chatApi.getMessages(activeStoreId, user.id, 'customer')
      setMessages(msgs)
      // Đánh dấu đã đọc
      chatApi.markAsRead(activeStoreId, user.id, 'customer')
    } catch {
      // im lặng nếu có lỗi
    }
  }, [activeStoreId, user])

  useEffect(() => {
    if (!isOpen || !activeStoreId || !user) return

    setLoading(true)
    fetchCurrentMessages().finally(() => {
      setLoading(false)
      scrollToBottom()
    })

    const timer = setInterval(() => {
      fetchCurrentMessages()
    }, 3000)

    return () => clearInterval(timer)
  }, [isOpen, activeStoreId, user, fetchCurrentMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || !activeStoreId || !user || sending) return

    const textToSend = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    try {
      const created = await chatApi.sendMessage({
        storeId: activeStoreId,
        content: textToSend,
        role: 'customer',
      })

      if (created) {
        setMessages((prev) => [...prev, created])
      }
    } catch (err) {
      console.error('Không thể gửi tin nhắn:', err)
    } finally {
      setSending(false)
    }
  }

  const handleSendProductInquiry = async () => {
    if (!activeProduct || !activeStoreId || !user || sending) return

    setSending(true)
    try {
      const created = await chatApi.sendMessage({
        storeId: activeStoreId,
        content: `Tôi đang quan tâm đến sản phẩm: ${activeProduct.name || ''}`,
        productId: activeProduct.id,
        productName: activeProduct.name,
        productImage: activeProduct.image,
        productPriceMinor: activeProduct.priceMinor,
        role: 'customer',
      })

      if (created) {
        setMessages((prev) => [...prev, created])
        clearActiveProduct()
      }
    } catch (err) {
      console.error('Lỗi khi gửi thông tin sản phẩm:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* 1. Nút Chat nổi cố định góc dưới bên phải */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleChat}
          className="wck-chat-fab"
          title="Trò chuyện cùng Người bán"
          id="btn-customer-floating-chat"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageCircle size={20} />
            {unreadTotal > 0 && (
              <span className="wck-chat-badge">
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </div>
          <span>Chat</span>
        </button>
      )}

      {/* 2. Cửa sổ Chat Popup (Shopee-style) */}
      {isOpen && (
        <div className="wck-chat-window" id="popup-customer-chat">
          {/* Header */}
          <div className="wck-chat-header">
            <div className="wck-chat-header-info">
              {activeStoreId ? (
                <button
                  type="button"
                  onClick={clearActiveStore}
                  className="wck-chat-back-btn"
                  title="Quay lại danh bạ gian hàng"
                >
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <Store size={20} style={{ flexShrink: 0 }} />
              )}

              <div style={{ minWidth: 0 }}>
                <div className="wck-chat-header-title">
                  {activeStoreId ? (activeStoreName || 'Gian hàng') : 'ChickyMart Chat'}
                </div>
                <div className="wck-chat-header-sub">
                  <span className="wck-chat-online-dot" />
                  <span>{activeStoreId ? 'Đang hoạt động' : 'Tư vấn trực tiếp với Shop'}</span>
                </div>
              </div>
            </div>

            <div className="wck-chat-header-actions">
              <button
                type="button"
                onClick={closeChat}
                className="wck-chat-icon-btn"
                title="Thu nhỏ"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                onClick={closeChat}
                className="wck-chat-icon-btn"
                title="Đóng chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="wck-chat-body">
            {!user ? (
              // Trạng thái chưa đăng nhập
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <MessageCircle size={28} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  Đăng nhập để trò chuyện
                </h4>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 18, maxWidth: 240, lineHeight: 1.5 }}>
                  Vui lòng đăng nhập để trao đổi tin nhắn và nhận tư vấn trực tiếp từ các gian hàng nhé!
                </p>
                <Link
                  to="/login"
                  onClick={closeChat}
                  style={{
                    padding: '8px 20px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : !activeStoreId ? (
              // Màn hình 1: Danh bạ hội thoại các shop
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 12px', background: '#fffbeb', borderBottom: '1px solid #fef3c7', fontSize: 11, fontWeight: 600, color: '#b45309' }}>
                  Hội thoại gian hàng ({conversations.length})
                </div>

                {conversations.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                    <Store size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Chưa có cuộc trò chuyện nào
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', maxWidth: 220, lineHeight: 1.5 }}>
                      Bấm vào nút <strong>"Chat Ngay"</strong> trên thẻ Shop tại trang chi tiết sản phẩm để bắt đầu trò chuyện nhé!
                    </p>
                  </div>
                ) : (
                  <div>
                    {conversations.map((c) => (
                      <div
                        key={c.storeId}
                        onClick={() => selectStore(c.storeId, c.storeName)}
                        className="wck-conv-item"
                      >
                        <div className="wck-conv-avatar">
                          {(c.storeName || 'S').charAt(0).toUpperCase()}
                        </div>

                        <div className="wck-conv-info">
                          <div className="wck-conv-name">
                            <span>{c.storeName || 'Gian hàng'}</span>
                            {c.lastMessageAt && (
                              <span className="wck-conv-time">
                                {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p className="wck-conv-preview">
                              {c.lastSenderType === 'CUSTOMER' && <span style={{ color: '#94a3b8' }}>Bạn: </span>}
                              {c.lastMessage || 'Bắt đầu trao đổi...'}
                            </p>
                            {c.unreadCount > 0 && (
                              <span className="wck-conv-unread">
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Màn hình 2: Khung chat chi tiết với gian hàng đã chọn
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Floating Product Inquiry Banner nếu đang xem từ trang sản phẩm */}
                {activeProduct && (
                  <div className="wck-chat-product-banner">
                    {activeProduct.image ? (
                      <img
                        src={activeProduct.image}
                        alt={activeProduct.name}
                        className="wck-chat-product-img"
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fde68a', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="wck-chat-product-meta">
                      <div className="wck-chat-product-name">{activeProduct.name}</div>
                      {activeProduct.priceMinor !== undefined && (
                        <div className="wck-chat-product-price">{formatMoney(activeProduct.priceMinor)}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSendProductInquiry}
                      disabled={sending}
                      className="wck-chat-send-product-btn"
                    >
                      Hỏi Shop
                    </button>
                    <button
                      type="button"
                      onClick={clearActiveProduct}
                      className="wck-chat-banner-close-btn"
                      title="Ẩn thông tin sản phẩm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Messages Stream */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <div style={{ textAlign: 'center', margin: '4px 0' }}>
                    <span style={{ fontSize: 10, background: '#e2e8f0', color: '#64748b', padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>
                      Bảo mật tin nhắn chuẩn ChickyMart
                    </span>
                  </div>

                  {loading && messages.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', padding: '24px 0' }}>
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', padding: '24px 0', lineHeight: 1.6 }}>
                      Chưa có tin nhắn nào.<br />Hãy gửi lời chào đầu tiên đến gian hàng nhé!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderType === 'CUSTOMER'
                      return (
                        <div
                          key={m.id}
                          className={`wck-msg-row ${isMe ? 'sent' : 'received'}`}
                        >
                          <div className="wck-msg-bubble">
                            {/* Khối card sản phẩm nhúng kèm tin nhắn */}
                            {m.productName && (
                              <div className="wck-msg-card">
                                {m.productImage ? (
                                  <img
                                    src={m.productImage}
                                    alt={m.productName}
                                    className="wck-msg-card-img"
                                  />
                                ) : (
                                  <div style={{ width: 44, height: 44, borderRadius: 6, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ShoppingBag size={18} />
                                  </div>
                                )}
                                <div className="wck-msg-card-meta">
                                  <div className="wck-msg-card-title" title={m.productName}>
                                    {m.productName}
                                  </div>
                                  {m.productPriceMinor !== undefined && (
                                    <div className="wck-msg-card-price">
                                      {formatMoney(m.productPriceMinor)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="wck-msg-content">{m.content}</div>
                          </div>

                          <div className="wck-msg-time">
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck size={12} color="#f59e0b" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Input Footer khi đang ở trong phòng chat */}
          {user && activeStoreId && (
            <form onSubmit={handleSendMessage} className="wck-chat-footer">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập nội dung trao đổi với Shop..."
                disabled={sending}
                className="wck-chat-input"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="wck-chat-send-btn"
                title="Gửi"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}

export default CustomerFloatingChat
