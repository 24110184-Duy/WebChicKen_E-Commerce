package com.example.webchicken.web.filter;

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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class AuthenticationFilterTest {

    private AuthenticationFilter filter;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain chain;
    private ByteArrayOutputStream responseBytes;

    @BeforeEach
    void setUp() throws IOException {
        filter = new AuthenticationFilter();
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
    @DisplayName("Endpoint đăng nhập Google /api/v1/auth/social/google không cần Bearer Token và được cho phép qua filter")
    void shouldAllowGoogleSocialAuthEndpointWithoutToken() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/auth/social/google");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    @DisplayName("Endpoint đăng nhập Facebook /api/v1/auth/social/facebook không cần Bearer Token và được cho phép qua filter")
    void shouldAllowFacebookSocialAuthEndpointWithoutToken() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/auth/social/facebook");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    @DisplayName("Endpoint khi chạy với Tomcat Context Path /web1_war_exploded vẫn nhận diện đúng public path")
    void shouldAllowGoogleSocialAuthWithContextPath() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/web1_war_exploded/api/v1/auth/social/google");
        when(request.getContextPath()).thenReturn("/web1_war_exploded");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    @DisplayName("Endpoint bảo vệ /api/v1/users/me nếu không có token sẽ bị từ chối 401 với thông báo đăng nhập")
    void shouldRejectProtectedEndpointWithoutToken() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/users/me");
        when(request.getContextPath()).thenReturn("");

        filter.doFilter(request, response, chain);

        verify(chain, never()).doFilter(request, response);
        verify(response, times(1)).setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String jsonResponse = responseBytes.toString("UTF-8");
        assertTrue(jsonResponse.contains("Vui lòng đăng nhập để thực hiện thao tác này"));
    }
}
