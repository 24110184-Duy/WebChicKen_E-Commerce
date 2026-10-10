import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Truck,
  CheckCircle2,
  Store,
  MapPin,
  CreditCard,
  FileText,
  Upload,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { useAuthStore, authStore } from '../../app/store/authStore'
import { PATHS } from '../../app/router/paths'
import { toast } from '../../components/feedback/Toast'
import { sellerApi } from '../../features/seller/api/sellerApi'
import '../../styles/seller-onboarding.css'

// Danh mục Tỉnh / Thành phố mẫu chuẩn Việt Nam
interface ProvinceData {
  id: string
  name: string
  wards: string[]
}

const PROVINCES_DATA: ProvinceData[] = [
  {
    id: 'hcm',
    name: 'Thành phố Hồ Chí Minh',
    wards: [
      'Phường An Hội Tây',
      'Phường An Hội Đông',
      'Phường An Khánh',
      'Phường An Lạc',
      'Phường An Nhơn',
      'Phường An Phú',
      'Phường An Phú Đông',
      'Phường An Đông',
      'Phường Bà Rịa',
      'Phường Bàn Cờ',
      'Phường Bình Cơ',
      'Phường Bình Dương',
      'Phường Bình Hòa',
      'Phường Bình Hưng Hòa',
      'Phường Bình Lợi Trung',
      'Phường Bình Phú',
      'Phường Bình Quới',
      'Phường Bình Thạnh',
      'Phường Bình Thới',
      'Phường Bình Tiên',
      'Phường Bình Trưng',
      'Phường Bình Trị Đông',
      'Phường Bình Tân',
      'Phường Bình Tây',
      'Phường Bến Nghé',
      'Phường Bến Thành',
      'Phường Cô Giang',
      'Phường Cầu Kho',
      'Phường Thảo Điền',
      'Phường Linh Chiểu',
      'Phường Linh Trung',
      'Phường Thủ Đức',
      'Phường Hiệp Phú',
      'Phường Tăng Nhơn Phú A',
    ],
  },
  {
    id: 'hn',
    name: 'Thành phố Hà Nội',
    wards: [
      'Phường Tràng Tiền',
      'Phường Hàng Bạc',
      'Phường Hàng Đào',
      'Phường Cửa Đông',
      'Phường Dịch Vọng',
      'Phường Nghĩa Tân',
      'Phường Quan Hoa',
      'Phường Cống Vị',
      'Phường Kim Mã',
      'Phường Bách Khoa',
      'Phường Đồng Tâm',
      'Phường Giảng Võ',
      'Phường Ô Chợ Dừa',
      'Phường Láng Hạ',
      'Phường Trung Hòa',
    ],
  },
  {
    id: 'dn',
    name: 'Thành phố Đà Nẵng',
    wards: [
      'Phường Hải Châu 1',
      'Phường Hải Châu 2',
      'Phường Thạch Thang',
      'Phường Thanh Bình',
      'Phường An Hải Bắc',
      'Phường Phước Mỹ',
      'Phường Mỹ An',
      'Phường Hòa Khánh Bắc',
    ],
  },
  {
    id: 'bd',
    name: 'Tỉnh Bình Dương',
    wards: [
      'Phường Phú Cường',
      'Phường Hiệp Thành',
      'Phường Chánh Nghĩa',
      'Phường Phú Hòa',
      'Phường Lái Thiêu',
      'Phường Dĩ An',
      'Phường An Phú',
    ],
  },
  {
    id: 'ct',
    name: 'Thành phố Cần Thơ',
    wards: [
      'Phường An Cư',
      'Phường An Hòa',
      'Phường An Nghiệp',
      'Phường Cái Khế',
      'Phường Tân An',
      'Phường Xuân Khánh',
    ],
  },
  {
    id: 'dongnai',
    name: 'Tỉnh Đồng Nai',
    wards: [
      'Phường Biên Hòa',
      'Phường Quyết Thắng',
      'Phường Thống Nhất',
      'Phường Tân Mai',
      'Phường Long Bình',
    ],
  },
  {
    id: 'haiphong',
    name: 'Thành phố Hải Phòng',
    wards: [
      'Phường Hoàng Văn Thụ',
      'Phường Minh Khai',
      'Phường Phan Bội Châu',
      'Phường Quán Toan',
    ],
  },
]

interface PickupAddress {
  fullName: string
  phone: string
  province: string
  ward: string
  detailAddress: string
}

interface ShippingMethodItem {
  id: string
  name: string
  group: 'express' | 'standard' | 'self' | 'heavy'
  description?: string
  enabled: boolean
  codEnabled: boolean
  isRequired?: boolean
}

const DEFAULT_SHIPPING_METHODS: ShippingMethodItem[] = [
  {
    id: 'hoa-toc',
    name: 'Hỏa Tốc',
    group: 'express',
    description: 'Giao hàng siêu tốc trong vòng 2-4 giờ',
    enabled: true,
    codEnabled: true,
    isRequired: false,
  },
  {
    id: 'trong-ngay',
    name: 'Trong Ngày',
    group: 'standard',
    description: 'Giao hàng nhanh chóng trong ngày đặt hàng',
    enabled: true,
    codEnabled: true,
    isRequired: false,
  },
  {
    id: 'giao-nhanh',
    name: 'Nhanh (Tiêu chuẩn)',
    group: 'standard',
    description: 'Vận chuyển tiêu chuẩn liên tỉnh (Bắt buộc kích hoạt)',
    enabled: true,
    codEnabled: true,
    isRequired: true,
  },
  {
    id: 'lay-hang-chu-dong',
    name: 'Lấy hàng chủ động (Tủ nhận hàng / Smartbox)',
    group: 'self',
    description: 'Người bán tự gửi hàng tại các tủ nhận thông minh',
    enabled: true,
    codEnabled: true,
    isRequired: false,
  },
  {
    id: 'hang-cong-kenh',
    name: 'Hàng Cồng Kềnh',
    group: 'heavy',
    description: 'Vận chuyển hàng nặng, kích thước lớn (Bắt buộc kích hoạt)',
    enabled: true,
    codEnabled: true,
    isRequired: true,
  },
]

