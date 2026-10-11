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
  ArrowLeft,
  ShieldCheck,
  CheckCheck,
  PanelRight,
  User,
  ShoppingBag
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
  const [storeInfo, setStoreInfo] = useState<{ id?: string; storeName?: string; storeType?: string } | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'REPLIED'>('ALL')
  const [showInfoPane, setShowInfoPane] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1280)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      })
    }
  }

  // Thêm tin nhắn từ khách hàng mẫu để kiểm thử hỗ trợ đa khách hàng đồng thời
  const handleAddTestConversation = async () => {
    if (!storeId) return
    const samplePool = [
      { id: 'c0000000-0000-0000-0000-000000000001', name: 'Nguyễn Văn A', text: 'Shop ơi cho em hỏi sản phẩm này còn size L không ạ?' },
      { id: 'cust_mai_anh_02', name: 'Mai Anh', text: 'Dạ shop có hỗ trợ giao hỏa tốc trong 2 giờ tại TP.HCM không ạ?' },
      { id: 'cust_hoang_nam_03', name: 'Hoàng Nam', text: 'Đơn hàng của mình đang chuẩn bị hàng chưa shop ơi?' },
      { id: 'cust_le_thu_04', name: 'Lê Thu Trang', text: 'Chất liệu vải này giặt máy có bị co rút hay phai màu không shop?' }
    ]
    const existingIds = new Set(conversations.map((c) => c.customerId))
    const candidate = samplePool.find((item) => !existingIds.has(item.id)) || samplePool[0]

    try {
      await chatApi.sendMessage({
        storeId,
        customerId: candidate.id,
        content: candidate.text,
        role: 'customer'
      })
      await fetchConversations()
      setActiveCustomerId(candidate.id)
    } catch (err) {
      console.warn('Lỗi khi thêm hội thoại thử nghiệm:', err)
    }
  }

  // 1. Lấy thông tin Shop của Seller hiện tại
  useEffect(() => {
    sellerApi.getMyStore().then((store) => {
      if (store?.id) {
        setStoreId(store.id)
        setStoreInfo(store)
      } else if (user?.id) {
        // Fallback default store
        const fallback = { id: 's0000000-0000-0000-0000-000000000001', storeName: user.username || user.fullName || 'Gian Hàng Của Bạn' }
        setStoreId(fallback.id)
        setStoreInfo(fallback)
      }
    }).catch(() => {
      const fallback = { id: 's0000000-0000-0000-0000-000000000001', storeName: 'Gian Hàng Của Bạn' }
      setStoreId(fallback.id)
      setStoreInfo(fallback)
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
      // Đánh dấu đã đọc trên server và cập nhật local unread
      chatApi.markAsRead(storeId, activeCustomerId, 'seller')
      setConversations((prev) =>
        prev.map((c) => (c.customerId === activeCustomerId ? { ...c, unreadCount: 0 } : c))
      )
    } catch (err) {
      console.warn('Lỗi khi tải tin nhắn:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [storeId, activeCustomerId])

  useEffect(() => {
    if (!storeId || !activeCustomerId) return

    setMessagesLoading(true)
    fetchActiveMessages().then(() => scrollToBottom())

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

  // Quick replies chuẩn phong cách Shopee Seller Chat
  const quickReplies = [
    'Dạ shop chào bạn! Bạn cần tư vấn thêm về sản phẩm nào ạ?',
    'Dạ sản phẩm này shop đang còn sẵn hàng trong kho bạn nhé!',
    'Đơn hàng của bạn shop đang đóng gói cẩn thận và gửi ngay hôm nay ạ.',
    'Cảm ơn bạn đã tin tưởng và ủng hộ gian hàng của shop nhé!',
    'Bạn áp thêm voucher của shop tại trang thanh toán để được giảm giá nhé!'
  ]

  const activeConversation = conversations.find((c) => c.customerId === activeCustomerId)

  // Lọc danh bạ theo Search & Tab trạng thái
  const filteredConversations = conversations.filter((c) => {
    // 1. Lọc theo search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = c.customerName && c.customerName.toLowerCase().includes(q)
      const matchMsg = c.lastMessage && c.lastMessage.toLowerCase().includes(q)
      if (!matchName && !matchMsg) return false
    }
    // 2. Lọc theo tab
    if (activeFilter === 'UNREAD') {
      return (c.unreadCount || 0) > 0
    }
    if (activeFilter === 'REPLIED') {
      return c.lastSenderType === 'SELLER'
    }
    return true
  })

  // Sản phẩm gần nhất được khách hỏi
  const latestProductInquiry = messages
    .slice()
    .reverse()
    .find((m) => m.productName)

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  const currentStoreName = storeInfo?.storeName || user?.username || 'Gian Hàng Của Bạn'

  // Chuyển sang khách hàng khác
  const handleSelectCustomer = (cId: string) => {
    setActiveCustomerId(cId)
    // Tối ưu UI phản hồi ngay lập tức
    setConversations((prev) =>
      prev.map((c) => (c.customerId === cId ? { ...c, unreadCount: 0 } : c))
    )
  }

  return (
    <SellerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 1. Header Card Thống Kê Tổng Quan */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              to={PATHS.SELLER.DASHBOARD}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 8,
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Quay lại Kênh Người Bán"
            >
              <ArrowLeft size={14} />
              <span>Kênh Người Bán</span>
            </Link>

            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={18} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Trung Tâm Tin Nhắn Shopee Desk • {currentStoreName}
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
              <p style={{ fontSize: 12, color: '#64748b', margin: '1px 0 0 0' }}>
                Hỗ trợ đa khách hàng đồng thời, hiển thị đầy đủ danh tính Khách hàng và Gian hàng.
              </p>
            </div>
          </div>

          {/* Quick KPI stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                Tổng Khách Chat
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                {conversations.length}
              </span>
            </div>
            <div style={{ height: 24, width: 1, background: '#e2e8f0' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                Tỉ lệ phản hồi
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>
                100%
              </span>
            </div>
            <div style={{ height: 24, width: 1, background: '#e2e8f0' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                Tốc độ trả lời
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#d97706' }}>
                Dưới 3 phút
              </span>
            </div>
          </div>
        </div>

        {/* 2. Main Chat Panel (Shopee Split-Desk: Left Inbox + Middle Chat + Right Info) */}
        <div className={`seller-chat-card ${showInfoPane ? 'with-info' : ''}`}>
          {/* CỘT 1: Danh bạ hộp thư đến (Luôn luôn cố định bên trái, hỗ trợ nhiều khách nhắn đồng thời) */}
          <div className="seller-inbox-pane">
            <div className="seller-inbox-header">
              <div className="seller-inbox-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Hội thoại</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#f1f5f9',
                    color: '#475569',
                    padding: '1px 7px',
                    borderRadius: 9999
                  }}>
                    {conversations.length}
                  </span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleAddTestConversation}
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      color: '#b45309',
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                    title="Mô phỏng tin nhắn từ khách hàng mới để kiểm thử đa khách hàng"
                  >
                    <span>+ Khách mẫu</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchConversations}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Cập nhật danh bạ"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Tìm kiếm khách hàng */}
              <div className="seller-inbox-search">
                <Search className="seller-inbox-search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng hoặc tin..."
                  className="seller-inbox-search-input"
                />
              </div>
            </div>

            {/* Shopee Tabs Lọc: Tất cả / Chưa đọc / Đã phản hồi */}
            <div className="seller-inbox-tabs">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`seller-inbox-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
              >
                <span>Tất cả</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>({conversations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('UNREAD')}
                className={`seller-inbox-tab ${activeFilter === 'UNREAD' ? 'active' : ''}`}
              >
                <span>Chưa đọc</span>
                {totalUnreadCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 9999
                  }}>
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REPLIED')}
                className={`seller-inbox-tab ${activeFilter === 'REPLIED' ? 'active' : ''}`}
              >
                <span>Đã trả lời</span>
              </button>
            </div>

            {/* Danh sách các cuộc trò chuyện của nhiều khách hàng */}
            <div className="seller-inbox-list">
              {loading ? (
                <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                  <RefreshCw size={18} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Đang tải danh bạ khách hàng...</div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  <Store size={36} style={{ color: '#cbd5e1', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    {searchQuery ? 'Không tìm thấy khách hàng' : 'Chưa có cuộc trò chuyện nào'}
                  </p>
                  <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                    {searchQuery
                      ? 'Thử tìm với tên hoặc từ khóa khác.'
                      : 'Khi khách hàng bấm "Chat Ngay", hội thoại sẽ tự động xuất hiện tại đây.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = c.customerId === activeCustomerId
                  const initial = (c.customerName || 'U').charAt(0).toUpperCase()
                  return (
                    <div
                      key={c.customerId}
                      onClick={() => handleSelectCustomer(c.customerId)}
                      className={`seller-inbox-item ${isActive ? 'active' : ''}`}
                    >
                      {/* Avatar Khách Hàng kèm Chấm Trực Tuyến */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div className="seller-inbox-avatar" style={{
                          background: isActive
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                        }}>
                          {initial}
                        </div>
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid #ffffff'
                        }} />
                      </div>

                      <div className="seller-inbox-content">
                        <div className="seller-inbox-name-row">
                          <span className="seller-inbox-cust-name" style={{
                            fontWeight: c.unreadCount > 0 ? 800 : 700,
                            color: isActive ? '#b45309' : '#1e293b'
                          }}>
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
                            {c.lastSenderType === 'SELLER' ? (
                              <span style={{ color: '#94a3b8' }}>Bạn: </span>
                            ) : (
                              <span style={{ color: '#d97706', fontWeight: 600 }}>Khách: </span>
                            )}
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

          {/* CỘT 2: Khung chat chi tiết (Hiển thị đầy đủ thông tin Khách hàng & Shop của Seller) */}
          <div className="seller-chat-main">
            {!activeCustomerId ? (
              <div className="seller-chat-empty-state">
                <div className="seller-chat-empty-icon">
                  <MessageSquare size={32} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                  Chọn một cuộc trò chuyện để bắt đầu tư vấn
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, lineHeight: 1.5 }}>
                  Hệ thống hỗ trợ quản lý nhiều khách hàng cùng lúc chuẩn phong cách Shopee Chat Desk.
                </p>
              </div>
            ) : (
              <>
                {/* Header Kép: Bên trái là KHÁCH HÀNG, Bên phải là GIAN HÀNG CỦA SELLER */}
                <div className="seller-chat-main-header">
                  {/* Bên trái: Thông tin Khách Hàng (User Info) */}
                  <div className="seller-chat-main-user">
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)'
                      }}>
                        {(activeConversation?.customerName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 11,
                        height: 11,
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid #ffffff'
                      }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="seller-chat-main-name">
                          {activeConversation?.customerName || 'Khách hàng'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          background: '#dcfce7',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: 10.5,
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
                        <span>Đang trực tuyến • ID: #{activeCustomerId.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bên phải: Thông tin Gian Hàng Của Seller (Seller Store Info) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 12px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 10
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Store size={15} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{currentStoreName}</span>
                          <ShieldCheck size={13} color="#d97706" />
                        </div>
                        <div style={{ fontSize: 10.5, color: '#b45309', fontWeight: 600 }}>
                          Phản hồi 100% • Official Seller
                        </div>
                      </div>
                    </div>

                    {/* Nút Toggle Info Drawer */}
                    <button
                      type="button"
                      onClick={() => setShowInfoPane((prev) => !prev)}
                      style={{
                        background: showInfoPane ? '#fef3c7' : '#f8fafc',
                        border: `1px solid ${showInfoPane ? '#fde68a' : '#e2e8f0'}`,
                        borderRadius: 8,
                        padding: '7px 10px',
                        color: showInfoPane ? '#d97706' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600
                      }}
                      title="Bật/Tắt thông tin chi tiết Khách hàng & Shop"
                    >
                      <PanelRight size={15} />
                      <span>{showInfoPane ? 'Ẩn hồ sơ' : 'Xem hồ sơ'}</span>
                    </button>

                    {/* Nút Refresh tin nhắn */}
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
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                {/* Banner Sản phẩm khách đang quan tâm (nếu có) */}
                {latestProductInquiry && latestProductInquiry.productName && (
                  <div style={{
                    padding: '8px 20px',
                    background: '#fffbeb',
                    borderBottom: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{
                        padding: '2px 7px',
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
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid #fed7aa' }}
                        />
                      )}
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {latestProductInquiry.productName}
                      </span>
                      {latestProductInquiry.productPriceMinor !== undefined && (
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#d97706', whiteSpace: 'nowrap' }}>
                          {formatMoney(latestProductInquiry.productPriceMinor)}
                        </span>
                      )}
                    </div>

                    {latestProductInquiry.productId && (
                      <Link
                        to={`/products/${latestProductInquiry.productId}`}
                        target="_blank"
                        style={{
                          fontSize: 11.5,
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
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                )}

                {/* Messages Body (Hiện đầy đủ Avatar và Tên của cả Khách hàng và Seller) */}
                <div className="seller-chat-messages-area" ref={messagesContainerRef}>
                  {messagesLoading && messages.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', padding: '32px 0' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                      <div>Đang tải lịch sử trao đổi...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', padding: '32px 0' }}>
                      <p style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>Chưa có tin nhắn nào trong hội thoại này</p>
                      <p style={{ fontSize: 12 }}>Hãy gửi lời chào mở đầu để hỗ trợ khách hàng ngay nhé!</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSeller = m.senderType === 'SELLER'
                      const customerInitial = (activeConversation?.customerName || 'U').charAt(0).toUpperCase()

                      return (
                        <div
                          key={m.id}
                          className={`seller-msg-container ${isSeller ? 'sent' : 'received'}`}
                        >
                          {/* Avatar người gửi: Khách hàng (bên trái) hoặc Shop (bên phải) */}
                          <div
                            className="seller-msg-avatar"
                            style={{
                              background: isSeller
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                              color: '#ffffff'
                            }}
                          >
                            {isSeller ? <Store size={15} /> : customerInitial}
                          </div>

                          <div className="seller-msg-body">
                            {/* Nhãn Người Gửi Phân Biệt Rõ Ràng */}
                            <div className="seller-msg-sender-label">
                              {isSeller ? (
                                <>
                                  <span className="seller-msg-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                                    Gian hàng
                                  </span>
                                  <span>{currentStoreName}</span>
                                </>
                              ) : (
                                <>
                                  <span>{activeConversation?.customerName || 'Khách hàng'}</span>
                                  <span className="seller-msg-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                    Người mua
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Bong bóng tin nhắn */}
                            <div className="wck-msg-bubble">
                              {/* Card đính kèm sản phẩm nếu có */}
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

                            {/* Thời gian và trạng thái gửi */}
                            <div className="wck-msg-time">
                              <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isSeller && (
                                <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  <CheckCheck size={12} />
                                  <span>Đã gửi</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
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
                    placeholder={`Nhắn tin cho ${activeConversation?.customerName || 'khách hàng'} (nhấn Enter để gửi)...`}
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

          {/* CỘT 3: Panel Chi Tiết Thông Tin Khách Hàng & Gian Hàng (Shopee-Style Desk Drawer) */}
          {showInfoPane && activeCustomerId && (
            <div className="seller-chat-info-pane">
              {/* Mục 1: Hồ Sơ Khách Hàng */}
              <div className="seller-info-section">
                <div className="seller-info-section-title">
                  <User size={13} color="#3b82f6" />
                  <span>Hồ Sơ Người Mua</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(activeConversation?.customerName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {activeConversation?.customerName || 'Khách hàng'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                      <span>Đang trực tuyến trên sàn</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Vai trò:</span>
                    <strong style={{ color: '#0f172a' }}>Người mua thực tế</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Mã khách hàng:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{activeCustomerId.slice(0, 8)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Số tin đã trao đổi:</span>
                    <strong style={{ color: '#2563eb' }}>{messages.length} tin nhắn</strong>
                  </div>
                </div>
              </div>

              {/* Mục 2: Hồ Sơ Gian Hàng Của Bạn */}
              <div className="seller-info-section">
                <div className="seller-info-section-title">
                  <Store size={13} color="#f59e0b" />
                  <span>Gian Hàng Của Bạn</span>
                </div>

                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 10
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
                    {currentStoreName}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} color="#d97706" />
                    <span>Gian hàng đối tác WebChicken Mall</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tỷ lệ phản hồi chat:</span>
                    <strong style={{ color: '#059669' }}>100%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thời gian phản hồi:</span>
                    <strong style={{ color: '#d97706' }}>Vài phút</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mã Store:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{storeId.slice(0, 8)}</strong>
                  </div>
                </div>
              </div>

              {/* Mục 3: Sản phẩm đang hỏi (nếu có) */}
              {latestProductInquiry && latestProductInquiry.productName && (
                <div className="seller-info-section">
                  <div className="seller-info-section-title">
                    <ShoppingBag size={13} color="#059669" />
                    <span>Sản Phẩm Đang Trao Đổi</span>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    {latestProductInquiry.productImage && (
                      <img
                        src={latestProductInquiry.productImage}
                        alt={latestProductInquiry.productName}
                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }}
                      />
                    )}
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {latestProductInquiry.productName}
                    </div>
                    {latestProductInquiry.productPriceMinor !== undefined && (
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#d97706' }}>
                        {formatMoney(latestProductInquiry.productPriceMinor)}
                      </div>
                    )}
                    {latestProductInquiry.productId && (
                      <Link
                        to={`/products/${latestProductInquiry.productId}`}
                        target="_blank"
                        style={{
                          fontSize: 12,
                          color: '#2563eb',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4
                        }}
                      >
                        <span>Mở xem chi tiết trên sàn</span>
                        <ExternalLink size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Mục 4: Quy Chuẩn Tư Vấn Shopee */}
              <div className="seller-info-section" style={{ borderBottom: 'none' }}>
                <div style={{
                  padding: '10px 12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  fontSize: 11.5,
                  color: '#166534',
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>💡 Mẹo bán hàng Shopee:</div>
                  Phản hồi khách trong vòng 5 phút giúp tăng 40% tỷ lệ chốt đơn và nâng cao điểm vận hành gian hàng.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  )
}

export default SellerChatPage
