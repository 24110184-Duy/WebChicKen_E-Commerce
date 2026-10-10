package com.example.webchicken.modules.catalog.service;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.modules.catalog.dao.CategoryDAO;
import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.catalog.model.dto.response.ProductDetailResponse;
import com.example.webchicken.modules.catalog.model.entity.CategoryEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductEntity;
import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import com.example.webchicken.modules.catalog.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit Test kiểm tra tính năng Duyệt & Từ chối sản phẩm cho Admin (TASK-65).
 */
public class ProductModerationTest {

    private ProductDAO productDAO;
    private ProductImageDAO productImageDAO;
    private ProductVariantDAO productVariantDAO;
    private CategoryDAO categoryDAO;
    private ProductServiceImpl service;

    @BeforeEach
    void setUp() {
        productDAO = mock(ProductDAO.class);
        productImageDAO = mock(ProductImageDAO.class);
        productVariantDAO = mock(ProductVariantDAO.class);
        categoryDAO = mock(CategoryDAO.class);

        service = new ProductServiceImpl(productDAO, productImageDAO, productVariantDAO, categoryDAO);
    }

    @Test
    @DisplayName("Duyệt sản phẩm thành công sang trạng thái ACTIVE và xóa rejectionReason")
    void testReviewProduct_Approve_Success() {
        String productId = "prod-test-001";
        ProductEntity entity = new ProductEntity(
                productId, "store-01", "cat-01", "Gà Đồi Bắc Giang", "Mô tả gà sạch",
                ProductStatus.PENDING_APPROVAL, LocalDateTime.now(), LocalDateTime.now()
        );
        entity.setRejectionReason("Lý do cũ");

        when(productDAO.findById(productId)).thenReturn(Optional.of(entity));
        when(categoryDAO.findById("cat-01")).thenReturn(Optional.of(new CategoryEntity("cat-01", "Gà Ta", "Mô tả", LocalDateTime.now())));
        when(productImageDAO.findByProductId(productId)).thenReturn(Collections.emptyList());
        when(productVariantDAO.findByProductId(productId)).thenReturn(Collections.emptyList());

        ProductDetailResponse result = service.reviewProduct(productId, ProductStatus.ACTIVE, null);

        assertNotNull(result);
        assertEquals(ProductStatus.ACTIVE, result.status());
        assertNull(result.rejectionReason());
        verify(productDAO, times(1)).update(entity);
    }

    @Test
    @DisplayName("Từ chối sản phẩm sang trạng thái INACTIVE kèm lý do từ chối cụ thể")
    void testReviewProduct_Reject_Success() {
        String productId = "prod-test-002";
        ProductEntity entity = new ProductEntity(
                productId, "store-02", "cat-02", "Vịt Đông Lạnh", "Mô tả",
                ProductStatus.PENDING_APPROVAL, LocalDateTime.now(), LocalDateTime.now()
        );

        when(productDAO.findById(productId)).thenReturn(Optional.of(entity));
        when(categoryDAO.findById("cat-02")).thenReturn(Optional.of(new CategoryEntity("cat-02", "Vịt", "Mô tả", LocalDateTime.now())));
        when(productImageDAO.findByProductId(productId)).thenReturn(Collections.emptyList());
        when(productVariantDAO.findByProductId(productId)).thenReturn(Collections.emptyList());

        String reason = "Sản phẩm thiếu giấy kiểm dịch thú y an toàn.";
        ProductDetailResponse result = service.reviewProduct(productId, ProductStatus.INACTIVE, reason);

        assertNotNull(result);
        assertEquals(ProductStatus.INACTIVE, result.status());
        assertEquals(reason, result.rejectionReason());
        verify(productDAO, times(1)).update(entity);
    }

    @Test
    @DisplayName("Ném NotFoundException khi kiểm duyệt sản phẩm không tồn tại")
    void testReviewProduct_NotFound() {
        when(productDAO.findById("not-found")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> {
            service.reviewProduct("not-found", ProductStatus.ACTIVE, null);
        });
    }