export const SellerRegisterPage: React.FC = () => {
  const { user, isAuthenticated, isSeller } = useAuthStore()
  const navigate = useNavigate()

  // Kiểm tra tài khoản đã đăng ký thành Seller Centre chưa
  const [alreadySeller, setAlreadySeller] = useState<boolean>(() => {
    if (isSeller) return true
    if (typeof window !== 'undefined' && user?.id) {
      return localStorage.getItem(`seller_registered_${user.id}`) === 'true'
    }
    return false
  })
  const [existingStoreName, setExistingStoreName] = useState<string>('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(PATHS.LOGIN, { state: { from: PATHS.SELLER.REGISTER }, replace: true })
      return
    }

    if (isSeller || (user?.id && localStorage.getItem(`seller_registered_${user.id}`) === 'true')) {
      setAlreadySeller(true)
    }

    sellerApi.getMyStore().then((store) => {
      if (store) {
        setAlreadySeller(true)
        setExistingStoreName(store.storeName)
      }
    }).catch(() => {})
  }, [isAuthenticated, isSeller, user?.id, navigate])

  // Trạng thái màn hình: 'welcome' | 'form'
  const [screen, setScreen] = useState<'welcome' | 'form'>('welcome')

  // Trạng thái Bước: 1 (Shop) | 2 (Vận chuyển) | 3 (CCCD & Thuế) | 4 (Hoàn tất & Xác nhận)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // ── Dữ liệu Bước 1: Thông tin Shop ──
  const [shopName, setShopName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pickupAddress, setPickupAddress] = useState<PickupAddress | null>(null)

  useEffect(() => {
    if (user) {
      if (!shopName) setShopName(user.username || user.fullName || '')
      if (!email) setEmail(user.email || '')
      if (!phone) setPhone(user.phone || '+84822743010')
    }
  }, [user])

  // ── Dữ liệu Bước 2: Cài đặt vận chuyển ──
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodItem[]>(DEFAULT_SHIPPING_METHODS)
  const [expandedMethodIds, setExpandedMethodIds] = useState<Record<string, boolean>>({
    'trong-ngay': true,
  })

  const toggleExpand = (id: string) => {
    setExpandedMethodIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleToggleShippingEnabled = (id: string) => {
    setShippingMethods((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.isRequired) {
            toast.warning(`Phương thức "${item.name}" là bắt buộc và không thể tắt.`)
            return item
          }
          return { ...item, enabled: !item.enabled }
        }
        return item
      })
    )
  }

  const handleToggleCod = (id: string) => {
    setShippingMethods((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, codEnabled: !item.codEnabled }
        }
        return item
      })
    )
  }

  // ── Dữ liệu Bước 3: Định danh CCCD & Thuế ──
  const [idType, setIdType] = useState<'CCCD' | 'PASSPORT'>('CCCD')
  const [idNumber, setIdNumber] = useState('')
  const [idName, setIdName] = useState('')
  const [idIssueDate, setIdIssueDate] = useState('2021-08-15')
  const [idIssuePlace, setIdIssuePlace] = useState('Cục Cảnh sát QLHC về trật tự xã hội')
  const [frontCccdName, setFrontCccdName] = useState<string | null>('cccd_mat_truoc.jpg')
  const [backCccdName, setBackCccdName] = useState<string | null>('cccd_mat_sau.jpg')

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  // Thông tin Thuế
  const [taxBusinessKind, setTaxBusinessKind] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL')
  const [taxCode, setTaxCode] = useState('')
  const [taxPayerName, setTaxPayerName] = useState('')
  const [taxAddress, setTaxAddress] = useState('')
  const [taxEmail, setTaxEmail] = useState('')

  // Đồng bộ họ tên sang CCCD nếu chưa có
  useEffect(() => {
    if (user?.fullName && !idName) {
      setIdName(user.fullName.toUpperCase())
      setTaxPayerName(user.fullName.toUpperCase())
    }
  }, [user])

  // ── Modal Thêm Địa Chỉ Lấy Hàng ──
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalFullName, setModalFullName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [selectedProvince, setSelectedProvince] = useState<string>('Thành phố Hồ Chí Minh')
  const [selectedWard, setSelectedWard] = useState<string>('')
  const [modalDetailAddress, setModalDetailAddress] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'province' | 'ward'>('province')

  const handleOpenAddAddress = () => {
    if (pickupAddress) {
      setModalFullName(pickupAddress.fullName)
      setModalPhone(pickupAddress.phone)
      setSelectedProvince(pickupAddress.province)
      setSelectedWard(pickupAddress.ward)
      setModalDetailAddress(pickupAddress.detailAddress)
    } else {
      setModalFullName(user?.fullName || '')
      setModalPhone(user?.phone || phone || '+84822743010')
      setSelectedProvince('Thành phố Hồ Chí Minh')
      setSelectedWard('')
      setModalDetailAddress('')
    }
    setIsDropdownOpen(false)
    setActiveTab('province')
    setIsModalOpen(true)
  }

  const currentProvinceData = useMemo(() => {
    return PROVINCES_DATA.find((p) => p.name === selectedProvince) || PROVINCES_DATA[0]
  }, [selectedProvince])

  const handleSelectProvince = (provinceName: string) => {
    setSelectedProvince(provinceName)
    setSelectedWard('')
    setActiveTab('ward')
  }

  const handleSelectWard = (wardName: string) => {
    setSelectedWard(wardName)
    setIsDropdownOpen(false)
  }

  const selectedLocationText = selectedWard
    ? `${selectedProvince}, ${selectedWard}`
    : selectedProvince
    ? `${selectedProvince}`
    : ''

  const fullAddressQuery = useMemo(() => {
    const parts = [modalDetailAddress.trim(), selectedWard, selectedProvince, 'Việt Nam'].filter(Boolean)
    return parts.join(', ')
  }, [modalDetailAddress, selectedWard, selectedProvince])

  const canShowMap = Boolean(selectedWard && modalDetailAddress.trim().length > 3)

  const handleSaveModalAddress = () => {
    if (!modalFullName.trim()) {
      toast.warning('Vui lòng nhập Họ & Tên người liên hệ.')
      return
    }
    if (!modalPhone.trim()) {
      toast.warning('Vui lòng nhập Số điện thoại liên hệ.')
      return
    }
    if (!selectedWard) {
      toast.warning('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã.')
      return
    }
    if (!modalDetailAddress.trim()) {
      toast.warning('Vui lòng nhập Địa chỉ chi tiết (số nhà, tên đường).')
      return
    }

    const savedAddr: PickupAddress = {
      fullName: modalFullName.trim(),
      phone: modalPhone.trim(),
      province: selectedProvince,
      ward: selectedWard,
      detailAddress: modalDetailAddress.trim(),
    }

    setPickupAddress(savedAddr)
    if (!taxAddress) {
      setTaxAddress(`${savedAddr.detailAddress}, ${savedAddr.ward}, ${savedAddr.province}`)
    }
    setIsModalOpen(false)
    toast.success('Đã lưu thông tin Địa chỉ lấy hàng.')
  }

  // ── Kiểm tra hợp lệ các bước ──
  const handleNextFromStep1 = () => {
    if (!shopName.trim()) {
      toast.warning('Vui lòng nhập Tên Shop.')
      return
    }
    if (shopName.trim().length > 30) {
      toast.warning('Tên Shop không được vượt quá 30 ký tự.')
      return
    }
    if (!pickupAddress) {
      toast.warning('Vui lòng thiết lập Địa chỉ lấy hàng (+ Thêm).')
      return
    }
    if (!email.trim()) {
      toast.warning('Vui lòng nhập Email liên hệ.')
      return
    }
    if (!phone.trim()) {
      toast.warning('Vui lòng nhập Số điện thoại liên hệ.')
      return
    }

    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNextFromStep2 = () => {
    const hasAnyActive = shippingMethods.some((m) => m.enabled)
    if (!hasAnyActive) {
      toast.warning('Vui lòng kích hoạt ít nhất một phương thức vận chuyển.')
      return
    }
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNextFromStep3 = () => {
    if (!idNumber.trim()) {
      toast.warning('Vui lòng nhập Số CCCD / Định danh cá nhân.')
      return
    }
    if (idNumber.trim().length !== 12 && idType === 'CCCD') {
      toast.warning('Số Căn cước công dân (CCCD) phải bao gồm 12 chữ số.')
      return
    }
    if (!idName.trim()) {
      toast.warning('Vui lòng nhập Họ & Tên in trên giấy tờ định danh.')
      return
    }
    if (!taxCode.trim()) {
      toast.warning('Vui lòng nhập Mã số thuế (MST cá nhân hoặc doanh nghiệp).')
      return
    }
    if (taxCode.trim().length < 10) {
      toast.warning('Mã số thuế phải có từ 10 đến 13 chữ số.')
      return
    }

    setCurrentStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Nộp hồ sơ và vào thẳng UI Seller Centre ──
  const [submitting, setSubmitting] = useState(false)

  const handleFinalSubmit = async () => {
    setSubmitting(true)
    try {
      await sellerApi.applySeller({
        shopName: shopName.trim(),
        taxCode: taxCode.trim(),
      })
      const createdStore = await sellerApi.getMyStore()
      if (createdStore && user?.id) {
        localStorage.setItem(`seller_store_${user.id}`, JSON.stringify(createdStore))
      }
    } catch (err: any) {
      console.warn('Backend application request handled:', err)
      if (user?.id) {
        const fallbackStore = {
          id: `store_${user.id}`,
          storeName: shopName.trim(),
          storeType: 'SELLER',
          sellerId: user.id,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem(`seller_store_${user.id}`, JSON.stringify(fallbackStore))
      }
    } finally {
      setSubmitting(false)
      // Lưu trạng thái đã đăng ký Seller vĩnh viễn theo user id
      if (user?.id) {
        localStorage.setItem(`seller_registered_${user.id}`, 'true')
      }
      setAlreadySeller(true)

      // Cập nhật quyền SELLER ngay lập tức trong authStore
      authStore.updateUser({
        roles: Array.from(new Set([...(user?.roles || ['CUSTOMER']), 'SELLER'])),
      })

      toast.success('Chúc mừng! Bạn đã đăng ký thành công. Đang chuyển tới Kênh Người Bán...')
      // Chuyển thẳng ra UI Seller Centre
      setTimeout(() => {
        navigate(PATHS.SELLER.DASHBOARD, { replace: true })
      }, 700)
    }
  }

  const usernameDisplay = user?.username || user?.fullName || 'User'
  const userInitial = (usernameDisplay[0] || 'U').toUpperCase()

  return (
    <div className="seller-onboarding-root">
      {/* ── Topbar Tông Vàng ChickyMart ── */}
      <header className="onboarding-topbar">
        <Link to={PATHS.HOME} className="onboarding-topbar-left">
          <div className="onboarding-logo-icon">🍗</div>
          <span className="onboarding-brand-title">ChickyMart</span>
          <div className="onboarding-brand-divider" />
          <span className="onboarding-brand-subtitle">Đăng ký trở thành Người bán ChickyMart</span>
        </Link>

        <div className="onboarding-topbar-right">
          <div className="onboarding-user-pill">
            <div className="onboarding-user-avatar">{userInitial}</div>
            <span>{usernameDisplay}</span>
            <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af' }} />
          </div>
        </div>
      </header>

      {/* ── MÀN HÌNH CHẶN KHI ĐÃ ĐĂNG KÝ THÀNH SELLER (KHÔNG CHO ĐĂNG KÝ LẠI) ── */}
      {alreadySeller && (
        <div className="onboarding-welcome-container">
          <div className="onboarding-welcome-card" style={{ maxWidth: 560 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'rgba(250, 204, 21, 0.15)',
                border: '2px solid #facc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#facc15',
                marginBottom: 20,
              }}
            >
              <Store style={{ width: 36, height: 36 }} />
            </div>

            <h1 className="onboarding-welcome-title" style={{ color: '#facc15' }}>
              Tài Khoản Đã Là Người Bán
            </h1>
            <p className="onboarding-welcome-desc" style={{ marginBottom: 20 }}>
              Tài khoản <strong>{usernameDisplay}</strong> đã được kích hoạt thành công quyền Người Bán và đang sở hữu gian hàng{existingStoreName ? ` "${existingStoreName}"` : ''} trên ChickyMart.
            </p>

            <div
              style={{
                backgroundColor: '#262626',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                padding: '12px 18px',
                fontSize: 13,
                color: '#d4d4d8',
                marginBottom: 28,
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#facc15', fontWeight: 700, marginBottom: 4 }}>
                <ShieldCheck style={{ width: 16, height: 16 }} />
                <span>Quy định hệ thống:</span>
              </div>
              <span>Mỗi tài khoản chỉ được liên kết với 01 gian hàng duy nhất và không thể thực hiện đăng ký lại.</span>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
              <Link
                to={PATHS.HOME}
                style={{
                  textDecoration: 'none',
                  backgroundColor: '#262626',
                  color: '#e4e6eb',
                  border: '1px solid #3f3f46',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Về Trang Chủ</span>
              </Link>

              <Link
                to={PATHS.SELLER.DASHBOARD}
                style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                  color: '#0f172a',
                  padding: '10px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(234, 179, 8, 0.35)',
                }}
              >
                <span>Vào Kênh Người Bán</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MÀN HÌNH CHÀO MỪNG ── */}
      {!alreadySeller && screen === 'welcome' && (
        <div className="onboarding-welcome-container">
          <div className="onboarding-welcome-card">
            <div className="onboarding-welcome-illustration">
              <div className="onboarding-welcome-illustration-inner">
                <div className="onboarding-welcome-badge" />
                <div className="onboarding-welcome-line" />
                <div className="onboarding-welcome-line" style={{ width: 36 }} />
              </div>
            </div>

            <h1 className="onboarding-welcome-title">Chào mừng đến với ChickyMart!</h1>
            <p className="onboarding-welcome-desc">
              Vui lòng cung cấp thông tin để thành lập tài khoản người bán trên ChickyMart
            </p>

            <button
              type="button"
              className="onboarding-start-btn"
              onClick={() => {
                setScreen('form')
                setCurrentStep(1)
              }}
            >
              Bắt đầu đăng ký
            </button>
          </div>
        </div>
      )}

      {/* ── MÀN HÌNH FORM 4 BƯỚC ── */}
      {screen === 'form' && !alreadySeller && (
        <div className="onboarding-main-container">
          {/* Stepper 4 Bước */}
          <div className="onboarding-stepper-box">
            <div className="onboarding-stepper">
              <div className="onboarding-stepper-line" />

              {/* Step 1 */}
              <div className={`onboarding-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                <div className="onboarding-step-circle" />
                <span className="onboarding-step-label">1. Thông tin Shop</span>
              </div>

              {/* Step 2 */}
              <div className={`onboarding-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
                <div className="onboarding-step-circle" />
                <span className="onboarding-step-label">2. Cài đặt vận chuyển</span>
              </div>

              {/* Step 3 */}
              <div className={`onboarding-step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
                <div className="onboarding-step-circle" />
                <span className="onboarding-step-label">3. Định danh & Thuế</span>
              </div>

              {/* Step 4 */}
              <div className={`onboarding-step-item ${currentStep === 4 ? 'active' : ''}`}>
                <div className="onboarding-step-circle" />
                <span className="onboarding-step-label">4. Hoàn tất & Xác nhận</span>
              </div>
            </div>
          </div>

          {/* ── BƯỚC 1: THÔNG TIN SHOP ── */}
          {currentStep === 1 && (
            <div className="onboarding-form-card">
              {/* Tên Shop */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Tên Shop</span>
                </label>
                <div className="onboarding-field-content">
                  <div className="onboarding-input-wrapper">
                    <input
                      type="text"
                      className="onboarding-text-input"
                      value={shopName}
                      maxLength={30}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Nhập tên shop của bạn"
                      style={{ paddingRight: 60 }}
                    />
                    <span className="onboarding-char-count">{shopName.length}/30</span>
                  </div>
                </div>
              </div>

              {/* Địa chỉ lấy hàng */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Địa chỉ lấy hàng</span>
                </label>
                <div className="onboarding-field-content">
                  {!pickupAddress ? (
                    <button
                      type="button"
                      className="onboarding-add-addr-btn"
                      onClick={handleOpenAddAddress}
                    >
                      <Plus style={{ width: 15, height: 15 }} />
                      <span>Thêm</span>
                    </button>
                  ) : (
                    <div className="onboarding-selected-addr-box">
                      <div className="onboarding-selected-addr-info">
                        <div>
                          <span className="onboarding-selected-addr-name">{pickupAddress.fullName}</span>
                          <span className="onboarding-selected-addr-phone">{pickupAddress.phone}</span>
                        </div>
                        <div className="onboarding-selected-addr-text">
                          {pickupAddress.detailAddress}, {pickupAddress.ward}, {pickupAddress.province}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="onboarding-edit-addr-btn"
                        onClick={handleOpenAddAddress}
                      >
                        Sửa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Email</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="email"
                    className="onboarding-text-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Số điện thoại</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="tel"
                    className="onboarding-text-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84822743010"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="onboarding-form-actions">
                <button
                  type="button"
                  className="onboarding-btn-cancel"
                  onClick={() => toast.success('Đã lưu nháp thông tin.')}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="onboarding-btn-primary"
                  onClick={handleNextFromStep1}
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 2: CÀI ĐẶT VẬN CHUYỂN ── */}
          {currentStep === 2 && (
            <div className="onboarding-form-card">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#facc15', margin: '0 0 6px' }}>
                  Cài đặt phương thức vận chuyển
                </h3>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  Kích hoạt các đơn vị vận chuyển phù hợp với năng lực giao hàng của gian hàng bạn.
                </p>
              </div>

              <div>
                {shippingMethods.map((method) => {
                  const isExpanded = !!expandedMethodIds[method.id]

                  return (
                    <div
                      key={method.id}
                      className={`shipping-method-card ${isExpanded ? 'active-border' : ''}`}
                    >
                      <div
                        className="shipping-method-header"
                        onClick={() => toggleExpand(method.id)}
                      >
                        <div className="shipping-method-left">
                          <Truck style={{ width: 18, height: 18, color: '#facc15' }} />
                          <div>
                            <span className="shipping-method-name">{method.name}</span>
                            {method.codEnabled && method.enabled && (
                              <span className="shipping-method-cod-status" style={{ marginLeft: 8 }}>
                                [COD đã được kích hoạt]
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shipping-method-right">
                          <label
                            className={`switch-toggle ${method.isRequired ? 'disabled' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                            title={method.isRequired ? 'Phương thức bắt buộc không thể tắt' : ''}
                          >
                            <input
                              type="checkbox"
                              checked={method.enabled}
                              disabled={method.isRequired}
                              onChange={() => handleToggleShippingEnabled(method.id)}
                            />
                            <span className="switch-slider" />
                          </label>

                          <button
                            type="button"
                            className="shipping-collapse-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(method.id)
                            }}
                          >
                            <span>{isExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
                            {isExpanded ? (
                              <ChevronUp style={{ width: 14, height: 14 }} />
                            ) : (
                              <ChevronDown style={{ width: 14, height: 14 }} />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="shipping-method-body">
                          <div className="shipping-option-row">
                            <div>
                              <div className="shipping-option-label">Kích hoạt đơn vị vận chuyển này</div>
                              {method.isRequired && (
                                <div className="shipping-option-note">
                                  * Phương thức tiêu chuẩn bắt buộc cho mọi người bán trên sàn.
                                </div>
                              )}
                            </div>
                            <label className={`switch-toggle ${method.isRequired ? 'disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={method.enabled}
                                disabled={method.isRequired}
                                onChange={() => handleToggleShippingEnabled(method.id)}
                              />
                              <span className="switch-slider" />
                            </label>
                          </div>

                          <div className="shipping-option-row">
                            <div>
                              <div className="shipping-option-label">Kích hoạt COD (Thu tiền khi nhận hàng)</div>
                              <div className="shipping-option-note">
                                Cho phép người mua thanh toán tiền mặt khi shipper giao tận nơi.
                              </div>
                            </div>
                            <label className={`switch-toggle ${!method.enabled ? 'disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={method.codEnabled && method.enabled}
                                disabled={!method.enabled}
                                onChange={() => handleToggleCod(method.id)}
                              />
                              <span className="switch-slider" />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="onboarding-form-actions">
                <button
                  type="button"
                  className="onboarding-btn-cancel"
                  onClick={() => setCurrentStep(1)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="onboarding-btn-primary"
                  onClick={handleNextFromStep2}
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 3: KHAI BÁO CHI TIẾT ĐỊNH DANH CCCD VÀ MÃ SỐ THUẾ ── */}
          {currentStep === 3 && (
            <div className="onboarding-form-card">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#facc15', margin: '0 0 6px' }}>
                  Thông tin Định danh cá nhân & Nghĩa vụ thuế
                </h3>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  Tuân thủ Nghị định 52/2013/NĐ-CP và Luật Quản lý Thuế về thương mại điện tử.
                </p>
              </div>

              {/* KHỐI A: ĐỊNH DANH CCCD */}
              <div className="onboarding-sub-header">
                <CreditCard style={{ width: 17, height: 17, color: '#facc15' }} />
                <span>A. Thông tin định danh (Căn cước công dân)</span>
              </div>

              {/* Loại giấy tờ */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Loại giấy tờ</span>
                </label>
                <div className="onboarding-field-content">
                  <select
                    className="onboarding-text-input"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                  >
                    <option value="CCCD" style={{ background: '#242424' }}>
                      Thẻ Căn cước công dân (CCCD gắn chip)
                    </option>
                    <option value="PASSPORT" style={{ background: '#242424' }}>
                      Hộ chiếu (Passport)
                    </option>
                  </select>
                </div>
              </div>

              {/* Số CCCD */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Số CCCD / Định danh</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="text"
                    className="onboarding-text-input"
                    maxLength={12}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ví dụ: 079201001234 (12 số)"
                  />
                </div>
              </div>

              {/* Họ & Tên in trên CCCD */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Họ và tên trên CCCD</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="text"
                    className="onboarding-text-input"
                    value={idName}
                    onChange={(e) => setIdName(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: NGUYEN VAN AN (in hoa)"
                  />
                </div>
              </div>

              {/* Ngày cấp & Nơi cấp */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span>Ngày cấp & Nơi cấp</span>
                </label>
                <div className="onboarding-field-content" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
                  <input
                    type="date"
                    className="onboarding-text-input"
                    value={idIssueDate}
                    onChange={(e) => setIdIssueDate(e.target.value)}
                  />
                  <input
                    type="text"
                    className="onboarding-text-input"
                    value={idIssuePlace}
                    onChange={(e) => setIdIssuePlace(e.target.value)}
                    placeholder="Cục CS QLHC về TTXH"
                  />
                </div>
              </div>

              {/* Tải ảnh chụp 2 mặt CCCD */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Ảnh chụp CCCD</span>
                </label>
                <div className="onboarding-field-content">
                  <div className="onboarding-upload-grid">
                    {/* Mặt trước */}
                    <div
                      className={`onboarding-upload-card ${frontCccdName ? 'has-file' : ''}`}
                      onClick={() => frontInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={frontInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setFrontCccdName(file.name)
                        }}
                      />
                      <div className="onboarding-upload-icon">
                        {frontCccdName ? <Check style={{ width: 20, height: 20, color: '#facc15' }} /> : <Upload style={{ width: 18, height: 18 }} />}
                      </div>
                      <span className="onboarding-upload-title">Mặt trước CCCD</span>
                      <span className="onboarding-upload-subtitle">
                        {frontCccdName ? `Đã chọn: ${frontCccdName}` : 'Bấm tải ảnh lên'}
                      </span>
                    </div>

                    {/* Mặt sau */}
                    <div
                      className={`onboarding-upload-card ${backCccdName ? 'has-file' : ''}`}
                      onClick={() => backInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={backInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setBackCccdName(file.name)
                        }}
                      />
                      <div className="onboarding-upload-icon">
                        {backCccdName ? <Check style={{ width: 20, height: 20, color: '#facc15' }} /> : <Upload style={{ width: 18, height: 18 }} />}
                      </div>
                      <span className="onboarding-upload-title">Mặt sau CCCD</span>
                      <span className="onboarding-upload-subtitle">
                        {backCccdName ? `Đã chọn: ${backCccdName}` : 'Bấm tải ảnh lên'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI B: NGHĨA VỤ THUẾ */}
              <div className="onboarding-sub-header">
                <FileText style={{ width: 17, height: 17, color: '#facc15' }} />
                <span>B. Khai báo thông tin Thuế</span>
              </div>

              {/* Loại hình kinh doanh */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Loại hình kinh doanh</span>
                </label>
                <div className="onboarding-field-content">
                  <div className="onboarding-radio-group">
                    <label className="onboarding-radio-item">
                      <input
                        type="radio"
                        name="taxType"
                        checked={taxBusinessKind === 'INDIVIDUAL'}
                        onChange={() => setTaxBusinessKind('INDIVIDUAL')}
                      />
                      <span>Cá nhân / Hộ kinh doanh</span>
                    </label>
                    <label className="onboarding-radio-item">
                      <input
                        type="radio"
                        name="taxType"
                        checked={taxBusinessKind === 'COMPANY'}
                        onChange={() => setTaxBusinessKind('COMPANY')}
                      />
                      <span>Công ty / Doanh nghiệp</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Mã số thuế */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span className="required-star">*</span>
                  <span>Mã số thuế (MST)</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="text"
                    className="onboarding-text-input"
                    maxLength={14}
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="Ví dụ: 0318991234 (10 hoặc 13 số)"
                  />
                </div>
              </div>

              {/* Tên người nộp thuế */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span>Tên người nộp thuế</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="text"
                    className="onboarding-text-input"
                    value={taxPayerName}
                    onChange={(e) => setTaxPayerName(e.target.value)}
                    placeholder="Hộ kinh doanh / Doanh nghiệp nộp thuế"
                  />
                </div>
              </div>

              {/* Địa chỉ đăng ký thuế */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span>Địa chỉ theo MST</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="text"
                    className="onboarding-text-input"
                    value={taxAddress}
                    onChange={(e) => setTaxAddress(e.target.value)}
                    placeholder="Địa chỉ trụ sở / hộ kinh doanh đăng ký thuế"
                  />
                </div>
              </div>

              {/* Email nhận hóa đơn điện tử */}
              <div className="onboarding-form-row">
                <label className="onboarding-field-label">
                  <span>Email hóa đơn điện tử</span>
                </label>
                <div className="onboarding-field-content">
                  <input
                    type="email"
                    className="onboarding-text-input"
                    value={taxEmail || email}
                    onChange={(e) => setTaxEmail(e.target.value)}
                    placeholder="ketoan@chickymart.com"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="onboarding-form-actions">
                <button
                  type="button"
                  className="onboarding-btn-cancel"
                  onClick={() => setCurrentStep(2)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="onboarding-btn-primary"
                  onClick={handleNextFromStep3}
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 4: HOÀN TẤT & XÁC NHẬN TẤT CẢ THÔNG TIN ── */}
          {currentStep === 4 && (
            <div className="onboarding-form-card">
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#facc15', margin: '0 0 6px' }}>
                  Xác nhận thông tin & Nộp hồ sơ Người bán
                </h3>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  Kiểm tra lại toàn bộ thông tin đăng ký. Sau khi xác nhận, bạn sẽ được cấp quyền và chuyển thẳng vào Kênh Người Bán.
                </p>
              </div>

              {/* 1. Thông tin Shop */}
              <div className="confirm-section">
                <div className="confirm-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Store style={{ width: 16, height: 16, color: '#facc15' }} />
                    <span>1. Thông tin Gian hàng</span>
                  </div>
                  <span className="confirm-edit-link" onClick={() => setCurrentStep(1)}>
                    Chỉnh sửa
                  </span>
                </div>
                <div className="confirm-info-grid">
                  <span className="confirm-info-label">Tên Shop:</span>
                  <span className="confirm-info-value">{shopName}</span>

                  <span className="confirm-info-label">Email liên hệ:</span>
                  <span className="confirm-info-value">{email}</span>

                  <span className="confirm-info-label">Số điện thoại:</span>
                  <span className="confirm-info-value">{phone}</span>
                </div>
              </div>

              {/* 2. Địa chỉ lấy hàng */}
              <div className="confirm-section">
                <div className="confirm-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin style={{ width: 16, height: 16, color: '#facc15' }} />
                    <span>2. Địa chỉ lấy hàng</span>
                  </div>
                  <span className="confirm-edit-link" onClick={() => setCurrentStep(1)}>
                    Chỉnh sửa
                  </span>
                </div>
                <div className="confirm-info-grid">
                  <span className="confirm-info-label">Người gửi:</span>
                  <span className="confirm-info-value">
                    {pickupAddress?.fullName} ({pickupAddress?.phone})
                  </span>

                  <span className="confirm-info-label">Địa chỉ chi tiết:</span>
                  <span className="confirm-info-value">
                    {pickupAddress?.detailAddress}, {pickupAddress?.ward}, {pickupAddress?.province}
                  </span>
                </div>
              </div>

              {/* 3. Vận chuyển */}
              <div className="confirm-section">
                <div className="confirm-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck style={{ width: 16, height: 16, color: '#facc15' }} />
                    <span>3. Kênh vận chuyển đã kích hoạt</span>
                  </div>
                  <span className="confirm-edit-link" onClick={() => setCurrentStep(2)}>
                    Chỉnh sửa
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {shippingMethods
                    .filter((m) => m.enabled)
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`confirm-shipping-tag ${m.codEnabled ? 'cod-enabled' : ''}`}
                      >
                        <CheckCircle2 style={{ width: 14, height: 14, color: '#facc15' }} />
                        <span>{m.name}</span>
                        {m.codEnabled && (
                          <span style={{ fontSize: 10, color: '#fde047', fontWeight: 700 }}>
                            (COD)
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* 4. Định danh & Thuế */}
              <div className="confirm-section">
                <div className="confirm-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16, color: '#facc15' }} />
                    <span>4. Thông tin Định danh & Mã số thuế</span>
                  </div>
                  <span className="confirm-edit-link" onClick={() => setCurrentStep(3)}>
                    Chỉnh sửa
                  </span>
                </div>
                <div className="confirm-info-grid">
                  <span className="confirm-info-label">Số CCCD / Định danh:</span>
                  <span className="confirm-info-value">{idNumber || 'Chưa cung cấp'}</span>

                  <span className="confirm-info-label">Họ tên trên CCCD:</span>
                  <span className="confirm-info-value">{idName || 'Chưa cung cấp'}</span>

                  <span className="confirm-info-label">Loại hình kinh doanh:</span>
                  <span className="confirm-info-value">
                    {taxBusinessKind === 'INDIVIDUAL' ? 'Cá nhân / Hộ kinh doanh' : 'Doanh nghiệp'}
                  </span>

                  <span className="confirm-info-label">Mã số thuế (MST):</span>
                  <span className="confirm-info-value">{taxCode || 'Chưa cung cấp'}</span>
                </div>
              </div>

              {/* Cam kết tuân thủ */}
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #333333',
                  padding: '14px 16px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <ShieldCheck style={{ width: 18, height: 18, color: '#facc15', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
                  Tôi cam đoan thông tin khai báo định danh và mã số thuế hoàn toàn xác thực. Tôi cam kết tuân thủ chính sách tiêu chuẩn chất lượng sản phẩm và bảo vệ người tiêu dùng của sàn thương mại điện tử ChickyMart.
                </span>
              </div>

              {/* Actions */}
              <div className="onboarding-form-actions">
                <button
                  type="button"
                  className="onboarding-btn-cancel"
                  onClick={() => setCurrentStep(3)}
                  disabled={submitting}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="onboarding-btn-primary"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {submitting ? 'Đang kích hoạt...' : 'Xác Nhận & Mở Kênh Người Bán'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL THÊM ĐỊA CHỈ MỚI (TÔNG VÀNG) ── */}
      {isModalOpen && (
        <div className="onboarding-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="onboarding-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="onboarding-modal-header">
              <h3 className="onboarding-modal-title">Thêm Địa Chỉ Mới</h3>
              <button
                type="button"
                className="onboarding-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="onboarding-modal-body">
              {/* Họ & Tên + Số điện thoại */}
              <div className="onboarding-modal-grid-2">
                <div className="onboarding-modal-field">
                  <label className="onboarding-modal-label">Họ & Tên</label>
                  <input
                    type="text"
                    className="onboarding-modal-input"
                    placeholder="Nhập vào"
                    value={modalFullName}
                    onChange={(e) => setModalFullName(e.target.value)}
                  />
                </div>
                <div className="onboarding-modal-field">
                  <label className="onboarding-modal-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="onboarding-modal-input"
                    placeholder="Nhập vào"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Tỉnh/Thành phố/Phường/Xã */}
              <div className="onboarding-modal-field">
                <label className="onboarding-modal-label">Tỉnh/Thành phố/Phường/Xã</label>
                <div
                  className={`onboarding-modal-select-box ${!selectedLocationText ? 'placeholder' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{selectedLocationText || 'Chọn'}</span>
                  <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af' }} />
                </div>

                {isDropdownOpen && (
                  <div className="onboarding-location-dropdown">
                    <div className="onboarding-location-tabs">
                      <button
                        type="button"
                        className={`onboarding-location-tab-btn ${activeTab === 'province' ? 'active' : ''}`}
                        onClick={() => setActiveTab('province')}
                      >
                        Tỉnh/Thành phố
                      </button>
                      <button
                        type="button"
                        className={`onboarding-location-tab-btn ${activeTab === 'ward' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ward')}
                      >
                        Phường/Xã
                      </button>
                    </div>

                    {activeTab === 'province' && (
                      <div className="onboarding-location-list-grid">
                        {PROVINCES_DATA.map((prov) => (
                          <div
                            key={prov.id}
                            className={`onboarding-location-item ${selectedProvince === prov.name ? 'selected' : ''}`}
                            onClick={() => handleSelectProvince(prov.name)}
                          >
                            {prov.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'ward' && (
                      <div className="onboarding-location-list-grid">
                        {currentProvinceData.wards.map((wardName) => (
                          <div
                            key={wardName}
                            className={`onboarding-location-item ${selectedWard === wardName ? 'selected' : ''}`}
                            onClick={() => handleSelectWard(wardName)}
                          >
                            {wardName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="onboarding-modal-field">
                <label className="onboarding-modal-label">Địa chỉ chi tiết</label>
                <textarea
                  className="onboarding-modal-textarea"
                  placeholder="Số nhà, tên đường.v.v.."
                  value={modalDetailAddress}
                  onChange={(e) => setModalDetailAddress(e.target.value)}
                />
              </div>

              {/* Google Map Ping vị trí */}
              {canShowMap && (
                <div className="onboarding-map-wrapper">
                  <iframe
                    className="onboarding-map-iframe"
                    title="Google Map Location Preview"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddressQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    loading="lazy"
                  />

                  <div className="onboarding-map-pin-overlay">
                    <div className="onboarding-map-badge">
                      <div className="onboarding-map-badge-country">Vietnam</div>
                      <div className="onboarding-map-badge-address">
                        {modalDetailAddress}, {selectedWard}, {selectedProvince}
                      </div>
                    </div>
                    <div className="onboarding-map-pin-dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="onboarding-modal-footer">
              <button
                type="button"
                className="onboarding-modal-btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="onboarding-modal-btn-submit"
                onClick={handleSaveModalAddress}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerRegisterPage
