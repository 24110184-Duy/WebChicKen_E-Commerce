import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Send,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Store,
  UserCheck,
  ArrowLeft
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { PATHS } from '../../app/router/paths'
import { sellerApi } from '../../features/seller/api/sellerApi'
import { chatApi } from '../../features/shop/api/chatApi'
import type { ChatMessage, ChatConversation } from '../../features/shop/types/chatTypes'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useAuthStore } from '../../app/store/authStore'
import { Link } from 'react-router-dom'

export const SellerChatPage: React.FC = () => {
  const { user } = useAuthStore()
  const [storeId, setStoreId] = useState<string>('')
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 1. Lấy thông tin Shop của Seller hiện tại
  useEffect(() => {
    sellerApi.getMyStore().then((store) => {
      if (store?.id) {
        setStoreId(store.id)
      } else if (user?.id) {
        // Fallback default store
        setStoreId('s0000000-0000-0000-0000-000000000001')
      }
    }).catch(() => {
      setStoreId('s0000000-0000-0000-0000-000000000001')
    })
  }, [user])

  // 2. Lấy danh bạ hội thoại của shop
  const fetchConversations = useCallback(async () => {
    if (!storeId) return
    try {
      const list = await chatApi.getConversations('seller', storeId)
      setConversations(list)

      // Nếu chưa chọn khách nào và có ít nhất 1 hội thoại, tự động chọn khách đầu tiên
      if (!activeCustomerId && list.length > 0) {
        setActiveCustomerId(list[0].customerId)
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh bạ hội thoại:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId, activeCustomerId])

  useEffect(() => {
    if (!storeId) return
    fetchConversations()

    // Poll danh bạ mỗi 5 giây
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [storeId, fetchConversations])

  // 3. Lấy tin nhắn của khách đang được chọn
  const fetchActiveMessages = useCallback(async () => {
    if (!storeId || !activeCustomerId) return
    try {
      const msgs = await chatApi.getMessages(storeId, activeCustomerId, 'seller')
      setMessages(msgs)
      // Đánh dấu đã đọc
      chatApi.markAsRead(storeId, activeCustomerId, 'seller')
    } catch (err) {
      console.warn('Lỗi khi tải tin nhắn:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [storeId, activeCustomerId])

  useEffect(() => {
    if (!storeId || !activeCustomerId) return

    setMessagesLoading(true)
    fetchActiveMessages().then(scrollToBottom)

    // Poll tin nhắn mỗi 3 giây
    const interval = setInterval(fetchActiveMessages, 3000)
    return () => clearInterval(interval)
  }, [storeId, activeCustomerId, fetchActiveMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 4. Gửi tin nhắn trả lời khách hàng
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || !storeId || !activeCustomerId || sending) return

    const content = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      const created = await chatApi.sendMessage({
        storeId,
        customerId: activeCustomerId,
        content,
        role: 'seller',
      })

      if (created) {
        setMessages((prev) => [...prev, created])
        fetchConversations()
      }
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err)
    } finally {
      setSending(false)
    }
  }

  // Quick replies
  const quickReplies = [
    'Dạ shop chào bạn! Bạn cần tư vấn thêm về sản phẩm nào ạ?',
    'Dạ sản phẩm này shop đang còn sẵn hàng trong kho bạn nhé!',
    'Đơn hàng của bạn shop đang đóng gói cẩn thận và gửi bưu tá ngay trong hôm nay ạ.',
    'Cảm ơn bạn đã tin tưởng và ủng hộ gian hàng của shop nhé!'
  ]

  const activeConversation = conversations.find((c) => c.customerId === activeCustomerId)
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.customerName && c.customerName.toLowerCase().includes(q)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    )
  })

  // Sản phẩm gần nhất được khách hỏi
  const latestProductInquiry = messages
    .slice()
    .reverse()
    .find((m) => m.productName)

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  return (
    <SellerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 1. Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Nút Quay Lại Kênh Người Bán */}
            <Link
              to={PATHS.SELLER.DASHBOARD}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Quay lại Kênh Người Bán"
            >
              <ArrowLeft size={16} />
              <span>Quay lại Kênh Người Bán</span>
            </Link>

            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={22} />
            </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Chăm sóc Khách hàng & Tin nhắn
              </h1>
              {totalUnreadCount > 0 && (
                <span style={{
                  padding: '2px 8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 9999
                }}>
                  {totalUnreadCount} tin mới
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
              Giải đáp thắc mắc về sản phẩm và chốt đơn nhanh chóng với người mua hàng trên ChickyMart.
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Hội thoại
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              {conversations.length}
            </span>
          </div>
          <div style={{ height: 32, width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Tỉ lệ phản hồi
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
              99.8%
            </span>
          </div>
          <div style={{ height: 32, width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Tốc độ
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>
              Vài phút
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Panel (Split View: Conversations List + Chat Window) */}
      <div className="seller-chat-card">
        {/* CỘT TRÁI: Danh bạ hội thoại */}
        <div className="seller-inbox-pane">
          <div className="seller-inbox-header">
            <div className="seller-inbox-title">
              <span>Hộp thư đến ({conversations.length})</span>
            </div>
            <div className="seller-inbox-search">
              <Search className="seller-inbox-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng hoặc tin nhắn..."
                className="seller-inbox-search-input"
              />
            </div>
          </div>

          {/* Danh sách các cuộc trò chuyện */}
          <div className="seller-inbox-list">
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                Đang tải danh bạ...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                <Store size={36} style={{ color: '#cbd5e1', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Chưa có tin nhắn nào
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                  Khi khách hàng bấm "Chat Ngay" hoặc gửi câu hỏi, hội thoại sẽ lập tức xuất hiện tại đây.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.customerId === activeCustomerId
                return (
                  <div
                    key={c.customerId}
                    onClick={() => setActiveCustomerId(c.customerId)}
                    className={`seller-inbox-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="seller-inbox-avatar">
                      {(c.customerName || 'U').charAt(0).toUpperCase()}
                    </div>

                    <div className="seller-inbox-content">
                      <div className="seller-inbox-name-row">
                        <span className="seller-inbox-cust-name">
                          {c.customerName || 'Khách hàng'}
                        </span>
                        {c.lastMessageAt && (
                          <span className="seller-inbox-cust-time">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="seller-inbox-preview-row">
                        <p className={`seller-inbox-preview-text ${c.unreadCount > 0 ? 'unread' : ''}`}>
                          {c.lastSenderType === 'SELLER' && <span style={{ color: '#94a3b8' }}>Shop: </span>}
                          {c.lastMessage || 'Bắt đầu cuộc trao đổi'}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="wck-conv-unread">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Khung chat chi tiết */}
        <div className="seller-chat-main">
          {!activeCustomerId ? (
            <div className="seller-chat-empty-state">
              <div className="seller-chat-empty-icon">
                <MessageSquare size={32} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                Chọn một cuộc trò chuyện để bắt đầu
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, lineHeight: 1.5 }}>
                Xem lịch sử trò chuyện, tư vấn sản phẩm và giải đáp trực tiếp cho khách hàng.
              </p>
            </div>
          ) : (
            <>
              {/* Header của phòng chat */}
              <div className="seller-chat-main-header">
                <div className="seller-chat-main-user">
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    color: '#d97706',
                    fontWeight: 800,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(activeConversation?.customerName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="seller-chat-main-name">
                        {activeConversation?.customerName || 'Khách hàng'}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: '#dcfce7',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: 10,
                        borderRadius: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <UserCheck size={11} />
                        Người mua thực tế
                      </span>
                    </div>
                    <div className="seller-chat-main-meta">
                      <span className="wck-chat-online-dot" />
                      <span>Đang trực tuyến trên WebChicKen</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={fetchActiveMessages}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: 8,
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Làm mới tin nhắn"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Banner Sản phẩm khách đang quan tâm (nếu có) */}
              {latestProductInquiry && latestProductInquiry.productName && (
                <div style={{
                  padding: '10px 24px',
                  background: '#fffbeb',
                  borderBottom: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{
                      padding: '2px 8px',
                      background: '#fde68a',
                      color: '#b45309',
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 4
                    }}>
                      ĐANG HỎI
                    </span>
                    {latestProductInquiry.productImage && (
                      <img
                        src={latestProductInquiry.productImage}
                        alt={latestProductInquiry.productName}
                        style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1px solid #fed7aa' }}
                      />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {latestProductInquiry.productName}
                    </span>
                    {latestProductInquiry.productPriceMinor !== undefined && (
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#d97706', whiteSpace: 'nowrap' }}>
                        {formatMoney(latestProductInquiry.productPriceMinor)}
                      </span>
                    )}
                  </div>

                  {latestProductInquiry.productId && (
                    <Link
                      to={`/products/${latestProductInquiry.productId}`}
                      target="_blank"
                      style={{
                        fontSize: 12,
                        color: '#d97706',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0
                      }}
                    >
                      <span>Xem sản phẩm</span>
                      <ExternalLink size={13} />
                    </Link>
                  )}
                </div>
              )}

              {/* Messages Body */}
              <div className="seller-chat-messages-area">
                {messagesLoading && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', padding: '32px 0' }}>
                    Đang tải lịch sử trao đổi...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', padding: '32px 0' }}>
                    Chưa có tin nhắn nào trong hội thoại này.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSeller = m.senderType === 'SELLER'
                    return (
                      <div
                        key={m.id}
                        className={`wck-msg-row ${isSeller ? 'sent' : 'received'}`}
                      >
                        <div className="wck-msg-bubble">
                          {/* Card đính kèm sản phẩm */}
                          {m.productName && (
                            <div className="wck-msg-card">
                              {m.productImage && (
                                <img
                                  src={m.productImage}
                                  alt={m.productName}
                                  className="wck-msg-card-img"
                                />
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {m.productName}
                                </div>
                                {m.productPriceMinor !== undefined && (
                                  <div style={{ fontWeight: 800, fontSize: 12, color: '#d97706', marginTop: 2 }}>
                                    {formatMoney(m.productPriceMinor)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div>{m.content}</div>
                        </div>

                        <div className="wck-msg-time">
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isSeller && <span style={{ color: '#059669', fontWeight: 600 }}>• Đã gửi</span>}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Chips */}
              <div className="seller-quick-replies">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Sparkles size={14} color="#f59e0b" />
                  Gợi ý trả lời nhanh:
                </span>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(qr)}
                    className="seller-quick-pill"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="seller-chat-input-bar">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập câu trả lời cho khách hàng (nhấn Enter để gửi)..."
                  disabled={sending}
                  className="seller-chat-textarea"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="seller-chat-submit-btn"
                >
                  <Send size={15} />
                  <span>Gửi</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  </SellerLayout>
  )
}

export default SellerChatPage
