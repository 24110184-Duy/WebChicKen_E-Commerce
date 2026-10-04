import React, { useEffect, useState } from 'react'
import { voucherApi } from '../api/voucherApi'
import type { BackendVoucher, ValidateVoucherResult } from '../api/voucherApi'
import { formatMoney } from '../../../shared/lib/formatMoney'

interface VoucherModalProps {
  isOpen: boolean
  onClose: () => void
  orderValueMinor: number
  storeId?: string
  onSelectVoucher: (result: ValidateVoucherResult) => void
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  orderValueMinor,
  storeId,
  onSelectVoucher,
}) => {
  const [vouchers, setVouchers] = useState<BackendVoucher[]>([])
  const [loading, setLoading] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      voucherApi
        .getAvailableVouchers(storeId, orderValueMinor)
        .then((list) => setVouchers(list))
        .finally(() => setLoading(false))
    }
  }, [isOpen, orderValueMinor, storeId])

  if (!isOpen) return null

  const handleApply = async (codeToApply: string) => {
    setErrorMsg(null)
    const code = codeToApply.trim().toUpperCase()
    if (!code) {
      setErrorMsg('Vui lòng nhập mã voucher')
      return
    }

    setApplying(true)
    try {
      const res = await voucherApi.validateVoucher(code, orderValueMinor, storeId)
      if (res && res.isValid) {
        onSelectVoucher(res)
        onClose()
      } else {
        setErrorMsg(res?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn')
      }
    } catch {
      setErrorMsg('Không thể kiểm tra mã voucher vào lúc này')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-yellow-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎟️</span>
            <h3 className="font-bold text-gray-900 text-lg">Chọn ChickyMart Voucher</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Custom code input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã voucher giảm giá"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-sm"
            />
            <button
              onClick={() => handleApply(customCode)}
              disabled={applying || !customCode.trim()}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 font-semibold text-gray-900 rounded-xl transition-all disabled:opacity-50 text-sm"
            >
              {applying ? 'Kiểm tra...' : 'Áp dụng'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Vouchers list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã giảm giá khả dụng</h4>
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Đang tải mã giảm giá...</div>
            ) : vouchers.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Hiện chưa có voucher nào phù hợp với đơn hàng này.
              </div>
            ) : (
              vouchers.map((v) => {
                const isEligible = orderValueMinor >= v.minOrderValueMinor
                return (
                  <div
                    key={v.id}
                    className={`border rounded-xl p-4 flex items-center justify-between gap-4 transition-all ${
                      isEligible
                        ? 'border-yellow-200 bg-yellow-50/30 hover:border-yellow-400'
                        : 'border-gray-200 bg-gray-50/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded text-xs">
                          {v.code}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm">
                          {v.type === 'PERCENTAGE'
                            ? `Giảm ${v.discountValueMinor}% (Tối đa ${formatMoney(v.maxDiscountAmountMinor)})`
                            : `Giảm ${formatMoney(v.discountValueMinor)}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Đơn tối thiểu: {formatMoney(v.minOrderValueMinor)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApply(v.code)}
                      disabled={!isEligible || applying}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 font-bold text-xs text-gray-900 rounded-lg whitespace-nowrap disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                    >
                      Áp dụng
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
