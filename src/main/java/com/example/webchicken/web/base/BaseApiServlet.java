package com.example.webchicken.web.base;

import com.example.webchicken.common.model.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Lớp cha cho mọi Servlet API: viết JSON, đặt status code. */
public abstract class BaseApiServlet extends HttpServlet {
    protected final ObjectMapper objectMapper;

    protected BaseApiServlet(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    protected void writeJson(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(resp.getWriter(), body);
    }

    protected void ok(HttpServletResponse resp, Object data) throws IOException {
        writeJson(resp, 200, ApiResponse.ok(data));
    }

    protected void created(HttpServletResponse resp, Object data) throws IOException {
        writeJson(resp, 201, ApiResponse.ok(data));
    }

    protected void noContent(HttpServletResponse resp) {
        resp.setStatus(204);
    }
}
