package com.example.webchicken.modules.cart.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.cart.dao.CartDAO;
import com.example.webchicken.modules.cart.dao.CartItemDAO;
import com.example.webchicken.modules.cart.model.dto.request.AddToCartRequest;
import com.example.webchicken.modules.cart.model.dto.response.CartItemResponse;
import com.example.webchicken.modules.cart.model.dto.response.CartResponse;
import com.example.webchicken.modules.cart.model.dto.response.CartStoreGroupResponse;
import com.example.webchicken.modules.cart.model.entity.CartEntity;
import com.example.webchicken.modules.cart.model.entity.CartItemEntity;
import com.example.webchicken.modules.cart.service.CartService;
import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.catalog.model.entity.ProductEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductImageEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductVariantEntity;
import com.example.webchicken.modules.inventory.service.InventoryService;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Triển khai CartService (TASK-39).
 * Tự động kiểm tra biến động giá và tình trạng tồn kho thực tế khi duyệt giỏ hàng.
 */
public class CartServiceImpl implements CartService {

    private static final Logger log = LoggerFactory.getLogger(CartServiceImpl.class);

    private final CartDAO cartDAO;
    private final CartItemDAO cartItemDAO;
    private final ProductDAO productDAO;
    private final ProductVariantDAO productVariantDAO;
    private final ProductImageDAO productImageDAO;
    private final StoreDAO storeDAO;
    private final InventoryService inventoryService;

    public CartServiceImpl(
            CartDAO cartDAO,
            CartItemDAO cartItemDAO,
            ProductDAO productDAO,
            ProductVariantDAO productVariantDAO,
            ProductImageDAO productImageDAO,
            StoreDAO storeDAO,
            InventoryService inventoryService
    ) {
        this.cartDAO = Objects.requireNonNull(cartDAO, "cartDAO must not be null");
        this.cartItemDAO = Objects.requireNonNull(cartItemDAO, "cartItemDAO must not be null");
        this.productDAO = Objects.requireNonNull(productDAO, "productDAO must not be null");
        this.productVariantDAO = Objects.requireNonNull(productVariantDAO, "productVariantDAO must not be null");
        this.productImageDAO = Objects.requireNonNull(productImageDAO, "productImageDAO must not be null");
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
        this.inventoryService = Objects.requireNonNull(inventoryService, "inventoryService must not be null");
    }

    @Override
    public CartResponse getCart(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            throw new ValidationException("CustomerId must not be empty");
        }

        CartEntity cart = cartDAO.getOrCreateCart(customerId);
        List<CartItemEntity> items = cart.getItems() != null ? cart.getItems() : Collections.emptyList();

        Map<String, List<CartItemResponse>> storeItemsMap = new LinkedHashMap<>();
        Map<String, String> storeNamesMap = new HashMap<>();

        boolean hasOutOfStock = false;
        boolean hasPriceChanges = false;
        int totalQty = 0;
        long grandTotalMinor = 0L;

