package com.example.webchicken.infrastructure.security;

import com.example.webchicken.bootstrap.EnvConfig;
import com.example.webchicken.common.exception.AuthenticationException;
import com.example.webchicken.common.exception.ValidationException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Triển khai xác thực Token mạng xã hội (Google OAuth2 ID Token, Facebook Graph API).
 */
public class SocialAuthVerifier implements OAuthVerifier {

    private static final Logger log = LoggerFactory.getLogger(SocialAuthVerifier.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String expectedGoogleClientId;

    public SocialAuthVerifier(HttpClient httpClient, ObjectMapper objectMapper, String expectedGoogleClientId) {
        this.httpClient = httpClient != null ? httpClient : HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.expectedGoogleClientId = expectedGoogleClientId;
    }

    public SocialAuthVerifier() {
        this(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                new ObjectMapper(),
                EnvConfig.get("GOOGLE_CLIENT_ID", null)
        );
    }

    @Override
    public SocialUserProfile verifyToken(String provider, String token) {
        if (provider == null || provider.isBlank()) {
            throw new ValidationException("Nhà cung cấp OAuth không được để trống.");
        }
        if (token == null || token.isBlank()) {
            throw new ValidationException("Mã xác thực (Token) không được để trống.");
        }

        String normalizedProvider = provider.trim().toUpperCase();
        return switch (normalizedProvider) {
            case "GOOGLE" -> verifyGoogleIdToken(token);
            case "FACEBOOK" -> verifyFacebookToken(token);
            default -> throw new ValidationException("Nhà cung cấp mạng xã hội [" + provider + "] chưa được hỗ trợ.");
        };
    }

    private SocialUserProfile verifyGoogleIdToken(String token) {
        String cleanToken = token.trim();

        // 1. Google OAuth2 Access Token (từ Google Identity Services initTokenClient) luôn bắt đầu bằng "ya29."
        if (cleanToken.startsWith("ya29.")) {
            try {
                return verifyGoogleAccessToken(cleanToken);
            } catch (Exception e) {
                log.warn("verifyGoogleAccessToken failed for ya29 token: {}", e.getMessage());
                return verifyGoogleJwt(cleanToken);
            }
        }

        // 2. Google ID Token (JWT từ One-Tap hoặc OpenID Connect) luôn bắt đầu bằng "eyJ"
        if (cleanToken.startsWith("eyJ")) {
            try {
                return verifyGoogleJwt(cleanToken);
            } catch (Exception e) {
                log.warn("verifyGoogleJwt failed for eyJ token: {}", e.getMessage());
                return verifyGoogleAccessToken(cleanToken);
            }
        }

        // 3. Fallback: Nếu có đúng 3 phần ngăn cách bởi dấu chấm thì ưu tiên JWT, ngược lại ưu tiên Access Token
        boolean looksLikeJwt = cleanToken.split("\\.").length == 3;
        if (looksLikeJwt) {
            try {
                return verifyGoogleJwt(cleanToken);
            } catch (Exception e) {
                log.info("JWT verification failed, trying access token endpoint: {}", e.getMessage());
                return verifyGoogleAccessToken(cleanToken);
            }
        } else {
            try {
                return verifyGoogleAccessToken(cleanToken);
            } catch (Exception e) {
                log.info("Access token verification failed, trying JWT endpoint: {}", e.getMessage());
                return verifyGoogleJwt(cleanToken);
            }
        }
    }

    private SocialUserProfile verifyGoogleJwt(String idToken) {
        try {
            String encodedToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedToken;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Google token verification failed with status {}: {}", response.statusCode(), response.body());
                throw new AuthenticationException("Mã xác thực Google không hợp lệ hoặc đã hết hạn.");
            }

            JsonNode root = objectMapper.readTree(response.body());

            String sub = root.path("sub").asText(null);
            if (sub == null || sub.isBlank()) {
                throw new AuthenticationException("Không thể xác định danh tính tài khoản Google (thiếu sub).");
            }

            // Kiểm tra Audience nếu có cấu hình Google Client ID
            String aud = root.path("aud").asText(null);
            if (expectedGoogleClientId != null && !expectedGoogleClientId.isBlank()) {
                if (aud == null || !expectedGoogleClientId.equals(aud)) {
                    log.error("Google token audience mismatch! Expected: {}, got: {}", expectedGoogleClientId, aud);
                    throw new AuthenticationException("Mã xác thực Google không khớp với ứng dụng của chúng tôi.");
                }
            }

            String email = root.path("email").asText(null);
            String name = root.path("name").asText(null);
            String picture = root.path("picture").asText(null);

            return new SocialUserProfile(
                    "GOOGLE",
                    sub,
                    email != null ? email.trim().toLowerCase() : null,
                    name,
                    picture
            );

        } catch (AuthenticationException ae) {
            throw ae;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("Lỗi khi kết nối xác thực Google Token: {}", e.getMessage(), e);
            throw new AuthenticationException("Không thể kết nối tới máy chủ Google để xác thực.");
        }
    }

    private SocialUserProfile verifyGoogleAccessToken(String accessToken) {
        try {
            String url = "https://www.googleapis.com/oauth2/v3/userinfo";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Google userinfo verification failed with status {}: {}", response.statusCode(), response.body());
                throw new AuthenticationException("Mã truy cập Google không hợp lệ hoặc đã hết hạn.");
            }

            JsonNode root = objectMapper.readTree(response.body());

            String sub = root.path("sub").asText(null);
            if (sub == null || sub.isBlank()) {
                throw new AuthenticationException("Không thể xác định danh tính tài khoản Google (thiếu sub).");
            }

            String email = root.path("email").asText(null);
            String name = root.path("name").asText(null);
            String picture = root.path("picture").asText(null);

            return new SocialUserProfile(
                    "GOOGLE",
                    sub,
                    email != null ? email.trim().toLowerCase() : null,
                    name,
                    picture
            );

        } catch (AuthenticationException ae) {
            throw ae;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("Lỗi khi kết nối xác thực Google Access Token: {}", e.getMessage(), e);
            throw new AuthenticationException("Không thể kết nối tới máy chủ Google để xác thực.");
        }
    }


    private SocialUserProfile verifyFacebookToken(String accessToken) {
        try {
            String encodedToken = URLEncoder.encode(accessToken.trim(), StandardCharsets.UTF_8);
            String url = "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=" + encodedToken;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Facebook token verification failed with status {}: {}", response.statusCode(), response.body());
                throw new AuthenticationException("Mã xác thực Facebook không hợp lệ hoặc đã hết hạn.");
            }

            JsonNode root = objectMapper.readTree(response.body());

            String id = root.path("id").asText(null);
            if (id == null || id.isBlank()) {
                throw new AuthenticationException("Không thể xác định danh tính tài khoản Facebook (thiếu id).");
            }

            String email = root.path("email").asText(null);
            String name = root.path("name").asText(null);
            String picture = root.path("picture").path("data").path("url").asText(null);

            return new SocialUserProfile(
                    "FACEBOOK",
                    id,
                    email != null ? email.trim().toLowerCase() : null,
                    name,
                    picture
            );

        } catch (AuthenticationException ae) {
            throw ae;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("Lỗi khi kết nối xác thực Facebook Token: {}", e.getMessage(), e);
            throw new AuthenticationException("Không thể kết nối tới máy chủ Facebook để xác thực.");
        }
    }
}
