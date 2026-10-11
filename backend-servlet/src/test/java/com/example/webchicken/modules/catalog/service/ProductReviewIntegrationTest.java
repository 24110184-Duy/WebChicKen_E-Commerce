package com.example.webchicken.modules.catalog.service;

import com.example.webchicken.common.model.PageResult;
import com.example.webchicken.modules.catalog.dao.CategoryDAO;
import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.catalog.model.dto.request.ProductFilterCriteria;
import com.example.webchicken.modules.catalog.model.dto.response.ProductDetailResponse;
import com.example.webchicken.modules.catalog.model.dto.response.ProductSummaryResponse;
import com.example.webchicken.modules.catalog.model.entity.CategoryEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductEntity;
import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import com.example.webchicken.modules.catalog.service.impl.ProductServiceImpl;
import com.example.webchicken.modules.order.service.OrderService;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.review.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ProductReviewIntegrationTest {

    private ProductDAO productDAO;
    private ProductImageDAO productImageDAO;
    private ProductVariantDAO productVariantDAO;
    private CategoryDAO categoryDAO;
    private ReviewService reviewService;
    private OrderService orderService;
    private ProductServiceImpl service;

    @BeforeEach
    void setUp() {
        productDAO = mock(ProductDAO.class);
        productImageDAO = mock(ProductImageDAO.class);
        productVariantDAO = mock(ProductVariantDAO.class);
        categoryDAO = mock(CategoryDAO.class);
        reviewService = mock(ReviewService.class);
        orderService = mock(OrderService.class);

        service = new ProductServiceImpl(
                productDAO, productImageDAO, productVariantDAO, categoryDAO, reviewService, orderService
        );
    }

    @Test
    void searchProducts_aggregatesRealReviewRatingAndSoldCounts() {
        ProductEntity p = new ProductEntity(
                "p-101", "store-1", "cat-1", "Tai nghe Sony", "Mo ta", ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now()
        );
        when(productDAO.findWithFilters(any())).thenReturn(List.of(p));
        when(productDAO.countWithFilters(any())).thenReturn(1L);

        when(reviewService.getProductReviewSummaries(anyList())).thenReturn(Map.of(
                "p-101", new ReviewSummaryResponse("p-101", 4.8, 15, 12, 3, 0, 0, 0)
        ));
        when(orderService.getProductSoldCounts(anyList())).thenReturn(Map.of(
                "p-101", 88
        ));

        ProductFilterCriteria criteria = new ProductFilterCriteria(
                null, null, null, null, null, ProductStatus.ACTIVE, "newest", 0, 20
        );

        PageResult<ProductSummaryResponse> result = service.searchProducts(criteria);

        assertNotNull(result);
        assertEquals(1, result.items().size());
        ProductSummaryResponse item = result.items().get(0);
        assertEquals("p-101", item.id());
        assertEquals(4.8, item.rating());
        assertEquals(15, item.ratingCount());
        assertEquals(88, item.soldCount());
    }

    @Test
    void getProductDetail_includesRealReviewSummaryAndSoldCount() {
        ProductEntity p = new ProductEntity(
                "p-202", "store-1", "cat-1", "iPhone 16", "Mo ta", ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now()
        );
        when(productDAO.findById("p-202")).thenReturn(Optional.of(p));
        when(categoryDAO.findById("cat-1")).thenReturn(Optional.of(new CategoryEntity("cat-1", "Điện Thoại", "Mo ta", LocalDateTime.now())));
        when(reviewService.getProductReviewSummary("p-202")).thenReturn(
                new ReviewSummaryResponse("p-202", 5.0, 7, 7, 0, 0, 0, 0)
        );
        when(orderService.getProductSoldCounts(anyList())).thenReturn(Map.of(
                "p-202", 42
        ));

        ProductDetailResponse detail = service.getProductDetail("p-202");

        assertNotNull(detail);
        assertEquals("p-202", detail.id());
        assertEquals(5.0, detail.rating());
        assertEquals(7, detail.ratingCount());
        assertEquals(42, detail.soldCount());
    }
}
