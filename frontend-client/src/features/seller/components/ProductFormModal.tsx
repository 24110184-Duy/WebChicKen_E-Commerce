import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react'

import {
  sellerApi,
  type SellerProductItem,
  type CreateProductPayload,
  type UpdateProductPayload,
  type CreateVariantPayload,
  type ProductCategoryOption,
} from '../api/sellerApi'
import { formatMoney } from '../../../shared/lib/formatMoney'

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (product: SellerProductItem) => void
  initialProduct?: SellerProductItem | null
  shopId?: string
}

const SAMPLE_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
]

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
  shopId,
}) => {
  const isEditing = !!initialProduct

  const [categories, setCategories] = useState<ProductCategoryOption[]>([])
  const [name, setName] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [variants, setVariants] = useState<CreateVariantPayload[]>([
    { attribute: 'Bản Tiêu Chuẩn', basePriceMinor: 499000, stockQuantity: 100 },
  ])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    sellerApi.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats)
        if (!categoryId) setCategoryId(cats[0].id)
      }
    })
  }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name)
      setCategoryId(initialProduct.categoryId || 'cat-whole')
      setDescription(initialProduct.description || '')
      setStatus(initialProduct.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')
      setImageUrls(initialProduct.imageUrls || [])
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        setVariants(
          initialProduct.variants.map((v) => ({
            attribute: v.attribute,
            basePriceMinor: v.basePriceMinor,
            stockQuantity: v.stockQuantity,
          }))
        )
      } else {
        setVariants([{ attribute: 'Standard Size', basePriceMinor: 120000, stockQuantity: 20 }])
      }
    } else {
      setName('')
      setCategoryId('cat-electronics')
      setDescription('')
      setStatus('ACTIVE')
      setImageUrls([SAMPLE_PRODUCT_IMAGES[0]])
      setVariants([{ attribute: 'Bản Tiêu Chuẩn', basePriceMinor: 499000, stockQuantity: 100 }])
    }
    setErrorMessage(null)
  }, [initialProduct, isOpen])

  if (!isOpen) return null

  const handleFiles = (files: FileList | File[]) => {
    setErrorMessage(null)
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const remainingSlots = 6 - imageUrls.length
    if (remainingSlots <= 0) {
      setErrorMessage('Maximum 6 product images allowed. Please remove existing photos first.')
      return
    }

    const filesToProcess = fileArray.slice(0, remainingSlots)
    const validFiles = filesToProcess.filter((file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024
      return isValidType && isValidSize
    })

    if (validFiles.length < filesToProcess.length) {
      setErrorMessage('Some files were skipped (only JPG, PNG, WEBP, GIF under 5MB are supported).')
    }

    if (validFiles.length === 0) return

    setIsUploading(true)
    let loadedCount = 0
    const loadedDataUrls: string[] = []

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string
        if (result) {
          loadedDataUrls.push(result)
        }
        loadedCount++
        if (loadedCount === validFiles.length) {
          setImageUrls((prev) => [...prev, ...loadedDataUrls].slice(0, 6))
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        loadedCount++
        if (loadedCount === validFiles.length) {
          if (loadedDataUrls.length > 0) {
            setImageUrls((prev) => [...prev, ...loadedDataUrls].slice(0, 6))
          }
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSetCover = (index: number) => {
    if (index === 0) return
    setImageUrls((prev) => {
      const copy = [...prev]
      const [selected] = copy.splice(index, 1)
      return [selected, ...copy]
    })
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }


  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { attribute: `Option ${prev.length + 1}`, basePriceMinor: 100000, stockQuantity: 20 },
    ])
  }

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      setErrorMessage('A product must contain at least one SKU variant.')
      return
    }
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVariantChange = (
    index: number,
    field: keyof CreateVariantPayload,
    value: string | number
  ) => {
    setVariants((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Please enter the product name.')
      return
    }

    if (variants.length === 0) {
      setErrorMessage('Please specify at least one product SKU variant.')
      return
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (!v.attribute.trim()) {
        setErrorMessage(`Variant #${i + 1} attribute name cannot be blank.`)
        return
      }
      if (v.basePriceMinor < 1000) {
        setErrorMessage(`Variant #${i + 1} price must be at least 1,000 VND.`)
        return
      }
      if (v.stockQuantity < 0) {
        setErrorMessage(`Variant #${i + 1} stock quantity cannot be negative.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      let currentShopId = shopId || initialProduct?.storeId
      if (!currentShopId) {
        const myStore = await sellerApi.getMyStore()
        currentShopId = myStore?.id
      }
      if (!currentShopId) {
        throw new Error('Không thể xác định gian hàng người bán. Vui lòng thử lại.')
      }

      if (isEditing && initialProduct) {
        const payload: UpdateProductPayload = {
          name: name.trim(),
          categoryId,
          description: description.trim(),
          status,
          imageUrls: imageUrls.length > 0 ? imageUrls : [SAMPLE_PRODUCT_IMAGES[0]],
          variants,
        }
        const updated = await sellerApi.updateStoreProduct(currentShopId, initialProduct.id, payload)
        onSuccess(updated)
        onClose()
      } else {
        const payload: CreateProductPayload = {
          storeId: currentShopId,
          name: name.trim(),
          categoryId,
          description: description.trim(),
          status,
          imageUrls: imageUrls.length > 0 ? imageUrls : [SAMPLE_PRODUCT_IMAGES[0]],
          variants,
        }
        const created = await sellerApi.createStoreProduct(currentShopId, payload)
        onSuccess(created)
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="seller-modal-overlay" onClick={onClose}>
      <div className="seller-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="seller-modal-header">
          <div>
            <h3 className="seller-modal-title">
              {isEditing ? 'Chỉnh Sửa Sản Phẩm (SKU & Biến Thể)' : 'Thêm Sản Phẩm Mới'}
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Cấu hình thông tin chi tiết, quy cách SKU, giá bán và quản lý tồn kho
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="seller-modal-close-btn"
            title="Close"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="seller-modal-body">
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                fontSize: 12.5,
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="seller-form-section">
            <h4 className="seller-form-section-title">
              <Layers style={{ width: 16, height: 16, color: '#f59e0b' }} />
              <span>1. Basic Product Information</span>
            </h4>

            <div className="seller-form-group">
              <label className="seller-form-label">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tai Nghe Bluetooth Chống Ồn Sony WH-1000XM5 Chính Hãng"
                className="seller-form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="seller-form-group">
                <label className="seller-form-label">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="seller-form-select"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="seller-form-group">
                <label className="seller-form-label">Publication Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="seller-form-select"
                >
                  <option value="ACTIVE">Active (Live on Storefront)</option>
                  <option value="INACTIVE">Inactive (Hidden / Draft)</option>
                </select>
              </div>
            </div>

            <div className="seller-form-group">
              <label className="seller-form-label">Mô Tả & Thông Tin Chi Tiết</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả thông tin chi tiết sản phẩm, xuất xứ, tính năng nổi bật, bảo hành chính hãng và hướng dẫn sử dụng..."
                className="seller-form-textarea"
                rows={3}
              />
            </div>
          </div>

          {/* Section 2: Media & Gallery */}
          <div className="seller-form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 className="seller-form-section-title" style={{ margin: 0 }}>
                <ImageIcon style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span>2. Product Images ({imageUrls.length}/6)</span>
              </h4>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                First image is the <strong>Cover Photo</strong>
              </span>
            </div>

            {/* Hidden native file input triggered by upload card or button click */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Image Grid with Thumbnails and Upload Dropzone Card */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
                gap: 12,
                padding: 12,
                backgroundColor: isDragging ? '#fffbeb' : '#f8fafc',
                border: isDragging ? '2px dashed #f59e0b' : '1.5px solid #e2e8f0',
                borderRadius: 12,
                transition: 'all 0.15s ease',
              }}
            >
              {/* Existing Uploaded Thumbnails */}
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative',
                    border: idx === 0 ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <img
                    src={url}
                    alt={`Product ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Cover Badge */}
                  {idx === 0 ? (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: '#f59e0b',
                        color: '#0f172a',
                        fontSize: 10,
                        fontWeight: 800,
                        textAlign: 'center',
                        padding: '2px 0',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: 9.5,
                        fontWeight: 600,
                        textAlign: 'center',
                        padding: '2px 0',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title="Click to set as primary cover photo"
                    >
                      Set Cover
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      lineHeight: 1,
                    }}
                    title="Remove this photo"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload Card / Trigger Button from Computer */}
              {imageUrls.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: 10,
                    border: '1.5px dashed #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: 6,
                    color: '#64748b',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b'
                    e.currentTarget.style.color = '#b45309'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.color = '#64748b'
                  }}
                  title="Click to browse photos on your computer or drag & drop files here"
                >
                  <Upload style={{ width: 22, height: 22, color: '#f59e0b' }} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    {isUploading ? 'Loading...' : '+ Add Photo'}
                  </span>
                  <span style={{ fontSize: 9.5, color: '#94a3b8' }}>From Device</span>
                </button>
              )}
            </div>

            {/* Action Bar for File Selection */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || imageUrls.length >= 6}
                  className="seller-btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    fontSize: 12.5,
                  }}
                >
                  <Upload style={{ width: 14, height: 14 }} />
                  <span>Choose Images from Computer</span>
                </button>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>
                  Supports JPG, PNG, WEBP, GIF (Max 5MB each)
                </span>
              </div>

              {/* Quick Preset Samples */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Quick demo photos:</span>
                {SAMPLE_PRODUCT_IMAGES.slice(0, 3).map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (imageUrls.length >= 6) {
                        setErrorMessage('Maximum 6 product images allowed.')
                        return
                      }
                      if (!imageUrls.includes(url)) {
                        setImageUrls((prev) => [...prev, url])
                      }
                    }}
                    style={{
                      padding: '2px 7px',
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: 10.5,
                      cursor: 'pointer',
                      color: '#475569',
                    }}
                  >
                    Sample #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Section 3: SKU Variant & Inventory Matrix */}
          <div className="seller-form-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 className="seller-form-section-title" style={{ margin: 0 }}>
                <Sparkles style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span>3. SKU Variants & Inventory ({variants.length})</span>
              </h4>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Total Stock: <strong>{variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0)} units</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variants.map((variant, idx) => (
                <div key={idx} className="seller-variant-row">
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>
                      Attribute / Weight / Cut
                    </label>
                    <input
                      type="text"
                      value={variant.attribute}
                      onChange={(e) => handleVariantChange(idx, 'attribute', e.target.value)}
                      placeholder="e.g. 1.2kg - 1.4kg / Tray 500g"
                      className="seller-form-input"
                      style={{ height: 34, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>
                      Price ({formatMoney(variant.basePriceMinor || 0)})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={variant.basePriceMinor}
                      onChange={(e) => handleVariantChange(idx, 'basePriceMinor', Number(e.target.value))}
                      placeholder="Price in VND"
                      className="seller-form-input"
                      style={{ height: 34, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>
                      Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={variant.stockQuantity}
                      onChange={(e) => handleVariantChange(idx, 'stockQuantity', Number(e.target.value))}
                      placeholder="Units"
                      className="seller-form-input"
                      style={{ height: 34, fontSize: 13 }}
                    />
                  </div>

                  <div style={{ paddingTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      disabled={variants.length <= 1}
                      className="seller-variant-remove-btn"
                      title={variants.length <= 1 ? 'Cannot delete only variant' : 'Delete variant'}
                      style={{ opacity: variants.length <= 1 ? 0.3 : 1 }}
                    >
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddVariant}
                className="seller-add-variant-btn"
              >
                <Plus style={{ width: 16, height: 16 }} />
                <span>Add Another SKU Variant</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="seller-modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="seller-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="seller-btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Check style={{ width: 16, height: 16 }} />
                <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductFormModal
