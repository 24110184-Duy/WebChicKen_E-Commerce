<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebChicKen — API Server</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #f97316;
      --primary-hover: #ea580c;
      --success: #22c55e;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px;
      max-width: 650px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    p {
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 24px;
      font-size: 15px;
    }
    .notice {
      background: rgba(249, 115, 22, 0.1);
      border-left: 4px solid var(--primary);
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #fed7aa;
    }
    .notice strong { color: #fff; }
    .links-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    a.btn-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    a.btn-link:hover {
      background: rgba(249, 115, 22, 0.15);
      border-color: var(--primary);
      color: var(--primary);
    }
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      API Server Online
    </div>
    <h1>🍗 WebChicKen E-Commerce API</h1>
    <p>Hệ thống Backend RESTful API phát triển trên nền tảng <strong>Java Servlet 6.0</strong>, <strong>Tomcat 10.1</strong> và <strong>PostgreSQL Neon</strong>.</p>

    <div class="notice">
      💡 <strong>Lưu ý cấu hình IntelliJ IDEA:</strong> Để tránh lỗi 404 cho API và khớp với proxy Vite, hãy mở <em>Run/Debug Configuration &rarr; Tomcat &rarr; Deployment</em> và sửa <strong>Application context</strong> thành <code>/</code> (thay vì <code>/web1_war_exploded</code>).
    </div>

    <div class="links-grid">
      <a class="btn-link" href="api/v1/system/health" target="_blank">
        <span>🩺 Health Liveness</span>
        <span>&rarr;</span>
      </a>
      <a class="btn-link" href="api/v1/system/health/ready" target="_blank">
        <span>🗄️ Database Readiness</span>
        <span>&rarr;</span>
      </a>
      <a class="btn-link" href="api/v1/categories" target="_blank">
        <span>📂 Danh mục (Categories)</span>
        <span>&rarr;</span>
      </a>
      <a class="btn-link" href="api/v1/products" target="_blank">
        <span>📦 Sản phẩm (Products)</span>
        <span>&rarr;</span>
      </a>
    </div>

    <div class="footer">
      <span>Tomcat 10.1 · Jakarta EE 10</span>
      <span>Frontend SPA: <a href="http://localhost:5173" style="color: var(--primary); text-decoration: none;">localhost:5173</a></span>
    </div>
  </div>
</body>
</html>