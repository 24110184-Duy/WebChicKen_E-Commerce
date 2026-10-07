import React from 'react'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react'
import type { AdminProductItem } from '../types'

export interface ProductDetailModalProps {
  isOpen: boolean
  product: AdminProductItem | null
  onClose: () => void
  onApprove: (product: AdminProductItem) => void
  onReject: (product: AdminProductItem) => void
  isSubmitting?: boolean
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  onApprove,
  onReject,
  isSubmitting = false,
}) => {
  if (!isOpen || !product) return null

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(minor / 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: '#ecfdf5',
          text: '#059669',
          border: '#a7f3d0',
          label: 'ĐÃ DUYỆT (ACTIVE)',
        }
      case 'INACTIVE':
        return {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fecaca',
          label: 'ĐÃ TỪ CHỐI / TẠM KHÓA',
        }
      case 'PENDING_APPROVAL':
      default:
        return {
          bg: '#fffbeb',
          text: '#d97706',
          border: '#fde68a',
          label: 'CHỜ KIỂM DUYỆT',
        }
    }
  }

  const badge = getStatusBadge(product.status)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          maxWidth: 820,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Thẩm Định Chi Tiết Sản Phẩm
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: badge.bg,
                    color: badge.text,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Mã sản phẩm: <b style={{ color: '#cbd5e1' }}>{product.id}</b> • Gian hàng:{' '}
                <b style={{ color: '#38bdf8' }}>{product.storeName || product.storeId}</b>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Rejection notice if any */}
          {product.rejectionReason && (
            <div
              style={{
                marginBottom: 20,
                padding: '14px 18px',
                borderRadius: 10,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                LÝ DO TỪ CHỐI TRƯỚC ĐÓ:
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{product.rejectionReason}</div>
            </div>
          )}

          {/* Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
            {/* Left: Images */}
            <div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  marginBottom: 12,
                }}
              >
                <img
                  src={
                    product.thumbnailUrl ||
                    product.imageUrls?.[0] ||
                    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {product.imageUrls && product.imageUrls.length > 1 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {product.imageUrls.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Gallery ${i}`}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Quality & Veterinary Stamp */}
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  backgroundColor: '#f0fdf4',
                  borderRadius: 10,
                  border: '1px solid #bbf7d0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#15803d',
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>TIÊU CHUẨN AN TOÀN SINH HỌC</span>
                </div>
                <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                  <div>• Tiêu chuẩn: <b>{product.farmingStandard || 'VietGAP An Toàn'}</b></div>
                  <div>• Nơi xuất xứ: <b>{product.origin || 'Vùng chăn nuôi bảo hộ'}</b></div>
                  <div>• Mã kiểm dịch: <b>{product.veterinaryInspectionCode || 'KD-POULTRY-2026'}</b></div>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#7c3aed',
                    backgroundColor: '#f5f3ff',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {product.categoryName || 'Danh mục gia cầm'}
                </span>
                <h2
                  style={{
                    margin: '8px 0',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.4,
                  }}
                >
                  {product.name}
                </h2>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ea580c' }}>
                  {formatPrice(product.minPriceMinor)}
                  {product.minPriceMinor !== product.maxPriceMinor && (
                    <span> - {formatPrice(product.maxPriceMinor)}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Mô tả sản phẩm:
                </h4>
                <div
                  style={{
                    fontSize: 13,
                    color: '#334155',
                    lineHeight: 1.6,
                    backgroundColor: '#f8fafc',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {product.description || 'Chưa có mô tả chi tiết.'}
                </div>
              </div>

              {/* Variants table */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Phân loại & Tồn kho (SKUs):
                </h4>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Biến thể / Thuộc tính</th>
                        <th style={{ padding: '8px 12px' }}>Giá bán</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Kho sẵn có</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.map((v) => (
                          <tr key={v.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{v.attribute}</td>
                            <td style={{ padding: '8px 12px', color: '#ea580c', fontWeight: 700 }}>
                              {formatPrice(v.basePriceMinor)}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              {v.stockQuantity} con/kg
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: '8px 12px' }} colSpan={2}>
                            Mặc định (Tiêu chuẩn)
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                            {product.totalStock} sản phẩm
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Ngày đăng ký:{' '}
            <b>{new Date(product.createdAt).toLocaleDateString('vi-VN')}</b>
          </span>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>

            {product.status !== 'INACTIVE' && (
              <button
                onClick={() => onReject(product)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <XCircle size={16} />
                <span>Từ Chối</span>
              </button>
            )}

            {product.status !== 'ACTIVE' && (
              <button
                onClick={() => onApprove(product)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} />
                <span>Phê Duyệt Lên Sàn</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
