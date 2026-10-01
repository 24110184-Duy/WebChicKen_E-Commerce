package com.example.webchicken.common.constant;

/** Tiền tố đường dẫn API (khớp ARCHITECTURE.md mục 6). */
public final class ApiPaths {
    private ApiPaths() {}
    public static final String API_V1        = "/api/v1";
    public static final String AUTH          = API_V1 + "/auth";
    public static final String CUSTOMERS     = API_V1 + "/customers";
    public static final String SELLERS       = API_V1 + "/sellers";
    public static final String STORES        = API_V1 + "/stores";
    public static final String PRODUCTS      = API_V1 + "/products";
    public static final String CATEGORIES    = API_V1 + "/categories";
    public static final String CARTS         = API_V1 + "/carts";
    public static final String ORDERS        = API_V1 + "/orders";
    public static final String PAYMENTS      = API_V1 + "/payments";
    public static final String VOUCHERS      = API_V1 + "/vouchers";
    public static final String REVIEWS       = API_V1 + "/reviews";
    public static final String MEDIA         = API_V1 + "/media";
    public static final String ADMIN         = API_V1 + "/admin";
    public static final String HEALTH        = API_V1 + "/system/health";
}
