package com.example.webchicken.modules.media.service;

import com.example.webchicken.modules.media.model.dto.response.MediaUploadResponse;
import java.io.InputStream;

/**
 * Service quản lý tải lên và lưu trữ các tệp đa phương tiện (Media).
 */
public interface MediaService {

    /**
     * Tải lên một tệp ảnh với kiểm tra an toàn MIME, kích thước và đặt tên UUID ngẫu nhiên.
     */
    MediaUploadResponse uploadFile(String userId, String originalFilename, String contentType, long fileSize, InputStream inputStream);

    /**
     * Tra cứu thông tin metadata của tệp ảnh theo mã ID.
     */
    MediaUploadResponse getMediaById(String mediaId);
}
