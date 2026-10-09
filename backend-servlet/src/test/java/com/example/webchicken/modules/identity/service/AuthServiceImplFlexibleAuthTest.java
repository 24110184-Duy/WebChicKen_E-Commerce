package com.example.webchicken.modules.identity.service;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.model.dto.request.LoginRequest;
import com.example.webchicken.modules.identity.model.dto.request.RegisterRequest;
import com.example.webchicken.modules.identity.model.dto.response.AuthResponse;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthServiceImplFlexibleAuthTest {

    private UserDAO userDAO;
    private UserSessionDAO userSessionDAO;
    private CustomerDAO customerDAO;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userDAO = mock(UserDAO.class);
        userSessionDAO = mock(UserSessionDAO.class);
        customerDAO = mock(CustomerDAO.class);
        authService = new AuthServiceImpl(userDAO, userSessionDAO, customerDAO);
    }

    @Test
    @DisplayName("Đăng ký thành công chỉ với username và password")
    void testRegisterWithUsernameOnly() {
        RegisterRequest req = new RegisterRequest(
                "chicky_hero", // identifier
                null, null, null,
                "password123",
                null
        );

        when(userDAO.existsByUsername("chicky_hero")).thenReturn(false);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.accessToken());
        assertEquals("chicky_hero", resp.user().username());
        assertEquals("chicky_hero", resp.user().fullName());
        assertNull(resp.user().email());

        ArgumentCaptor<CustomerEntity> captor = ArgumentCaptor.forClass(CustomerEntity.class);
        verify(customerDAO).save(captor.capture());
        CustomerEntity saved = captor.getValue();
        assertEquals("chicky_hero", saved.getUsername());
        assertNull(saved.getEmail());
    }

    @Test
    @DisplayName("Đăng ký thành công chỉ với phone và password")
    void testRegisterWithPhoneOnly() {
        RegisterRequest req = new RegisterRequest(
                "0987654321", // phone
                null, null, null,
                "password123",
                null
        );

        when(userDAO.existsByPhone("0987654321")).thenReturn(false);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("0987654321", resp.user().phone());
        assertTrue(resp.user().fullName().contains("4321"));
        assertNull(resp.user().email());

        verify(customerDAO).save(any(CustomerEntity.class));
    }

    @Test
    @DisplayName("Đăng ký thành công chỉ với email và password")
    void testRegisterWithEmailOnly() {
        RegisterRequest req = new RegisterRequest(
                "test@domain.com",
                null, null, null,
                "password123",
                "Nguyen Van A"
        );

        when(userDAO.existsByEmail("test@domain.com")).thenReturn(false);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("test@domain.com", resp.user().email());
        assertEquals("Nguyen Van A", resp.user().fullName());

        verify(customerDAO).save(any(CustomerEntity.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại nếu thiếu cả 3 thông tin định danh")
    void testRegisterFailsWhenNoIdentifier() {
        RegisterRequest req = new RegisterRequest(
                null, null, null, null,
                "password123",
                "No Identifier"
        );

        assertThrows(ValidationException.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("Đăng ký thất bại nếu trùng username đã có")
    void testRegisterFailsOnDuplicateUsername() {
        RegisterRequest req = new RegisterRequest(
                "existing_user",
                null, null, null,
                "password123",
                null
        );

        when(userDAO.existsByUsername("existing_user")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("Đăng nhập thành công bằng bất kỳ 1 trong 3 thông tin: username, email hoặc phone")
    void testLoginWithFlexibleIdentifier() {
        CustomerEntity user = new CustomerEntity();
        user.setUserId("user-123");
        user.setUsername("chicky_hero");
        user.setEmail("chicky@gmail.com");
        user.setPhone("0912345678");
        user.setFullName("Chicky Master");
        user.setStatus(UserStatus.ACTIVE);
        // BCrypt hash of "secret123"
        user.setPasswordHash(at.favre.lib.crypto.bcrypt.BCrypt.withDefaults().hashToString(12, "secret123".toCharArray()));

        when(userDAO.findByIdentifier("0912345678")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest("0912345678", null, "secret123");
        AuthResponse resp = authService.login(req);

        assertNotNull(resp);
        assertEquals("user-123", resp.user().userId());
        assertEquals("chicky_hero", resp.user().username());
    }

    @Test
    @DisplayName("Đăng ký thất bại khi số điện thoại không hợp lệ tại Việt Nam (+84)")
    void testRegisterWithInvalidVietnamesePhoneFails() {
        RegisterRequest req = new RegisterRequest(
                "0123456789", // Số ảo, không thuộc nhà mạng nào tại VN
                null, null, null,
                "password123",
                null
        );

        assertThrows(ValidationException.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("Đăng ký thành công với đầu số quốc tế +84 và tự động chuẩn hóa về 0xxxxxxxxx")
    void testRegisterWithInternationalVNPhoneSuccess() {
        RegisterRequest req = new RegisterRequest(
                "+84987654321", // Viettel quốc tế
                null, null, null,
                "password123",
                null
        );

        when(userDAO.existsByPhone("0987654321")).thenReturn(false);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("0987654321", resp.user().phone());
    }
}
