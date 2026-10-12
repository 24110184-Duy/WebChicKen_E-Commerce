package com.example.webchicken.modules.media.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.webchicken.bootstrap.EnvConfig;
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
import java.time.LocalDateTime;
import java.util.Map;
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
            "image/webp",
            "image/gif",
            "image/pjpeg",
            "image/jfif",
            "image/x-png"
    );

    private final MediaDAO mediaDAO;
    private final Path uploadDir;
    private final Cloudinary cloudinary;

    public MediaServiceImpl(MediaDAO mediaDAO) {
        this.mediaDAO = Objects.requireNonNull(mediaDAO, "mediaDAO must not be null");
        String configDir = System.getProperty("app.upload.dir", "uploads");
        this.uploadDir = Paths.get(configDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            log.error("Không thể khởi tạo thư mục lưu trữ media cục bộ: {}", this.uploadDir, e);
        }

        String cloudName = EnvConfig.get("CLOUDINARY_CLOUD_NAME", null);
        String apiKey = EnvConfig.get("CLOUDINARY_API_KEY", null);
        String apiSecret = EnvConfig.get("CLOUDINARY_API_SECRET", null);

        if (cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName.trim(),
                    "api_key", apiKey.trim(),
                    "api_secret", apiSecret.trim(),
                    "secure", true
            ));
            log.info("Khởi tạo Cloudinary thành công cho cloud_name: {}", cloudName);
        } else {
            this.cloudinary = null;
            log.info("Không tìm thấy cấu hình Cloudinary, sử dụng lưu trữ tệp cục bộ (Local Storage)");
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

        String resolvedContentType = contentType != null ? contentType.toLowerCase().trim() : "";
        if ("application/octet-stream".equals(resolvedContentType) || resolvedContentType.isBlank()) {
            if (originalFilename != null && originalFilename.contains(".")) {
                String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
                if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".jfif")) resolvedContentType = "image/jpeg";
                else if (ext.equals(".png")) resolvedContentType = "image/png";
                else if (ext.equals(".webp")) resolvedContentType = "image/webp";
                else if (ext.equals(".gif")) resolvedContentType = "image/gif";
            }
        }

        if (!ALLOWED_MIME_TYPES.contains(resolvedContentType)) {
            throw new ValidationException("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPEG, PNG, WEBP, GIF.");
        }

        String extension = resolveExtension(originalFilename, contentType);
        byte[] fileBytes;
        try {
            fileBytes = inputStream.readAllBytes();
        } catch (IOException e) {
            log.error("Lỗi khi đọc dữ liệu hình ảnh: {}", e.getMessage(), e);
            throw new DataAccessException("Lỗi khi đọc dữ liệu hình ảnh.", e);
        }

        String fileUrl = null;

        // 1. Ưu tiên tải trực tiếp lên Cloudinary (Cloud Object Storage)
        if (this.cloudinary != null) {
            try {
                @SuppressWarnings("rawtypes")
                Map uploadResult = this.cloudinary.uploader().upload(fileBytes, ObjectUtils.asMap(
                        "folder", "webchicken",
                        "resource_type", "image"
                ));
                fileUrl = (String) uploadResult.get("secure_url");
                if (fileUrl == null) {
                    fileUrl = (String) uploadResult.get("url");
                }
                log.info("Đã tải ảnh lên Cloudinary thành công: {} -> URL: {}", originalFilename, fileUrl);
            } catch (Exception e) {
                log.error("Lỗi khi tải ảnh lên Cloudinary, chuyển sang lưu tệp cục bộ: {}", e.getMessage(), e);
            }
        }

        // 2. Fallback lưu vào ổ đĩa cục bộ nếu Cloudinary chưa cấu hình hoặc gặp sự cố mạng
        if (fileUrl == null) {
            fileUrl = saveToLocalStorage(extension, fileBytes);
        }

        MediaAssetEntity entity = new MediaAssetEntity(
                UUID.randomUUID().toString(),
                userId,
                originalFilename != null ? originalFilename : "image" + extension,
                fileUrl,
                contentType,
                fileSize > 0 ? fileSize : fileBytes.length,
                LocalDateTime.now()
        );

        mediaDAO.save(entity);
        log.info("Đã lưu thông tin ảnh vào cơ sở dữ liệu: {} -> URL: {}", originalFilename, fileUrl);

        return new MediaUploadResponse(
                entity.getId(),
                entity.getFileName(),
                entity.getFileUrl(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getCreatedAt()
        );
    }

    private String saveToLocalStorage(String extension, byte[] fileBytes) {
        String randomFileName = UUID.randomUUID().toString() + extension;
        Path targetPath = uploadDir.resolve(randomFileName);
        try {
            Files.write(targetPath, fileBytes);
        } catch (IOException e) {
            log.error("Lỗi khi ghi tệp vào hệ thống lưu trữ cục bộ: {}", targetPath, e);
            throw new DataAccessException("Lỗi hệ thống khi lưu trữ hình ảnh.", e);
        }
        return "/api/v1/media/files/" + randomFileName;
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
            if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp") || ext.equals(".gif")) {
                return ext;
            }
            if (ext.equals(".jfif")) {
                return ".jpg";
            }
        }
        return switch (contentType != null ? contentType.toLowerCase() : "") {
            case "image/png", "image/x-png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
