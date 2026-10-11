import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop:
 * 1. Tự động cuộn lên đầu trang (top: 0) mỗi khi chuyển trang (pathname hoặc search thay đổi).
 * 2. Lắng nghe sự kiện click: Khi người dùng đang ở một trang (như Help Center) và bấm lại vào link của trang đó,
 *    tự động cuộn mượt (smooth scroll) lên lại đỉnh trang.
 */
export const ScrollToTop = () => {
  const location = useLocation()

  // 1. Khi chuyển trang (Route thay đổi): Luôn đưa vị trí cuộn về đỉnh trang
  useEffect(() => {
    // Nếu có anchor hash (#...) thì để trình duyệt xử lý cuộn tới phần tử đó
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Cuộn window & document về đỉnh
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
    if (document.body) {
      document.body.scrollTop = 0
    }

    // Cuộn các container nội bộ (nếu có trong Kênh Người Bán / Admin)
    const sellerMain = document.querySelector('.seller-main')
    if (sellerMain) {
      sellerMain.scrollTop = 0
    }
    const adminMain = document.querySelector('.admin-main')
    if (adminMain) {
      adminMain.scrollTop = 0
    }
  }, [location.pathname, location.search])

  // 2. Khi đang ở trang đó (ví dụ: Help Center) và bấm lại vào Help Center hoặc nút chuyển trang hiện tại
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Chỉ xử lý chuột trái thông thường (không giữ Ctrl/Cmd mở tab mới)
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Bỏ qua external links, mailto, tel, script links
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return
      }

      // Bỏ qua hash links nội bộ (ví dụ: #faq-section)
      if (href.startsWith('#')) return

      // Lấy đường dẫn đích (loại bỏ search và hash để so sánh route)
      const targetPath = href.split('?')[0].split('#')[0]
      const currentPath = window.location.pathname

      // Nếu link trỏ tới chính trang hiện tại
      if (targetPath === currentPath) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        if (document.documentElement) {
          document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        }
        if (document.body) {
          document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        }
        const sellerMain = document.querySelector('.seller-main')
        if (sellerMain) {
          sellerMain.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        }
      }
    }

    document.addEventListener('click', handleGlobalClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true })
    }
  }, [])

  return null
}
