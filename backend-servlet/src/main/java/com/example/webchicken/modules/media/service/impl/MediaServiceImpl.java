package com.example.webchicken.modules.media.service.impl;

import com.example.webchicken.common.exception.DataAccessException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.media.dao.MediaDAO;
import com.example.webchicken.modules.media.model.dto.response.MediaUploadResponse;
import com.example.webchicken.modules.media.model.entity.MediaAssetEntity;
import com.example.webchicken.modules.media.service.MediaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class MediaServiceImpl implements MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaServiceImpl.class);

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private final MediaDAO mediaDAO;
    private final Path uploadDir;

    public MediaServiceImpl(MediaDAO mediaDAO) {
        this.mediaDAO = Objects.requireNonNull(mediaDAO, "mediaDAO must not be null");
        String configDir = System.getProperty("app.upload.dir", "uploads");
        this.uploadDir = Paths.get(configDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            log.error("Không thể khởi tạo thư mục lưu trữ media: {}", this.uploadDir, e);
        }
    }

    @Override
    public MediaUploadResponse uploadFile(String userId, String originalFilename, String contentType, long fileSize, InputStream inputStream) {
        if (inputStream == null) {
            throw new ValidationException("Dữ liệu tệp không hợp lệ.");
        }
        if (fileSize > MAX_FILE_SIZE) {
            throw new ValidationException("Dung lượng tệp vượt quá giới hạn cho phép (Tối đa 5MB).");
        }
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new ValidationException("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPEG, PNG, WEBP.");
        }

        String extension = resolveExtension(originalFilename, contentType);
        String randomFileName = UUID.randomUUID().toString() + extension;
        Path targetPath = uploadDir.resolve(randomFileName);

        try {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Lỗi khi ghi tệp vào hệ thống lưu trữ: {}", targetPath, e);
            throw new DataAccessException("Lỗi hệ thống khi lưu trữ hình ảnh.", e);
        }

        String fileUrl = "/api/v1/media/files/" + randomFileName;
        MediaAssetEntity entity = new MediaAssetEntity(
                UUID.randomUUID().toString(),
                userId,
                originalFilename != null ? originalFilename : randomFileName,
                fileUrl,
                contentType,
                fileSize,
                LocalDateTime.now()
        );

        mediaDAO.save(entity);
        log.info("Đã tải lên tệp ảnh thành công: {} -> URL: {}", originalFilename, fileUrl);

        return new MediaUploadResponse(
                entity.getId(),
                entity.getFileName(),
                entity.getFileUrl(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getCreatedAt()
        );
    }

    @Override
    public MediaUploadResponse getMediaById(String mediaId) {
        if (mediaId == null || mediaId.isBlank()) {
            throw new ValidationException("Mã media không hợp lệ.");
        }
        MediaAssetEntity entity = mediaDAO.findById(mediaId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tệp tin media: " + mediaId));
        return new MediaUploadResponse(
                entity.getId(),
                entity.getFileName(),
                entity.getFileUrl(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getCreatedAt()
        );
    }

    public Path getUploadDir() {
        return uploadDir;
    }

    private String resolveExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
            if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp")) {
                return ext;
            }
        }
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
