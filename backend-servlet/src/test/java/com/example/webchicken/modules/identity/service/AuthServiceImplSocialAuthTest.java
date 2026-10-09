package com.example.webchicken.modules.identity.service;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.AuthenticationException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.infrastructure.security.OAuthVerifier;
import com.example.webchicken.infrastructure.security.SocialUserProfile;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.dao.UserSocialAccountDAO;
import com.example.webchicken.modules.identity.model.dto.request.SocialLoginRequest;
import com.example.webchicken.modules.identity.model.dto.response.AuthResponse;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.model.entity.UserSocialAccountEntity;
import com.example.webchicken.modules.identity.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthServiceImplSocialAuthTest {

    private UserDAO userDAO;
    private UserSessionDAO userSessionDAO;
    private CustomerDAO customerDAO;
    private UserSocialAccountDAO userSocialAccountDAO;
    private OAuthVerifier oauthVerifier;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userDAO = mock(UserDAO.class);
        userSessionDAO = mock(UserSessionDAO.class);
        customerDAO = mock(CustomerDAO.class);
        userSocialAccountDAO = mock(UserSocialAccountDAO.class);
        oauthVerifier = mock(OAuthVerifier.class);

        authService = new AuthServiceImpl(
                userDAO,
                userSessionDAO,
                customerDAO,
                userSocialAccountDAO,
                oauthVerifier
        );
    }

    @Test
    @DisplayName("Đăng nhập Google lần đầu tạo mới tài khoản Customer và liên kết OAuth")
    void testLoginWithGoogleNewUser() {
        String googleIdToken = "valid.google.id.token";
        SocialUserProfile profile = new SocialUserProfile(
                "GOOGLE",
                "google-sub-12345",
                "chicky.user@gmail.com",
                "Chicky User",
                "https://lh3.googleusercontent.com/avatar.jpg"
        );

        when(oauthVerifier.verifyToken("GOOGLE", googleIdToken)).thenReturn(profile);
        when(userSocialAccountDAO.findByProviderAndProviderUserId("GOOGLE", "google-sub-12345")).thenReturn(Optional.empty());
        when(userDAO.findByEmail("chicky.user@gmail.com")).thenReturn(Optional.empty());

        AuthResponse resp = authService.loginWithGoogle(googleIdToken);

        assertNotNull(resp);
        assertNotNull(resp.accessToken());
        assertEquals("chicky.user@gmail.com", resp.user().email());
        assertEquals("Chicky User", resp.user().fullName());
        assertEquals("https://lh3.googleusercontent.com/avatar.jpg", resp.user().logoUrl());

        // Kiểm tra đã tạo CustomerEntity mới
        ArgumentCaptor<CustomerEntity> customerCaptor = ArgumentCaptor.forClass(CustomerEntity.class);
        verify(customerDAO).save(customerCaptor.capture());
        CustomerEntity savedCustomer = customerCaptor.getValue();
        assertEquals("chicky.user@gmail.com", savedCustomer.getEmail());
        assertEquals("Chicky User", savedCustomer.getFullName());

        // Kiểm tra đã lưu liên kết mạng xã hội
        ArgumentCaptor<UserSocialAccountEntity> socialCaptor = ArgumentCaptor.forClass(UserSocialAccountEntity.class);
        verify(userSocialAccountDAO).save(socialCaptor.capture());
        UserSocialAccountEntity savedLink = socialCaptor.getValue();
        assertEquals("GOOGLE", savedLink.getProvider());
        assertEquals("google-sub-12345", savedLink.getProviderUserId());
        assertEquals(savedCustomer.getUserId(), savedLink.getUserId());
    }

    @Test
    @DisplayName("Đăng nhập Google khi người dùng đã có tài khoản theo email -> tự động liên kết")
    void testLoginWithGoogleExistingUserByEmail() {
        String googleIdToken = "valid.google.id.token";
        SocialUserProfile profile = new SocialUserProfile(
                "GOOGLE",
                "google-sub-67890",
                "existing.user@gmail.com",
                "Existing User",
                "https://avatar.google.com/pic.png"
        );

        CustomerEntity existingUser = new CustomerEntity();
        existingUser.setUserId("user-existing-id");
        existingUser.setEmail("existing.user@gmail.com");
        existingUser.setFullName("Existing User");
        existingUser.setStatus(UserStatus.ACTIVE);

        when(oauthVerifier.verifyToken("GOOGLE", googleIdToken)).thenReturn(profile);
        when(userSocialAccountDAO.findByProviderAndProviderUserId("GOOGLE", "google-sub-67890")).thenReturn(Optional.empty());
        when(userDAO.findByEmail("existing.user@gmail.com")).thenReturn(Optional.of(existingUser));

        AuthResponse resp = authService.loginWithGoogle(googleIdToken);

        assertNotNull(resp);
        assertEquals("user-existing-id", resp.user().userId());
        assertEquals("existing.user@gmail.com", resp.user().email());

        // Không tạo customer mới
        verify(customerDAO, never()).save(any());

        // Nhưng lưu bản ghi liên kết mới
        ArgumentCaptor<UserSocialAccountEntity> socialCaptor = ArgumentCaptor.forClass(UserSocialAccountEntity.class);
        verify(userSocialAccountDAO).save(socialCaptor.capture());
        assertEquals("user-existing-id", socialCaptor.getValue().getUserId());
        assertEquals("google-sub-67890", socialCaptor.getValue().getProviderUserId());
    }

    @Test
    @DisplayName("Đăng nhập Google khi đã liên kết trước đó")
    void testLoginWithGoogleAlreadyLinked() {
        String googleIdToken = "valid.google.id.token";
        SocialUserProfile profile = new SocialUserProfile(
                "GOOGLE",
                "google-sub-already-linked",
                "linked@gmail.com",
                "Linked User",
                "https://avatar.png"
        );

        UserSocialAccountEntity existingLink = new UserSocialAccountEntity();
        existingLink.setUserId("user-linked-id");
        existingLink.setProvider("GOOGLE");
        existingLink.setProviderUserId("google-sub-already-linked");

        CustomerEntity linkedUser = new CustomerEntity();
        linkedUser.setUserId("user-linked-id");
        linkedUser.setEmail("linked@gmail.com");
        linkedUser.setFullName("Linked User");
        linkedUser.setStatus(UserStatus.ACTIVE);

        when(oauthVerifier.verifyToken("GOOGLE", googleIdToken)).thenReturn(profile);
        when(userSocialAccountDAO.findByProviderAndProviderUserId("GOOGLE", "google-sub-already-linked"))
                .thenReturn(Optional.of(existingLink));
        when(userDAO.findById("user-linked-id")).thenReturn(Optional.of(linkedUser));

        AuthResponse resp = authService.loginWithGoogle(googleIdToken);

        assertNotNull(resp);
        assertEquals("user-linked-id", resp.user().userId());
        verify(customerDAO, never()).save(any());
        verify(userSocialAccountDAO, never()).save(any());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi tài khoản bị BANNED")
    void testLoginWithSocialBannedUser() {
        String googleIdToken = "valid.google.id.token";
        SocialUserProfile profile = new SocialUserProfile(
                "GOOGLE",
                "google-banned-user",
                "banned@gmail.com",
                "Banned User",
                null
        );

        CustomerEntity bannedUser = new CustomerEntity();
        bannedUser.setUserId("banned-id");
        bannedUser.setEmail("banned@gmail.com");
        bannedUser.setStatus(UserStatus.BANNED);

        UserSocialAccountEntity link = new UserSocialAccountEntity();
        link.setUserId("banned-id");
        link.setProvider("GOOGLE");
        link.setProviderUserId("google-banned-user");

        when(oauthVerifier.verifyToken("GOOGLE", googleIdToken)).thenReturn(profile);
        when(userSocialAccountDAO.findByProviderAndProviderUserId("GOOGLE", "google-banned-user"))
                .thenReturn(Optional.of(link));
        when(userDAO.findById("banned-id")).thenReturn(Optional.of(bannedUser));

        assertThrows(AuthenticationException.class, () -> authService.loginWithGoogle(googleIdToken));
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi thiếu token")
    void testLoginWithEmptyToken() {
        assertThrows(ValidationException.class, () -> authService.loginWithGoogle("   "));
        assertThrows(ValidationException.class, () -> authService.loginWithSocial(new SocialLoginRequest("GOOGLE", null, null)));
    }
}
