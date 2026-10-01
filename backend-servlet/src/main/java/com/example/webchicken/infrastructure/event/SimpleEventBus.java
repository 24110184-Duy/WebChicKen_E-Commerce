package com.example.webchicken.infrastructure.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.*;
import java.util.function.Consumer;

/**
 * EventBus nội bộ bất đồng bộ dùng cho giao tiếp giữa các Bounded Contexts.
 * Đảm bảo quản lý thread pool có kiểm soát và đóng an toàn khi shutdown.
 */
public class SimpleEventBus {

    private static final Logger log = LoggerFactory.getLogger(SimpleEventBus.class);
    private final ConcurrentHashMap<Class<?>, CopyOnWriteArrayList<Consumer<Object>>> listeners = new ConcurrentHashMap<>();
    private final ExecutorService executor;

    public SimpleEventBus() {
        this.executor = new ThreadPoolExecutor(
                2, 8, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(500),
                new ThreadFactory() {
                    private int count = 0;
                    @Override
                    public Thread newThread(Runnable r) {
                        Thread t = new Thread(r, "eventbus-worker-" + (++count));
                        t.setDaemon(true);
                        return t;
                    }
                }
        );
    }

    @SuppressWarnings("unchecked")
    public <T> void register(Class<T> eventType, Consumer<T> listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
                .add((Consumer<Object>) listener);
    }

    public void publish(Object event) {
        if (event == null) return;
        List<Consumer<Object>> eventListeners = listeners.get(event.getClass());
        if (eventListeners != null && !eventListeners.isEmpty()) {
            for (Consumer<Object> listener : eventListeners) {
                executor.submit(() -> {
                    try {
                        listener.accept(event);
                    } catch (Exception e) {
                        log.error("Lỗi khi xử lý sự kiện [{}]: {}", event.getClass().getSimpleName(), e.getMessage(), e);
                    }
                });
            }
        }
    }

    public void shutdown() {
        log.info("Dừng SimpleEventBus executor service...");
        executor.shutdown();
        try {
            if (!executor.awaitTermination(3, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