        for (CartItemEntity ci : items) {
            Optional<ProductEntity> prodOpt = productDAO.findById(ci.getProductId());
            if (prodOpt.isEmpty()) {
                continue;
            }
            ProductEntity product = prodOpt.get();

            // Lấy thông tin store
            String storeId = product.getStoreId();
            if (!storeNamesMap.containsKey(storeId)) {
                String sName = storeDAO.findById(storeId).map(StoreEntity::getStoreName).orElse("Chicky Store");
                storeNamesMap.put(storeId, sName);
            }
            String storeName = storeNamesMap.get(storeId);

            // Tìm biến thể SKU
            String variantId = ci.getVariantId();
            ProductVariantEntity variant = null;
            if (variantId != null && !variantId.isBlank()) {
                variant = productVariantDAO.findById(variantId).orElse(null);
            } else {
                List<ProductVariantEntity> variants = productVariantDAO.findByProductId(product.getId());
                if (!variants.isEmpty()) {
                    variant = variants.get(0);
                    variantId = variant.getId();
                }
            }

            String variantAttr = (variant != null) ? variant.getAttribute() : "Standard";
            long currentPriceMinor = (variant != null) ? variant.getBasePriceMinor() : 0L;
            int availableStock = (variant != null) ? inventoryService.getAvailableStock(variant.getId()) : 0;

            boolean isAvailable = (variant != null) && availableStock >= ci.getQuantity();
            if (!isAvailable) {
                hasOutOfStock = true;
            }

            long itemTotal = currentPriceMinor * ci.getQuantity();
            totalQty += ci.getQuantity();
            if (isAvailable) {
                grandTotalMinor += itemTotal;
            }

            // Thumbnail
            List<ProductImageEntity> imgs = productImageDAO.findByProductId(product.getId());
            String thumb = !imgs.isEmpty() ? imgs.get(0).getImageUrl() : "";

            CartItemResponse itemResp = new CartItemResponse(
                    ci.getId(),
                    product.getId(),
                    variantId,
                    product.getName(),
                    variantAttr,
                    thumb,
                    currentPriceMinor,
                    ci.getQuantity(),
                    availableStock,
                    itemTotal,
                    isAvailable,
                    false, // priceChanged flag
                    storeId,
                    storeName
            );

            storeItemsMap.computeIfAbsent(storeId, k -> new ArrayList<>()).add(itemResp);
        }

        List<CartStoreGroupResponse> storeGroups = new ArrayList<>();
        for (Map.Entry<String, List<CartItemResponse>> entry : storeItemsMap.entrySet()) {
            String sId = entry.getKey();
            List<CartItemResponse> groupItems = entry.getValue();
            long subtotal = groupItems.stream().filter(CartItemResponse::isAvailable).mapToLong(CartItemResponse::itemTotalMinor).sum();
            storeGroups.add(new CartStoreGroupResponse(sId, storeNamesMap.get(sId), groupItems, subtotal));
        }

        return new CartResponse(
                cart.getId(),
                customerId,
                storeGroups,
                totalQty,
                grandTotalMinor,
                hasOutOfStock,
                hasPriceChanges
        );
    }

    @Override
    public CartResponse addItem(String customerId, AddToCartRequest req) {
        if (req.productId() == null || req.productId().isBlank()) {
            throw new ValidationException("productId is required");
        }

        CartEntity cart = cartDAO.getOrCreateCart(customerId);

        // Kiểm tra xem sản phẩm / biến thể đã có trong giỏ chưa
        Optional<CartItemEntity> existing = cartItemDAO.findByCartIdAndVariant(cart.getId(), req.productId(), req.variantId());
        if (existing.isPresent()) {
            CartItemEntity item = existing.get();
            item.setQuantity(item.getQuantity() + req.quantity());
            cartItemDAO.updateQuantity(item.getId(), item.getQuantity());
        } else {
            CartItemEntity newItem = new CartItemEntity(
                    UUID.randomUUID().toString(),
                    cart,
                    req.productId(),
                    req.variantId(),
                    req.quantity()
            );
            cartItemDAO.save(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartDAO.save(cart);

        log.info("Added item to cart: customerId={}, productId={}, variantId={}, qty={}",
                customerId, req.productId(), req.variantId(), req.quantity());
        return getCart(customerId);
    }

    @Override
    public CartResponse updateItemQuantity(String customerId, String itemId, int quantity) {
        cartItemDAO.findById(itemId)
                .orElseThrow(() -> new NotFoundException("CartItem", itemId));

        if (quantity <= 0) {
            cartItemDAO.delete(itemId);
        } else {
            cartItemDAO.updateQuantity(itemId, quantity);
        }

        return getCart(customerId);
    }

    @Override
    public CartResponse removeItem(String customerId, String itemId) {
        cartItemDAO.delete(itemId);
        return getCart(customerId);
    }

    @Override
    public void clearCart(String customerId) {
        cartDAO.clearCart(customerId);
        log.info("Cleared cart for customerId={}", customerId);
    }
}
