package com.example.webchicken.modules.identity.service.impl;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.example.webchicken.common.enums.LoyaltyTier;
import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.AuthenticationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.infrastructure.security.JwtProvider;
import com.example.webchicken.infrastructure.security.OAuthVerifier;
import com.example.webchicken.infrastructure.security.SocialAuthVerifier;
import com.example.webchicken.infrastructure.security.SocialUserProfile;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.dao.UserSocialAccountDAO;
import com.example.webchicken.modules.identity.model.dto.request.LoginRequest;
import com.example.webchicken.modules.identity.model.dto.request.RegisterRequest;
import com.example.webchicken.modules.identity.model.dto.request.SocialLoginRequest;
import com.example.webchicken.modules.identity.model.dto.response.AuthResponse;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.identity.model.entity.UserSessionEntity;
import com.example.webchicken.modules.identity.model.entity.UserSocialAccountEntity;
import com.example.webchicken.modules.identity.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserDAO userDAO;
    private final UserSessionDAO userSessionDAO;
    private final CustomerDAO customerDAO;
    private final UserSocialAccountDAO userSocialAccountDAO;
    private final OAuthVerifier oauthVerifier;
    private final JwtProvider jwtProvider;

    public AuthServiceImpl(
            UserDAO userDAO,
            UserSessionDAO userSessionDAO,
            CustomerDAO customerDAO,
            UserSocialAccountDAO userSocialAccountDAO,
            OAuthVerifier oauthVerifier
    ) {
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.userSessionDAO = Objects.requireNonNull(userSessionDAO, "userSessionDAO must not be null");
        this.customerDAO = Objects.requireNonNull(customerDAO, "customerDAO must not be null");
        this.userSocialAccountDAO = userSocialAccountDAO != null ? userSocialAccountDAO
                : (userDAO.getEntityManagerFactory() != null ? new UserSocialAccountDAO(userDAO.getEntityManagerFactory()) : null);
        this.oauthVerifier = oauthVerifier != null ? oauthVerifier : new SocialAuthVerifier();
        this.jwtProvider = new JwtProvider();
    }

    public AuthServiceImpl(UserDAO userDAO, UserSessionDAO userSessionDAO, CustomerDAO customerDAO) {
        this(
                userDAO,
                userSessionDAO,
                customerDAO,
                (userDAO != null && userDAO.getEntityManagerFactory() != null) ? new UserSocialAccountDAO(userDAO.getEntityManagerFactory()) : null,
                new SocialAuthVerifier()
        );
    }

    public AuthServiceImpl(UserDAO userDAO, UserSessionDAO userSessionDAO) {
        this(
                userDAO,
                userSessionDAO,
                (userDAO != null && userDAO.getEntityManagerFactory() != null) ? new CustomerDAO(userDAO.getEntityManagerFactory()) : null,
                (userDAO != null && userDAO.getEntityManagerFactory() != null) ? new UserSocialAccountDAO(userDAO.getEntityManagerFactory()) : null,
                new SocialAuthVerifier()
        );
    }



    @Override
    public AuthResponse register(RegisterRequest req) {
        if (req == null) {
            throw new ValidationException("Dữ liệu đăng ký không được để trống.");
        }
        if (req.password() == null || req.password().length() < 6) {
            throw new ValidationException("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
        }

        String resolvedEmail = null;
        String resolvedPhone = null;
        String resolvedUsername = null;

        // 1. Phân giải từ ô identifier tổng hợp nếu có
        if (req.identifier() != null && !req.identifier().trim().isBlank()) {
            String raw = req.identifier().trim();
            if (raw.contains("@")) {
                resolvedEmail = raw.toLowerCase();
            } else if (raw.matches("^(0|\\+84|84)?[0-9]{9,11}$")) {
                resolvedPhone = raw;
            } else {
                resolvedUsername = raw;
            }
        }

        // 2. Override hoặc bổ sung nếu người dùng truyền trực tiếp các trường cụ thể
        if (req.email() != null && !req.email().trim().isBlank()) {
            resolvedEmail = req.email().trim().toLowerCase();
        }
        if (req.phone() != null && !req.phone().trim().isBlank()) {
            resolvedPhone = req.phone().trim();
        }
        if (req.username() != null && !req.username().trim().isBlank()) {
            resolvedUsername = req.username().trim();
        }

        // 3. Kiểm tra: Phải có ít nhất 1 trong 3 thông tin
        if (resolvedEmail == null && resolvedPhone == null && resolvedUsername == null) {
            throw new ValidationException("Vui lòng cung cấp ít nhất 1 trong 3 thông tin: Tên đăng nhập (Username), Email hoặc Số điện thoại.");
        }

        // Validate định dạng nếu có
        if (resolvedEmail != null && (!resolvedEmail.contains("@") || resolvedEmail.length() < 5)) {
            throw new ValidationException("Email không đúng định dạng.");
        }
        if (resolvedUsername != null && resolvedUsername.length() < 3) {
            throw new ValidationException("Tên đăng nhập (Username) phải có độ dài tối thiểu 3 ký tự.");
        }
        if (resolvedPhone != null) {
            if (!com.example.webchicken.common.validation.VietnamesePhoneValidator.isValid(resolvedPhone)) {
                throw new ValidationException("Số điện thoại không hợp lệ hoặc không thuộc nhà mạng nào tại Việt Nam (+84).");
            }
            resolvedPhone = com.example.webchicken.common.validation.VietnamesePhoneValidator.normalize(resolvedPhone);
        }

        // 4. Kiểm tra trùng lặp trên hệ thống
        if (resolvedEmail != null && userDAO.existsByEmail(resolvedEmail)) {
            throw new ConflictException("Email [" + resolvedEmail + "] đã tồn tại trên hệ thống.");
        }
        if (resolvedUsername != null && userDAO.existsByUsername(resolvedUsername)) {
            throw new ConflictException("Tên đăng nhập [" + resolvedUsername + "] đã tồn tại trên hệ thống.");
        }
        if (resolvedPhone != null && userDAO.existsByPhone(resolvedPhone)) {
            throw new ConflictException("Số điện thoại [" + resolvedPhone + "] đã tồn tại trên hệ thống.");
        }

        // 5. Xác định Họ và tên (Full Name)
        String finalFullName;
        if (req.fullName() != null && !req.fullName().trim().isBlank()) {
            finalFullName = req.fullName().trim();
        } else if (resolvedUsername != null) {
            finalFullName = resolvedUsername;
        } else if (resolvedEmail != null) {
            finalFullName = resolvedEmail.split("@")[0];
        } else {
            finalFullName = "User_" + (resolvedPhone.length() >= 4 ? resolvedPhone.substring(resolvedPhone.length() - 4) : resolvedPhone);
        }

        // 6. Mã hóa mật khẩu an toàn với BCrypt
        String hashedPassword = BCrypt.withDefaults().hashToString(12, req.password().toCharArray());

        CustomerEntity customer = new CustomerEntity();
        customer.setUserId(UUID.randomUUID().toString());
        customer.setUsername(resolvedUsername);
        customer.setEmail(resolvedEmail);
        customer.setPhone(resolvedPhone);
        customer.setPasswordHash(hashedPassword);
        customer.setFullName(finalFullName);
        customer.setStatus(UserStatus.ACTIVE);
        customer.setTier(LoyaltyTier.STANDARD);
        customer.setLoyaltyPoint(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        customerDAO.save(customer);
        log.info("Khách hàng mới đã đăng ký thành công: username={}, email={}, phone={} ({})",
                customer.getUsername(), customer.getEmail(), customer.getPhone(), customer.getUserId());

        List<String> roles = List.of("CUSTOMER");
        String subjectIdentifier = resolvedEmail != null ? resolvedEmail : (resolvedUsername != null ? resolvedUsername : resolvedPhone);
        String accessToken = jwtProvider.generateAccessToken(customer.getUserId(), subjectIdentifier, roles);

        return new AuthResponse(
                accessToken,
                new AuthResponse.UserInfo(
                        customer.getUserId(),
                        customer.getEmail(),
                        customer.getFullName(),
                        customer.getPhone(),
                        customer.getLogoUrl(),
                        roles,
                        customer.getUsername()
                )
        );
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        if (req == null) {
            throw new ValidationException("Vui lòng nhập thông tin đăng nhập.");
        }
        String identifier = req.getEffectiveIdentifier();
        if (identifier == null || identifier.isBlank() || req.password() == null || req.password().isBlank()) {
            throw new ValidationException("Vui lòng nhập tài khoản (username, email hoặc số điện thoại) và mật khẩu.");
        }

        UserEntity user = userDAO.findByIdentifier(identifier)
                .orElseThrow(() -> new AuthenticationException("Tài khoản hoặc mật khẩu không chính xác."));

        // Kiểm tra mật khẩu qua BCrypt
        BCrypt.Result result = BCrypt.verifyer().verify(req.password().toCharArray(), user.getPasswordHash());
        if (!result.verified) {
            log.warn("Đăng nhập thất bại do sai mật khẩu cho tài khoản: {}", identifier);
            throw new AuthenticationException("Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new AuthenticationException("Tài khoản của bạn đã bị khóa vi phạm chính sách sàn.");
        }

        List<String> roles = resolveUserRoles(user);
        String subjectIdentifier = user.getEmail() != null ? user.getEmail() : (user.getUsername() != null ? user.getUsername() : user.getPhone());
        String accessToken = jwtProvider.generateAccessToken(user.getUserId(), subjectIdentifier, roles);

        return new AuthResponse(
                accessToken,
                new AuthResponse.UserInfo(
                        user.getUserId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getPhone(),
                        user.getLogoUrl(),
                        roles,
                        user.getUsername()
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
        String subjectIdentifier = user.getEmail() != null ? user.getEmail() : (user.getUsername() != null ? user.getUsername() : user.getPhone());
        return jwtProvider.generateAccessToken(user.getUserId(), subjectIdentifier, roles);
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

    @Override
    public AuthResponse loginWithGoogle(String idToken) {
        return loginWithSocial(new SocialLoginRequest("GOOGLE", idToken, null));
    }

    @Override
    public AuthResponse loginWithSocial(SocialLoginRequest req) {
        if (req == null) {
            throw new ValidationException("Dữ liệu đăng nhập mạng xã hội không được để trống.");
        }
        String provider = req.getEffectiveProvider();
        String token = req.getEffectiveToken();
        if (token == null || token.isBlank()) {
            throw new ValidationException("Mã xác thực (" + provider + " token) không được để trống.");
        }

        // 1. Xác thực token với Provider qua OAuthVerifier
        SocialUserProfile profile = oauthVerifier.verifyToken(provider, token);
        if (profile == null || profile.providerUserId() == null || profile.providerUserId().isBlank()) {
            throw new AuthenticationException("Xác thực thông tin tài khoản mạng xã hội thất bại.");
        }

        // 2. Kiểm tra xem tài khoản xã hội này đã được liên kết với người dùng nào chưa
        Optional<UserSocialAccountEntity> socialLinkOpt = userSocialAccountDAO.findByProviderAndProviderUserId(
                provider, profile.providerUserId()
        );

        UserEntity user;
        if (socialLinkOpt.isPresent()) {
            // Đã liên kết trước đó
            String userId = socialLinkOpt.get().getUserId();
            user = userDAO.findById(userId)
                    .orElseThrow(() -> new AuthenticationException("Tài khoản người dùng liên kết không còn tồn tại."));

            // Cập nhật avatar nếu người dùng chưa có hoặc avatar mới từ Google
            if (profile.avatarUrl() != null && (user.getLogoUrl() == null || user.getLogoUrl().isBlank())) {
                user.setLogoUrl(profile.avatarUrl());
                userDAO.update(user);
            }
        } else {
            // Chưa liên kết: tìm xem đã có người dùng nào trùng email chưa
            String email = profile.email();
            Optional<UserEntity> existingUserOpt = (email != null && !email.isBlank())
                    ? userDAO.findByEmail(email)
                    : Optional.empty();

            if (existingUserOpt.isPresent()) {
                // Người dùng đã tồn tại với email này -> liên kết thêm mạng xã hội
                user = existingUserOpt.get();
                if (profile.avatarUrl() != null && (user.getLogoUrl() == null || user.getLogoUrl().isBlank())) {
                    user.setLogoUrl(profile.avatarUrl());
                    userDAO.update(user);
                }
                log.info("Liên kết tài khoản mạng xã hội {} ({}) với người dùng hiện tại {}",
                        provider, profile.providerUserId(), user.getUserId());
            } else {
                // Người dùng hoàn toàn mới -> tạo CustomerEntity mới
                CustomerEntity newCustomer = new CustomerEntity();
                newCustomer.setUserId(UUID.randomUUID().toString());
                newCustomer.setEmail(email);

                String displayName = (profile.name() != null && !profile.name().isBlank())
                        ? profile.name().trim()
                        : (email != null ? email.split("@")[0] : provider + "_User");
                newCustomer.setFullName(displayName);
                newCustomer.setLogoUrl(profile.avatarUrl());

                // Mật khẩu ngẫu nhiên an toàn mã hóa qua BCrypt
                String randomPass = UUID.randomUUID().toString() + UUID.randomUUID().toString();
                newCustomer.setPasswordHash(BCrypt.withDefaults().hashToString(12, randomPass.toCharArray()));

                newCustomer.setStatus(UserStatus.ACTIVE);
                newCustomer.setTier(LoyaltyTier.STANDARD);
                newCustomer.setLoyaltyPoint(0);
                newCustomer.setCreatedAt(LocalDateTime.now());
                newCustomer.setUpdatedAt(LocalDateTime.now());

                customerDAO.save(newCustomer);
                user = newCustomer;
                log.info("Tạo mới tài khoản người dùng từ OAuth {}: userId={}, email={}",
                        provider, user.getUserId(), user.getEmail());
            }

            // Lưu bản ghi liên kết vào user_social_accounts
            UserSocialAccountEntity socialAccount = new UserSocialAccountEntity(
                    UUID.randomUUID().toString(),
                    user.getUserId(),
                    provider,
                    profile.providerUserId(),
                    profile.email(),
                    profile.avatarUrl(),
                    LocalDateTime.now()
            );
            userSocialAccountDAO.save(socialAccount);
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new AuthenticationException("Tài khoản của bạn đã bị khóa vi phạm chính sách sàn.");
        }

        List<String> roles = resolveUserRoles(user);
        String subjectIdentifier = user.getEmail() != null ? user.getEmail() : (user.getUsername() != null ? user.getUsername() : user.getUserId());
        String accessToken = jwtProvider.generateAccessToken(user.getUserId(), subjectIdentifier, roles);

        return new AuthResponse(
                accessToken,
                new AuthResponse.UserInfo(
                        user.getUserId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getPhone(),
                        user.getLogoUrl(),
                        roles,
                        user.getUsername()
                )
        );
    }
}

