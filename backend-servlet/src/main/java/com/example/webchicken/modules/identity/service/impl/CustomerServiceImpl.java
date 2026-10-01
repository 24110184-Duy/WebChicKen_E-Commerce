package com.example.webchicken.modules.identity.service.impl;

import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.AddressDAO;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.dto.request.CreateAddressRequest;
import com.example.webchicken.modules.identity.model.dto.request.UpdateProfileRequest;
import com.example.webchicken.modules.identity.model.dto.response.AddressResponse;
import com.example.webchicken.modules.identity.model.dto.response.UserProfileResponse;
import com.example.webchicken.modules.identity.model.entity.AddressEntity;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.identity.service.CustomerService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public class CustomerServiceImpl implements CustomerService {

    private final CustomerDAO customerDAO;
    private final UserDAO userDAO;
    private final AddressDAO addressDAO;

    public CustomerServiceImpl(CustomerDAO customerDAO, UserDAO userDAO, AddressDAO addressDAO) {
        this.customerDAO = Objects.requireNonNull(customerDAO, "customerDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.addressDAO = Objects.requireNonNull(addressDAO, "addressDAO must not be null");
    }

    @Override
    public UserProfileResponse getProfile(String userId) {
        UserEntity user = userDAO.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + userId));

        String tier = "STANDARD";
        int loyaltyPoint = 0;
        if (user instanceof CustomerEntity customer) {
            tier = customer.getTier().name();
            loyaltyPoint = customer.getLoyaltyPoint();
        }

        List<String> roles = resolveRoles(user);

        return new UserProfileResponse(
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getLogoUrl(),
                user.getStatus().name(),
                tier,
                loyaltyPoint,
                roles
        );
    }

    @Override
    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest req) {
        UserEntity user = userDAO.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + userId));

        if (req.fullName() != null && !req.fullName().isBlank()) {
            user.setFullName(req.fullName().trim());
        }
        if (req.phone() != null) {
            user.setPhone(req.phone().trim());
        }
        if (req.logoUrl() != null) {
            user.setLogoUrl(req.logoUrl().trim());
        }
        user.setUpdatedAt(LocalDateTime.now());

        userDAO.update(user);
        return getProfile(userId);
    }

    @Override
    public List<AddressResponse> getAddresses(String userId) {
        return addressDAO.findByUserId(userId).stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AddressResponse addAddress(String userId, CreateAddressRequest req) {
        if (req.recipientName() == null || req.recipientName().isBlank()) {
            throw new ValidationException("Tên người nhận không được để trống.");
        }
        if (req.phone() == null || req.phone().isBlank()) {
            throw new ValidationException("Số điện thoại không được để trống.");
        }
        if (req.addressLine1() == null || req.addressLine1().isBlank()) {
            throw new ValidationException("Địa chỉ cụ thể không được để trống.");
        }

        List<AddressEntity> currentAddresses = addressDAO.findByUserId(userId);
        boolean isFirstAddress = currentAddresses.isEmpty();
        boolean shouldBeDefault = isFirstAddress || req.isDefault();

        // Nếu đặt làm mặc định, hủy mặc định của các địa chỉ cũ
        if (shouldBeDefault) {
            for (AddressEntity existing : currentAddresses) {
                if (existing.isDefault()) {
                    existing.setDefault(false);
                    addressDAO.update(existing);
                }
            }
        }

        AddressEntity entity = new AddressEntity();
        entity.setAddressId(UUID.randomUUID().toString());
        entity.setUserId(userId);
        entity.setRecipientName(req.recipientName().trim());
        entity.setPhone(req.phone().trim());
        entity.setAddressLine1(req.addressLine1().trim());
        entity.setDistrict(req.district() != null ? req.district().trim() : "");
        entity.setCity(req.city() != null ? req.city().trim() : "");
        entity.setDefault(shouldBeDefault);
        entity.setCreatedAt(LocalDateTime.now());

        addressDAO.save(entity);
        return mapToAddressResponse(entity);
    }

    @Override
    public void setDefaultAddress(String userId, String addressId) {
        List<AddressEntity> addresses = addressDAO.findByUserId(userId);
        boolean found = false;

        for (AddressEntity addr : addresses) {
            if (addr.getAddressId().equals(addressId)) {
                addr.setDefault(true);
                addressDAO.update(addr);
                found = true;
            } else if (addr.isDefault()) {
                addr.setDefault(false);
                addressDAO.update(addr);
            }
        }

        if (!found) {
            throw new NotFoundException("Không tìm thấy địa chỉ cần đặt làm mặc định.");
        }
    }

    @Override
    public void deleteAddress(String userId, String addressId) {
        List<AddressEntity> addresses = addressDAO.findByUserId(userId);
        AddressEntity target = addresses.stream()
                .filter(a -> a.getAddressId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Không tìm thấy địa chỉ với ID: " + addressId));

        if (!target.getUserId().equals(userId)) {
            throw new AuthorizationException("Bạn không có quyền xóa địa chỉ này.");
        }

        addressDAO.deleteById(addressId);

        // Nếu xóa địa chỉ mặc định mà còn địa chỉ khác, gán địa chỉ đầu tiên làm mặc định mới
        if (target.isDefault() && addresses.size() > 1) {
            addresses.stream()
                    .filter(a -> !a.getAddressId().equals(addressId))
                    .findFirst()
                    .ifPresent(newDef -> {
                        newDef.setDefault(true);
                        addressDAO.update(newDef);
                    });
        }
    }

    private AddressResponse mapToAddressResponse(AddressEntity a) {
        return new AddressResponse(
                a.getAddressId(),
                a.getUserId(),
                a.getRecipientName(),
                a.getPhone(),
                a.getAddressLine1(),
                a.getDistrict(),
                a.getCity(),
                a.isDefault(),
                a.getCreatedAt()
        );
    }

    private List<String> resolveRoles(UserEntity user) {
        List<String> roles = new ArrayList<>();
        if (user instanceof CustomerEntity) roles.add("CUSTOMER");
        String name = user.getClass().getSimpleName();
        if (name.contains("Seller")) roles.add("SELLER");
        if (name.contains("Admin")) roles.add("SUPER_ADMIN");
        if (roles.isEmpty()) roles.add("CUSTOMER");
        return roles;
    }
}
