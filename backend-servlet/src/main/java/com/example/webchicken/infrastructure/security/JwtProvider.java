package com.example.webchicken.infrastructure.security;

import com.example.webchicken.common.exception.AuthenticationException;
import com.example.webchicken.common.model.AuthenticatedUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

/**
 * Tiện ích tạo và kiểm tra tính hợp lệ của JWT Token (ADR-06, JJWT 0.12.x).
 * <p>
 * Thời hạn Access Token mặc định: 30 phút.
 * Secret Key được nạp từ biến môi trường {@code JWT_SECRET}.
 * </p>
 */
public class JwtProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtProvider.class);

    // Chuỗi secret mặc định tối thiểu 256-bit dùng cho môi trường dev
    private static final String DEFAULT_DEV_SECRET = "WebChicKenECommerceSecretKeyMustBeAtLeast256BitsLongForHMACSHAAlgorithms2026";
    private static final long ACCESS_TOKEN_VALIDITY_MS = 30L * 60 * 1000; // 30 phút

    private final SecretKey key;

    public JwtProvider() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isBlank()) {
            secret = System.getProperty("jwt.secret", DEFAULT_DEV_SECRET);
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public JwtProvider(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Sinh JWT Access Token từ thông tin người dùng và danh sách quyền (roles).
     */
    public String generateAccessToken(String userId, String email, List<String> roles) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("roles", roles)
                .issuedAt(new Date(now))
                .expiration(new Date(now + ACCESS_TOKEN_VALIDITY_MS))
                .signWith(key)
                .compact();
    }

    /**
     * Xác thực token và trích xuất thông tin người dùng.
     * Ném {@link AuthenticationException} nếu token hết hạn hoặc giả mạo.
     */
    @SuppressWarnings("unchecked")
    public AuthenticatedUser validateAndExtractUser(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            List<String> roles = claims.get("roles", List.class);

            return new AuthenticatedUser(userId, email, roles);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Xác thực JWT thất bại: {}", e.getMessage());
            throw new AuthenticationException("Token không hợp lệ hoặc đã hết hạn: " + e.getMessage());
        }
    }
}
