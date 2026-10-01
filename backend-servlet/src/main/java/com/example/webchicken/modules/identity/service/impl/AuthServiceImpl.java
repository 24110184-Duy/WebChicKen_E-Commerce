package com.example.webchicken.modules.identity.service.impl;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.example.webchicken.common.enums.LoyaltyTier;
import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.AuthenticationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.infrastructure.security.JwtProvider;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.model.dto.request.LoginRequest;
import com.example.webchicken.modules.identity.model.dto.request.RegisterRequest;
import com.example.webchicken.modules.identity.model.dto.response.AuthResponse;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.identity.model.entity.UserSessionEntity;
import com.example.webchicken.modules.identity.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserDAO userDAO;
    private final UserSessionDAO userSessionDAO;
    private final CustomerDAO customerDAO;
    private final JwtProvider jwtProvider;

    public AuthServiceImpl(UserDAO userDAO, UserSessionDAO userSessionDAO, CustomerDAO customerDAO) {
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.userSessionDAO = Objects.requireNonNull(userSessionDAO, "userSessionDAO must not be null");
        this.customerDAO = Objects.requireNonNull(customerDAO, "customerDAO must not be null");
        this.jwtProvider = new JwtProvider();
    }

    public AuthServiceImpl(UserDAO userDAO, UserSessionDAO userSessionDAO) {
        this(userDAO, userSessionDAO, new CustomerDAO(userDAO.getEntityManagerFactory()));
    }

    @Override
    public AuthResponse register(RegisterRequest req) {
        if (req.email() == null || req.email().isBlank() || !req.email().contains("@")) {
            throw new ValidationException("Email không đúng định dạng.");
        }
        if (req.password() == null || req.password().length() < 6) {
            throw new ValidationException("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
        }
        if (req.fullName() == null || req.fullName().isBlank()) {
            throw new ValidationException("Họ và tên không được để trống.");
        }

        String normalizedEmail = req.email().trim().toLowerCase();
        if (userDAO.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email [" + normalizedEmail + "] đã tồn tại trên hệ thống.");
        }

        // Mã hóa mật khẩu an toàn với BCrypt
        String hashedPassword = BCrypt.withDefaults().hashToString(12, req.password().toCharArray());

        CustomerEntity customer = new CustomerEntity();
        customer.setUserId(UUID.randomUUID().toString());
        customer.setEmail(normalizedEmail);
        customer.setPasswordHash(hashedPassword);
        customer.setFullName(req.fullName().trim());
        customer.setPhone(req.phone() != null ? req.phone().trim() : null);
        customer.setStatus(UserStatus.ACTIVE);
        customer.setTier(LoyaltyTier.STANDARD);
        customer.setLoyaltyPoint(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        customerDAO.save(customer);
        log.info("Khách hàng mới đã đăng ký thành công: {} ({})", customer.getEmail(), customer.getUserId());

        List<String> roles = List.of("CUSTOMER");
        String accessToken = jwtProvider.generateAccessToken(customer.getUserId(), customer.getEmail(), roles);

        return new AuthResponse(
                accessToken,
                new AuthResponse.UserInfo(
                        customer.getUserId(),
                        customer.getEmail(),
                        customer.getFullName(),
                        customer.getPhone(),
                        customer.getLogoUrl(),
                        roles
                )
        );
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        if (req.email() == null || req.email().isBlank() || req.password() == null || req.password().isBlank()) {
            throw new ValidationException("Vui lòng nhập đầy đủ email và mật khẩu.");
        }

        String normalizedEmail = req.email().trim().toLowerCase();
        UserEntity user = userDAO.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthenticationException("Email hoặc mật khẩu không chính xác."));

        // Kiểm tra mật khẩu qua BCrypt
        BCrypt.Result result = BCrypt.verifyer().verify(req.password().toCharArray(), user.getPasswordHash());
        if (!result.verified) {
            log.warn("Đăng nhập thất bại do sai mật khẩu cho email: {}", normalizedEmail);
            throw new AuthenticationException("Email hoặc mật khẩu không chính xác.");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new AuthenticationException("Tài khoản của bạn đã bị khóa vi phạm chính sách sàn.");
        }

        List<String> roles = resolveUserRoles(user);
        String accessToken = jwtProvider.generateAccessToken(user.getUserId(), user.getEmail(), roles);

        return new AuthResponse(
                accessToken,
                new AuthResponse.UserInfo(
                        user.getUserId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getPhone(),
                        user.getLogoUrl(),
                        roles
                )
        );
    }

    @Override
    public String createRefreshToken(String userId) {
        String token = UUID.randomUUID().toString();
        UserSessionEntity session = new UserSessionEntity();
        session.setSessionId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setCookieContent(token);
        session.setActive(true);
        session.setExpiredAt(LocalDateTime.now().plusDays(7));

        userSessionDAO.save(session);
        return token;
    }

    @Override
    public String refreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new AuthenticationException("Refresh token không hợp lệ.");
        }

        UserSessionEntity session = userSessionDAO.findActiveByCookieContent(rawRefreshToken)
                .orElseThrow(() -> {
                    log.warn("Phát hiện Token Refresh không hợp lệ hoặc đã bị tái sử dụng!");
                    return new AuthenticationException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
                });

        if (session.getExpiredAt().isBefore(LocalDateTime.now())) {
            userSessionDAO.deactivate(session);
            throw new AuthenticationException("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        }

        UserEntity user = userDAO.findById(session.getUserId())
                .orElseThrow(() -> new AuthenticationException("Người dùng không còn tồn tại."));

        if (user.getStatus() == UserStatus.BANNED) {
            userSessionDAO.deactivate(session);
            throw new AuthenticationException("Tài khoản đã bị khóa.");
        }

        // Token Rotation: Hủy session cũ, tạo session mới
        userSessionDAO.deactivate(session);
        createRefreshToken(user.getUserId());

        List<String> roles = resolveUserRoles(user);
        return jwtProvider.generateAccessToken(user.getUserId(), user.getEmail(), roles);
    }

    @Override
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            userSessionDAO.findActiveByCookieContent(rawRefreshToken)
                    .ifPresent(userSessionDAO::deactivate);
        }
    }

    private List<String> resolveUserRoles(UserEntity user) {
        List<String> roles = new ArrayList<>();
        if (user instanceof CustomerEntity) {
            roles.add("CUSTOMER");
        }
        // Kiểm tra loại thực thể kế thừa
        String className = user.getClass().getSimpleName();
        if (className.contains("Seller")) {
            roles.add("SELLER");
        } else if (className.contains("Admin")) {
            roles.add("SUPER_ADMIN");
        }
        if (roles.isEmpty()) {
            roles.add("CUSTOMER");
        }
        return roles;
    }
}
