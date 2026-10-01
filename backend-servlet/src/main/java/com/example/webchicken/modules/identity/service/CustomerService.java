package com.example.webchicken.modules.identity.service;

import com.example.webchicken.modules.identity.model.dto.request.CreateAddressRequest;
import com.example.webchicken.modules.identity.model.dto.request.UpdateProfileRequest;
import com.example.webchicken.modules.identity.model.dto.response.AddressResponse;
import com.example.webchicken.modules.identity.model.dto.response.UserProfileResponse;

import java.util.List;

/**
 * Interface nghiệp vụ quản lý hồ sơ và sổ địa chỉ khách hàng.
 */
public interface CustomerService {

    /** Lấy thông tin hồ sơ người dùng */
    UserProfileResponse getProfile(String userId);

    /** Cập nhật thông tin cá nhân */
    UserProfileResponse updateProfile(String userId, UpdateProfileRequest request);

    /** Lấy danh sách sổ địa chỉ nhận hàng */
    List<AddressResponse> getAddresses(String userId);

    /** Thêm địa chỉ nhận hàng mới */
    AddressResponse addAddress(String userId, CreateAddressRequest request);

    /** Đặt địa chỉ làm mặc định */
    void setDefaultAddress(String userId, String addressId);

    /** Xóa một địa chỉ nhận hàng */
    void deleteAddress(String userId, String addressId);
}
