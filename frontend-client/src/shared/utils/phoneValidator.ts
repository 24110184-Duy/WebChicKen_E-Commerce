/**
 * Tiện ích kiểm tra, nhận diện quốc gia và định dạng số điện thoại chuẩn quốc tế (+84...).
 */

export interface PhoneAnalysisResult {
  raw: string
  normalized: string      // Dạng số chuẩn gửi server: ví dụ '0332790798' hoặc '+84332790798'
  formatted: string       // Dạng hiển thị theo ảnh: ví dụ '(+84) 332 790 798'
  isValid: boolean
  countryCode: string     // ví dụ '(+84)', '(+1)', '(+82)'...
  countryName: string     // ví dụ 'Vietnam', 'United States'...
  carrier?: string | null // ví dụ 'Viettel', 'VinaPhone'...
}

// Regex kiểm tra số điện thoại di động 10 chữ số tại Việt Nam (đầu 3, 5, 7, 8, 9)
const VN_MOBILE_REGEX = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/

/**
 * Nhận diện quốc gia, kiểm tra tính hợp lệ và định dạng chuỗi hiển thị theo phong cách:
 * (+84) 332 790 798
 */
export function analyzePhoneNumber(input: string): PhoneAnalysisResult {
  if (!input) {
    return {
      raw: '',
      normalized: '',
      formatted: '',
      isValid: false,
      countryCode: '',
      countryName: '',
    }
  }

  const raw = input.trim()
  const digitsOnly = raw.replace(/\D/g, '')

  // 1. Kiểm tra Việt Nam (+84)
  // Các trường hợp:
  // - Bắt đầu bằng +84 hoặc 84: 84332790798 -> 11 số
  // - Bắt đầu bằng 0: 0332790798 -> 10 số
  // - Bắt đầu bằng 3, 5, 7, 8, 9 với 9 chữ số: 332790798 -> 9 số
  let vnMobile9Digits: string | null = null

  if (raw.startsWith('+84') && digitsOnly.length === 11 && digitsOnly.startsWith('84')) {
    vnMobile9Digits = digitsOnly.slice(2)
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('84')) {
    vnMobile9Digits = digitsOnly.slice(2)
  } else if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    vnMobile9Digits = digitsOnly.slice(1)
  } else if (digitsOnly.length === 9 && /^[35789]/.test(digitsOnly)) {
    vnMobile9Digits = digitsOnly
  }

  if (vnMobile9Digits && vnMobile9Digits.length === 9) {
    const vnFull10 = '0' + vnMobile9Digits
    if (VN_MOBILE_REGEX.test(vnFull10)) {
      // Định dạng cụm: (+84) 332 790 798
      const p1 = vnMobile9Digits.slice(0, 3)
      const p2 = vnMobile9Digits.slice(3, 6)
      const p3 = vnMobile9Digits.slice(6, 9)
      const formatted = `(+84) ${p1} ${p2} ${p3}`
      const carrier = getVietnameseCarrier(vnFull10)

      return {
        raw,
        normalized: vnFull10,
        formatted,
        isValid: true,
        countryCode: '(+84)',
        countryName: 'Vietnam',
        carrier,
      }
    }
  }

  // 2. Kiểm tra các mã quốc gia quốc tế khác (nếu người dùng nhập dấu +)
  if (raw.startsWith('+1') || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
    const us10 = digitsOnly.startsWith('1') ? digitsOnly.slice(1) : digitsOnly
    if (us10.length === 10) {
      const formatted = `(+1) ${us10.slice(0, 3)} ${us10.slice(3, 6)} ${us10.slice(6)}`
      return {
        raw,
        normalized: `+1${us10}`,
        formatted,
        isValid: true,
        countryCode: '(+1)',
        countryName: 'United States',
      }
    }
  }

  if (raw.startsWith('+82') && digitsOnly.startsWith('82')) {
    const rest = digitsOnly.slice(2)
    if (rest.length >= 9 && rest.length <= 10) {
      const formatted = `(+82) ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`
      return {
        raw,
        normalized: `+82${rest}`,
        formatted,
        isValid: true,
        countryCode: '(+82)',
        countryName: 'South Korea',
      }
    }
  }

  if (raw.startsWith('+81') && digitsOnly.startsWith('81')) {
    const rest = digitsOnly.slice(2)
    if (rest.length === 10) {
      const formatted = `(+81) ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`
      return {
        raw,
        normalized: `+81${rest}`,
        formatted,
        isValid: true,
        countryCode: '(+81)',
        countryName: 'Japan',
      }
    }
  }

  if (raw.startsWith('+65') && digitsOnly.startsWith('65')) {
    const rest = digitsOnly.slice(2)
    if (rest.length === 8) {
      const formatted = `(+65) ${rest.slice(0, 4)} ${rest.slice(4)}`
      return {
        raw,
        normalized: `+65${rest}`,
        formatted,
        isValid: true,
        countryCode: '(+65)',
        countryName: 'Singapore',
      }
    }
  }

  // Mặc định chưa đủ số hoặc chưa hoàn tất
  return {
    raw,
    normalized: digitsOnly ? (digitsOnly.startsWith('0') ? digitsOnly : '0' + digitsOnly) : raw,
    formatted: raw,
    isValid: false,
    countryCode: '',
    countryName: '',
  }
}

/**
 * Nhận diện nhà mạng viễn thông tại Việt Nam từ số điện thoại.
 */
export function getVietnameseCarrier(phone: string): string | null {
  const normalized = normalizeVietnamesePhone(phone)
  if (!isValidVietnamesePhone(normalized)) return null

  const prefix3 = normalized.slice(0, 3)
  switch (prefix3) {
    case '086':
    case '096':
    case '097':
    case '098':
    case '032':
    case '033':
    case '034':
    case '035':
    case '036':
    case '037':
    case '038':
    case '039':
      return 'Viettel'

    case '088':
    case '091':
    case '094':
    case '081':
    case '082':
    case '083':
    case '084':
    case '085':
      return 'VinaPhone'

    case '089':
    case '090':
    case '093':
    case '070':
    case '076':
    case '077':
    case '078':
    case '079':
      return 'MobiFone'

    case '092':
    case '052':
    case '056':
    case '058':
      return 'Vietnamobile'

    case '099':
    case '059':
      return 'Gmobile'

    case '087':
      return 'Itelecom'

    case '055':
      return 'Wintel'

    default:
      return 'Vietnam Telco'
  }
}

/**
 * Chuẩn hóa số điện thoại về định dạng nội địa chuẩn: 0xxxxxxxxx
 */
export function normalizeVietnamesePhone(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[\s.-]/g, '').trim()
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3)
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2)
  }
  return cleaned
}

/**
 * Kiểm tra xem số điện thoại có thuộc dải số di động hợp lệ của Việt Nam không.
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const normalized = normalizeVietnamesePhone(phone)
  return VN_MOBILE_REGEX.test(normalized)
}
