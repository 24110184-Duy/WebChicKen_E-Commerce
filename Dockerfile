# ── Build Stage: Đóng gói ROOT.war bằng Maven & Java 17 ──
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# Tải trước dependencies để tận dụng Docker cache
COPY backend-servlet/pom.xml .
RUN mvn dependency:go-offline -B

# Copy mã nguồn và đóng gói WAR
COPY backend-servlet/src ./src
RUN mvn clean package -DskipTests

# ── Runtime Stage: Apache Tomcat 10.1 (Servlet 6.0, Jakarta EE 10) ──
FROM tomcat:10.1-jdk17-temurin
WORKDIR /usr/local/tomcat

# Dọn dẹp ứng dụng mặc định của Tomcat để tiết kiệm bộ nhớ và tránh xung đột
RUN rm -rf webapps/*

# Đặt ROOT.war vào webapps để phục vụ tại root path (/)
COPY --from=builder /build/target/ROOT.war webapps/ROOT.war

# Giới hạn Heap memory để ứng dụng chạy mượt trong 512MB RAM của Render Free Tier
ENV JAVA_OPTS="-Xms256m -Xmx384m -Dfile.encoding=UTF-8 -Duser.timezone=UTC"

# Port mặc định của Tomcat
EXPOSE 8080

CMD ["catalina.sh", "run"]