    @Test
    @DisplayName("Khi seller tạo sản phẩm với trạng thái ACTIVE, hệ thống luôn ép về PENDING_APPROVAL")
    void testCreateProduct_ForcesPendingApproval_WhenSellerRequestsActive() {
        when(categoryDAO.existsById("cat-01")).thenReturn(true);
        when(categoryDAO.findById("cat-01")).thenReturn(Optional.of(new CategoryEntity("cat-01", "Gà Ta", "Mô tả", LocalDateTime.now())));

        com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest request =
                new com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest(
                        "store-01",
                        "cat-01",
                        "Gà Tre Tân Châu",
                        "Mô tả gà tre giống đẹp",
                        Collections.emptyList(),
                        List.of(new com.example.webchicken.modules.catalog.model.dto.request.CreateVariantRequest("Tiêu Chuẩn", 100000L, 50)),
                        ProductStatus.ACTIVE // Seller cố tình gửi ACTIVE
                );

        ProductDetailResponse response = service.createProduct(request);

        assertNotNull(response);
        assertEquals(ProductStatus.PENDING_APPROVAL, response.status(),
                "Sản phẩm mới tạo tuyệt đối không được ở trạng thái ACTIVE trực tiếp mà phải chờ Admin duyệt");
        verify(productDAO, times(1)).save(argThat(p -> p.getStatus() == ProductStatus.PENDING_APPROVAL));
    }

    @Test
    @DisplayName("Khi seller tạo sản phẩm với trạng thái INACTIVE (lưu nháp), hệ thống giữ nguyên INACTIVE")
    void testCreateProduct_PreservesInactive_WhenSellerRequestsDraft() {
        when(categoryDAO.existsById("cat-01")).thenReturn(true);
        when(categoryDAO.findById("cat-01")).thenReturn(Optional.of(new CategoryEntity("cat-01", "Gà Ta", "Mô tả", LocalDateTime.now())));

        com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest request =
                new com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest(
                        "store-01",
                        "cat-01",
                        "Bản nháp sản phẩm gà",
                        "Chưa hoàn thiện thông tin",
                        Collections.emptyList(),
                        List.of(new com.example.webchicken.modules.catalog.model.dto.request.CreateVariantRequest("Bản Nháp", 50000L, 10)),
                        ProductStatus.INACTIVE
                );

        ProductDetailResponse response = service.createProduct(request);

        assertNotNull(response);
        assertEquals(ProductStatus.INACTIVE, response.status());
        verify(productDAO, times(1)).save(argThat(p -> p.getStatus() == ProductStatus.INACTIVE));
    }

    @Test
    @DisplayName("Khi seller cố cập nhật sản phẩm chưa được duyệt sang ACTIVE, hệ thống ném ValidationException")
    void testUpdateProduct_RejectsActiveStatus_WhenProductNotAlreadyActive() {
        String productId = "prod-test-pending";
        ProductEntity entity = new ProductEntity(
                productId, "store-01", "cat-01", "Gà Đang Chờ Duyệt", "Mô tả",
                ProductStatus.PENDING_APPROVAL, LocalDateTime.now(), LocalDateTime.now()
        );
        when(productDAO.findById(productId)).thenReturn(Optional.of(entity));
        when(categoryDAO.existsById("cat-01")).thenReturn(true);

        com.example.webchicken.modules.catalog.model.dto.request.UpdateProductRequest request =
                new com.example.webchicken.modules.catalog.model.dto.request.UpdateProductRequest(
                        "cat-01",
                        "Gà Đang Chờ Duyệt",
                        "Mô tả",
                        ProductStatus.ACTIVE // Seller cố đổi thành ACTIVE
                );

        assertThrows(com.example.webchicken.common.exception.ValidationException.class, () -> {
            service.updateProduct(productId, request);
        });
    }
}

