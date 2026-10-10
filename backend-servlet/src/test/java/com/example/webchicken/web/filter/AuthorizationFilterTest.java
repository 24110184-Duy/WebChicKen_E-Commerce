package com.example.webchicken.web.filter;

import com.example.webchicken.common.model.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class AuthorizationFilterTest {

    private AuthorizationFilter filter;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain chain;
    private ByteArrayOutputStream responseBytes;

    @BeforeEach
    void setUp() throws IOException {
        filter = new AuthorizationFilter();
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        chain = mock(FilterChain.class);
        responseBytes = new ByteArrayOutputStream();

        ServletOutputStream servletOutputStream = new ServletOutputStream() {
            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setWriteListener(WriteListener writeListener) {}

            @Override
            public void write(int b) {
                responseBytes.write(b);
            }
        };

        when(response.getOutputStream()).thenReturn(servletOutputStream);
    }

    @Test
    @DisplayName("Khách hàng thông thường (CUSTOMER) được phép gửi đơn đăng ký Seller tại /api/v1/seller-applications")
    void shouldAllowCustomerToApplySellerApplication() throws Exception {
        AuthenticatedUser customer = new AuthenticatedUser("cust-123", "cust@example.com", List.of("CUSTOMER"));
        when(request.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR)).thenReturn(customer);
        when(request.getRequestURI()).thenReturn("/api/v1/seller-applications");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("Khách hàng thông thường được phép xem hồ sơ đăng ký của mình tại /api/v1/seller-applications/me")
    void shouldAllowCustomerToViewOwnSellerApplication() throws Exception {
        AuthenticatedUser customer = new AuthenticatedUser("cust-123", "cust@example.com", List.of("CUSTOMER"));
        when(request.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR)).thenReturn(customer);
        when(request.getRequestURI()).thenReturn("/api/v1/seller-applications/me");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("Khách hàng thông thường truy cập /api/v1/seller/orders sẽ bị chặn 403 Forbidden")
    void shouldBlockCustomerFromSellerPortal() throws Exception {
        AuthenticatedUser customer = new AuthenticatedUser("cust-123", "cust@example.com", List.of("CUSTOMER"));
        when(request.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR)).thenReturn(customer);
        when(request.getRequestURI()).thenReturn("/api/v1/seller/orders");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, never()).doFilter(request, response);
        verify(response, times(1)).setStatus(HttpServletResponse.SC_FORBIDDEN);

        String jsonResponse = responseBytes.toString("UTF-8");
        assertTrue(jsonResponse.contains("Chỉ tài khoản Người bán mới có quyền"));
    }

    @Test
    @DisplayName("Người bán (SELLER) truy cập /api/v1/seller/orders được phép qua filter")
    void shouldAllowSellerToAccessSellerPortal() throws Exception {
        AuthenticatedUser seller = new AuthenticatedUser("seller-123", "seller@example.com", List.of("SELLER"));
        when(request.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR)).thenReturn(seller);
        when(request.getRequestURI()).thenReturn("/api/v1/seller/orders");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("Người bán không được phép truy cập /api/v1/admin/users")
    void shouldBlockSellerFromAdminPortal() throws Exception {
        AuthenticatedUser seller = new AuthenticatedUser("seller-123", "seller@example.com", List.of("SELLER"));
        when(request.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR)).thenReturn(seller);
        when(request.getRequestURI()).thenReturn("/api/v1/admin/users");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, never()).doFilter(request, response);
        verify(response, times(1)).setStatus(HttpServletResponse.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("Quản trị viên (ADMIN) được phép truy cập /api/v1/admin/users và /api/v1/seller/orders")
    void shouldAllowAdminToAccessAdminAndSellerPortal() throws Exception {
        AuthenticatedUser admin = new AuthenticatedUser("admin-123", "admin@example.com", List.of("ADMIN"));
        when(request.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR)).thenReturn(admin);
        when(request.getRequestURI()).thenReturn("/api/v1/admin/users");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_FORBIDDEN);
    }
}
