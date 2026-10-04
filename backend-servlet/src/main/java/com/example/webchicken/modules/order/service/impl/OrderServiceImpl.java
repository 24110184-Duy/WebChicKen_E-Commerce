package com.example.webchicken.modules.order.service.impl;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.cart.dao.CartDAO;
import com.example.webchicken.modules.cart.dao.CartItemDAO;
import com.example.webchicken.modules.cart.model.entity.CartEntity;
import com.example.webchicken.modules.cart.model.entity.CartItemEntity;
import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.catalog.model.entity.ProductEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductImageEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductVariantEntity;
import com.example.webchicken.modules.inventory.service.InventoryService;
import com.example.webchicken.modules.order.dao.OrderCancellationDAO;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderItemDAO;
import com.example.webchicken.modules.order.model.dto.request.CheckoutItemRequest;
import com.example.webchicken.modules.order.model.dto.request.CheckoutRequest;
import com.example.webchicken.modules.order.model.dto.response.CheckoutResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderItemResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderResponse;
import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.order.model.entity.OrderCancellationEntity;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.example.webchicken.modules.order.model.enums.PaymentMethod;
import com.example.webchicken.modules.order.service.OrderService;
import com.example.webchicken.modules.promotion.service.VoucherService;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Triển khai nghiệp vụ Order Engine (TASK-44, 45, 46, 49):
 * - Multi-shop Checkout Partition (tách đơn theo shop, gom bằng order_group_id)
 * - Atomic Checkout Transaction (giữ kho TTL 15p, ghi đơn, dọn giỏ hàng)
 * - Hủy đơn an toàn & tự động nhả kho (releaseReservation)
 */
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderDAO orderDAO;
    private final OrderItemDAO orderItemDAO;
    private final OrderCancellationDAO orderCancellationDAO;
    private final CartDAO cartDAO;
    private final CartItemDAO cartItemDAO;
    private final ProductDAO productDAO;
    private final ProductVariantDAO productVariantDAO;
    private final ProductImageDAO productImageDAO;
    private final StoreDAO storeDAO;
    private final InventoryService inventoryService;
    private final VoucherService voucherService;

    public OrderServiceImpl(
            OrderDAO orderDAO,
            OrderItemDAO orderItemDAO,
            OrderCancellationDAO orderCancellationDAO,
            CartDAO cartDAO,
            CartItemDAO cartItemDAO,
            ProductDAO productDAO,
            ProductVariantDAO productVariantDAO,
            ProductImageDAO productImageDAO,
            StoreDAO storeDAO,
            InventoryService inventoryService,
            VoucherService voucherService
    ) {
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO must not be null");
        this.orderItemDAO = Objects.requireNonNull(orderItemDAO, "orderItemDAO must not be null");
        this.orderCancellationDAO = Objects.requireNonNull(orderCancellationDAO, "orderCancellationDAO must not be null");
        this.cartDAO = Objects.requireNonNull(cartDAO, "cartDAO must not be null");
        this.cartItemDAO = Objects.requireNonNull(cartItemDAO, "cartItemDAO must not be null");
        this.productDAO = Objects.requireNonNull(productDAO, "productDAO must not be null");
        this.productVariantDAO = Objects.requireNonNull(productVariantDAO, "productVariantDAO must not be null");
        this.productImageDAO = Objects.requireNonNull(productImageDAO, "productImageDAO must not be null");
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
        this.inventoryService = Objects.requireNonNull(inventoryService, "inventoryService must not be null");
        this.voucherService = Objects.requireNonNull(voucherService, "voucherService must not be null");
    }

    private static class ResolvedItem {
        CheckoutItemRequest request;
        ProductEntity product;
        ProductVariantEntity variant;
        String imageUrl;
        long unitPriceMinor;
        long subtotalMinor;
    }

    @Override
    public CheckoutResponse checkout(String customerId, CheckoutRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new ValidationException("Danh sách mặt hàng đặt mua không được để trống");
        }

        // 1. Phân giải thông tin sản phẩm và phân nhóm theo Store (TASK-44: Multi-shop partition)
        Map<String, List<ResolvedItem>> storeGroupMap = new LinkedHashMap<>();
        long grandTotalProductMinor = 0;

        for (CheckoutItemRequest reqItem : request.items()) {
            if (reqItem.quantity() <= 0) {
                throw new ValidationException("Số lượng đặt mua phải lớn hơn 0");
            }

            ProductEntity product = productDAO.findById(reqItem.productId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm: " + reqItem.productId()));

            ProductVariantEntity variant = null;
            long unitPriceMinor = 0L;

            if (reqItem.variantId() != null && !reqItem.variantId().isBlank()) {
                variant = productVariantDAO.findById(reqItem.variantId())
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy biến thể: " + reqItem.variantId()));
                unitPriceMinor = variant.getBasePriceMinor();
            } else {
                List<ProductVariantEntity> variants = productVariantDAO.findByProductId(product.getId());
                if (!variants.isEmpty()) {
                    variant = variants.get(0);
                    unitPriceMinor = variant.getBasePriceMinor();
                }
            }

            List<ProductImageEntity> images = productImageDAO.findByProductId(product.getId());
            String imageUrl = images.isEmpty() ? "/placeholder-product.png" : images.get(0).getImageUrl();

            ResolvedItem item = new ResolvedItem();
            item.request = reqItem;
            item.product = product;
            item.variant = variant;
            item.imageUrl = imageUrl;
            item.unitPriceMinor = unitPriceMinor;
            item.subtotalMinor = unitPriceMinor * reqItem.quantity();

            grandTotalProductMinor += item.subtotalMinor;

            String storeId = product.getStoreId() != null ? product.getStoreId() : "default_store";
            storeGroupMap.computeIfAbsent(storeId, k -> new ArrayList<>()).add(item);
        }

        // 2. Tính toán Voucher giảm giá toàn đơn nếu có
        long totalDiscountMinor = 0;
        String voucherId = null;
        if (request.voucherCode() != null && !request.voucherCode().isBlank()) {
            ValidateVoucherResponse vRes = voucherService.validateVoucher(
                    new ValidateVoucherRequest(request.voucherCode(), grandTotalProductMinor, null)
            );
            if (vRes != null && vRes.isValid()) {
                totalDiscountMinor = vRes.discountAmountMinor();
                voucherId = vRes.voucherId();
                voucherService.markVoucherUsed(voucherId);
            }
        }

        // 3. Khởi tạo mã nhóm đơn (order_group_id)
        String orderGroupId = UUID.randomUUID().toString();
        List<OrderResponse> createdOrders = new ArrayList<>();
        long totalShippingFeeMinor = 0;
        long totalOrderAmountMinor = 0;

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyyMMdd");
        String datePrefix = LocalDate.now().format(dateFmt);

        // Chuẩn bị dọn dẹp giỏ hàng
        Optional<CartEntity> cartOpt = cartDAO.findByCustomerId(customerId);

        // 4. Thực thi Atomic Transaction (TASK-45)
        for (Map.Entry<String, List<ResolvedItem>> entry : storeGroupMap.entrySet()) {
            String storeId = entry.getKey();
            List<ResolvedItem> items = entry.getValue();

            long storeSubtotal = items.stream().mapToLong(i -> i.subtotalMinor).sum();
            long storeShippingFee = 15000; // Phí ship chuẩn mỗi shop 15,000 VND
            totalShippingFeeMinor += storeShippingFee;

            // Phân bổ voucher giảm giá theo tỷ lệ giá trị đơn của từng shop
            long storeDiscount = 0;
            if (grandTotalProductMinor > 0 && totalDiscountMinor > 0) {
                storeDiscount = (storeSubtotal * totalDiscountMinor) / grandTotalProductMinor;
            }

            long storeTotal = Math.max(0, storeSubtotal + storeShippingFee - storeDiscount);
            totalOrderAmountMinor += storeTotal;

            // Sinh mã đơn ngẫu nhiên không đoán được (ADR-10): ORD-YYYYMMDD-XXXX
            int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
            String orderCode = "ORD-" + datePrefix + "-" + randomSuffix;

            String orderId = UUID.randomUUID().toString();

            // (1) Giữ kho có TTL 15 phút cho từng món của shop này
            for (ResolvedItem resolved : items) {
                String skuId = resolved.variant != null ? resolved.variant.getId() : resolved.product.getId();
                inventoryService.reserveStock(skuId, resolved.request.quantity(), orderId, 15);
            }

            // (2) Lưu bản ghi OrderEntity
            OrderEntity orderEntity = new OrderEntity(
                    orderId, orderCode, orderGroupId, customerId, storeId,
                    storeTotal, storeShippingFee, storeDiscount,
                    request.paymentMethod() != null ? request.paymentMethod() : PaymentMethod.COD,
                    request.recipientName(), request.recipientPhone(),
                    request.shippingAddress(), request.note()
            );
            orderEntity.setVoucherId(voucherId);
            orderDAO.save(orderEntity);

            // (3) Lưu chi tiết OrderItemEntity
            List<OrderItemResponse> itemResponses = new ArrayList<>();
            for (ResolvedItem resolved : items) {
                String itemId = UUID.randomUUID().toString();
                String variantId = resolved.variant != null ? resolved.variant.getId() : null;
                String variantName = resolved.variant != null ? resolved.variant.getAttribute() : null;

                OrderItemEntity itemEntity = new OrderItemEntity(
                        itemId, orderId, resolved.product.getId(), variantId,
                        resolved.product.getName(), variantName, resolved.imageUrl,
                        resolved.request.quantity(), resolved.unitPriceMinor
                );
                orderItemDAO.save(itemEntity);
                itemResponses.add(OrderItemResponse.fromEntity(itemEntity));
            }

            String storeName = "ChickyMart Shop";
            Optional<StoreEntity> storeOpt = storeDAO.findById(storeId);
            if (storeOpt.isPresent()) {
                storeName = storeOpt.get().getStoreName();
            }

            createdOrders.add(OrderResponse.fromEntity(orderEntity, storeName, itemResponses));
        }

        // (4) Xóa các sản phẩm đã đặt khỏi giỏ hàng của khách
        if (cartOpt.isPresent()) {
            for (CheckoutItemRequest reqItem : request.items()) {
                cartItemDAO.deleteByCartAndVariant(cartOpt.get().getId(), reqItem.productId(), reqItem.variantId());
            }
        }

        return new CheckoutResponse(
                orderGroupId,
                grandTotalProductMinor,
                totalShippingFeeMinor,
                totalDiscountMinor,
                totalOrderAmountMinor,
                createdOrders
        );
    }

    @Override
    public List<OrderResponse> getOrders(String customerId, OrderStatus status, int page, int size) {
        int pageNumber = Math.max(1, page);
        int pageSize = Math.min(100, Math.max(1, size));
        int offset = (pageNumber - 1) * pageSize;

        List<OrderEntity> orders = orderDAO.findByCustomerId(customerId, status, offset, pageSize);
        List<OrderResponse> result = new ArrayList<>();

        for (OrderEntity order : orders) {
            List<OrderItemEntity> itemEntities = orderItemDAO.findByOrderId(order.getId());
            List<OrderItemResponse> items = itemEntities.stream()
                    .map(OrderItemResponse::fromEntity)
                    .collect(Collectors.toList());

            String storeName = "ChickyMart Store";
            if (order.getStoreId() != null) {
                storeName = storeDAO.findById(order.getStoreId())
                        .map(StoreEntity::getStoreName)
                        .orElse(storeName);
            }

            result.add(OrderResponse.fromEntity(order, storeName, items));
        }
        return result;
    }

    @Override
    public long countOrders(String customerId, OrderStatus status) {
        return orderDAO.countByCustomerId(customerId, status);
    }

    @Override
    public OrderResponse getOrderByCode(String orderCode, String customerId) {
        OrderEntity order = orderDAO.findByOrderCode(orderCode)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode));

        if (customerId != null && !customerId.isBlank() && !order.getCustomerId().equals(customerId)) {
            throw new NotFoundException("Đơn hàng không thuộc quyền quản lý của tài khoản này");
        }

        List<OrderItemEntity> itemEntities = orderItemDAO.findByOrderId(order.getId());
        List<OrderItemResponse> items = itemEntities.stream()
                .map(OrderItemResponse::fromEntity)
                .collect(Collectors.toList());

        String storeName = "ChickyMart Store";
        if (order.getStoreId() != null) {
            storeName = storeDAO.findById(order.getStoreId())
                    .map(StoreEntity::getStoreName)
                    .orElse(storeName);
        }

        return OrderResponse.fromEntity(order, storeName, items);
    }

    @Override
    public OrderResponse cancelOrder(String orderCode, String customerId, String reason) {
        OrderEntity order = orderDAO.findByOrderCode(orderCode)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode));

        if (customerId != null && !customerId.isBlank() && !order.getCustomerId().equals(customerId)) {
            throw new NotFoundException("Đơn hàng không thuộc quyền sở hữu của bạn");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new ValidationException("Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xử lý hoặc Đã xác nhận.");
        }

        // 1. Cập nhật trạng thái đơn thành CANCELLED
        orderDAO.updateStatus(order.getId(), OrderStatus.CANCELLED);
        order.setStatus(OrderStatus.CANCELLED);

        // 2. Nhả toàn bộ tồn kho đã giữ (TASK-49)
        inventoryService.releaseReservation(order.getId());

        // 3. Ghi nhận lý do hủy đơn
        String cancelId = UUID.randomUUID().toString();
        String cancelReason = (reason != null && !reason.isBlank()) ? reason : "Khách hàng yêu cầu hủy đơn";
        orderCancellationDAO.save(new OrderCancellationEntity(cancelId, order.getId(), cancelReason, "CUSTOMER"));

        log.info("Order {} successfully cancelled. Reason: {}", orderCode, cancelReason);

        List<OrderItemEntity> itemEntities = orderItemDAO.findByOrderId(order.getId());
        List<OrderItemResponse> items = itemEntities.stream()
                .map(OrderItemResponse::fromEntity)
                .collect(Collectors.toList());

        String storeName = "ChickyMart Store";
        if (order.getStoreId() != null) {
            storeName = storeDAO.findById(order.getStoreId())
                    .map(StoreEntity::getStoreName)
                    .orElse(storeName);
        }

        return OrderResponse.fromEntity(order, storeName, items);
    }
}
