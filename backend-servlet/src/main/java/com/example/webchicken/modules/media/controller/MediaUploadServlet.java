package com.example.webchicken.modules.media.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.media.model.dto.response.MediaUploadResponse;
import com.example.webchicken.modules.media.service.MediaService;
import com.example.webchicken.modules.media.service.impl.MediaServiceImpl;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Servlet tiếp nhận và phục vụ tệp đa phương tiện: /api/v1/media/*
 * <ul>
 *   <li>POST /upload: Tải lên tệp ảnh (multipart/form-data, trường 'file', max 5MB)</li>
 *   <li>GET  /files/{fileName}: Trực tiếp phục vụ tệp ảnh tĩnh cho trình duyệt</li>
 * </ul>
 */
@WebServlet(name = "MediaUploadServlet", urlPatterns = {"/api/v1/media/*"})
@MultipartConfig(
        maxFileSize = 5 * 1024 * 1024,      // 5 MB
        maxRequestSize = 6 * 1024 * 1024,   // 6 MB
        fileSizeThreshold = 1024 * 1024     // 1 MB
)
public class MediaUploadServlet extends BaseApiServlet {

    public MediaUploadServlet() {
        super();
    }

    public MediaUploadServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private MediaService service() {
        return getService("mediaService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        // Phục vụ tệp tĩnh: /files/{fileName}
        if (pathInfo.startsWith("/files/")) {
            String fileName = pathInfo.substring("/files/".length());
            if (fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                badRequest(resp, "INVALID_PATH", "Tên tệp không hợp lệ.");
                return;
            }

            MediaService mediaService = service();
            if (mediaService instanceof MediaServiceImpl impl) {
                Path filePath = impl.getUploadDir().resolve(fileName).normalize();
                if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                    notFound(resp, "Không tìm thấy tệp ảnh.");
                    return;
                }

                String mime = Files.probeContentType(filePath);
                if (mime == null) mime = "image/jpeg";
                resp.setContentType(mime);
                resp.setContentLengthLong(Files.size(filePath));
                resp.setHeader("Cache-Control", "public, max-age=86400"); // Cache 1 ngày

                try (InputStream in = Files.newInputStream(filePath);
                     OutputStream out = resp.getOutputStream()) {
                    in.transferTo(out);
                }
                return;
            }
        }

        notFound(resp, "Endpoint không tồn tại.");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        if ("/upload".equalsIgnoreCase(pathInfo) || "/uploads".equalsIgnoreCase(pathInfo) || pathInfo.equals("/")) {
            AuthenticatedUser user = getAuthenticatedUser(req);
            String userId = user != null ? user.userId() : null;

            Part filePart = req.getPart("file");
            if (filePart == null || filePart.getSize() == 0) {
                badRequest(resp, "FILE_EMPTY", "Vui lòng chọn tệp hình ảnh để tải lên (trường 'file').");
                return;
            }

            String originalFilename = filePart.getSubmittedFileName();
            String contentType = filePart.getContentType();
            long fileSize = filePart.getSize();

            try (InputStream in = filePart.getInputStream()) {
                MediaUploadResponse result = service().uploadFile(userId, originalFilename, contentType, fileSize, in);
                created(resp, result);
            }
            return;
        }

        notFound(resp, "Endpoint không tồn tại.");
    }
}
