package com.example.webchicken.modules.order.model.dto.response;

import java.util.List;

/**
 * DTO response cho Seller Analytics & Performance Dashboard (TASK-60).
 * Tuân thủ ARCHITECTURE.md 3.5.5 và CODE_PRINCIPLES.md NAM-02, NAM-07 (tiền tệ long minor units).
 */
public record SellerDashboardStatsResponse(
        String storeId,
        String storeName,
        String period,
        StoreRevenueStats revenue,
        StoreOrdersStats ordersSummary,
        StoreInventoryAlerts inventoryAlerts,
        List<DailyRevenuePoint> dailyRevenue,
        List<TopSellingProductItem> topSellingProducts,
        List<RecentOrderItem> recentOrders
) {
    public record StoreRevenueStats(
            long totalRevenueMinor,
            long netRevenueMinor,
            long platformFeeMinor,
            long withdrawableBalanceMinor,
            long pendingSettlementMinor,
            String currency
    ) {}

    public record StoreOrdersStats(
            int totalOrders,
            int pendingOrders,
            int confirmedOrders,
            int shippingOrders,
            int deliveredOrders,
            int cancelledOrders,
            double fulfillmentRate,
            long averageOrderValueMinor
    ) {}

    public record StoreInventoryAlerts(
            int totalProducts,
            int healthyStockCount,
            int lowStockCount,
            int outOfStockCount,
            long totalUnitsInStock
    ) {}

    public record DailyRevenuePoint(
            String date,
            String dayOfWeek,
            long revenueMinor,
            int orderCount,
            int deliveredCount
    ) {}

    public record TopSellingProductItem(
            String productId,
            String productName,
            String categoryName,
            String thumbnailUrl,
            int totalUnitsSold,
            long totalRevenueMinor,
            int remainingStock
    ) {}

    public record RecentOrderItem(
            String orderCode,
            String customerName,
            long totalAmountMinor,
            String status,
            String orderDate,
            int itemsCount
    ) {}
}
