export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            🍗 WebChicKen
          </span>
          <span style={{
            fontSize: '12px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600
          }}>
            E-Commerce Marketplace
          </span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Headless React SPA + Java Servlet 6.0
        </div>
      </header>

      <main style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '24px'
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '36px 48px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '680px',
          width: '100%'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--color-text-main)' }}>
            Hệ thống Frontend đã được phân chia thư mục thành công
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            Cấu trúc thư mục được thiết kế theo đúng chuẩn kiến trúc Shopee / Amazon tại <code>ARCHITECTURE.md</code>, bao gồm 11 features nghiệp vụ, Atomic Design components, và Design Tokens.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            textAlign: 'left',
            fontSize: '13px'
          }}>
            <div style={{ padding: '12px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <strong>Layouts:</strong>
              <div>6 layout chuẩn: Public, Auth, Buyer, Seller, Admin, Checkout</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <strong>Features:</strong>
              <div>11 nghiệp vụ độc lập: Catalog, Cart, Checkout, Order...</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <strong>Tokens:</strong>
              <div>Nguồn sự thật duy nhất cho màu sắc, spacing, radius</div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '13px',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        WebChicKen Marketplace &copy; 2026 — Kiến trúc Headless Monorepo
      </footer>
    </div>
  )
}
