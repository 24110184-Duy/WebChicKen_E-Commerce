package com.example.webchicken.common.validation;

import java.util.regex.Pattern;

/**
 * Tiện ích kiểm tra và chuẩn hóa số điện thoại di động Việt Nam (+84).
 * <p>
 * Quy hoạch kho số viễn thông Việt Nam (10 chữ số):
 * <ul>
 *   <li>Viettel: 086, 096, 097, 098, 032, 033, 034, 035, 036, 037, 038, 039</li>
 *   <li>VinaPhone: 088, 091, 094, 081, 082, 083, 084, 085</li>
 *   <li>MobiFone: 089, 090, 093, 070, 076, 077, 078, 079</li>
 *   <li>Vietnamobile: 092, 052, 056, 058</li>
 *   <li>Gmobile: 099, 059</li>
 *   <li>Itelecom: 087</li>
 *   <li>Wintel: 055</li>
 * </ul>
 * </p>
 */
public final class VietnamesePhoneValidator {

    private static final Pattern VN_PHONE_PATTERN = Pattern.compile("^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$");

    private VietnamesePhoneValidator() {}

    /**
     * Chuẩn hóa số điện thoại về định dạng nội địa chuẩn 10 chữ số: 0xxxxxxxxx.
     * Chuyển đổi các định dạng +84, 84 hoặc có dấu cách/dấu gạch ngang về chuẩn duy nhất.
     */
    public static String normalize(String rawPhone) {
        if (rawPhone == null) return null;
        String cleaned = rawPhone.replaceAll("[\\s.-]", "").trim();
        if (cleaned.startsWith("+84")) {
            cleaned = "0" + cleaned.substring(3);
        } else if (cleaned.startsWith("84") && cleaned.length() == 11) {
            cleaned = "0" + cleaned.substring(2);
        }
        return cleaned;
    }

    /**
     * Kiểm tra số điện thoại có thuộc dải số di động hợp lệ của Việt Nam hay không.
     */
    public static boolean isValid(String rawPhone) {
        String normalized = normalize(rawPhone);
        if (normalized == null || normalized.length() != 10) {
            return false;
        }
        return VN_PHONE_PATTERN.matcher(normalized).matches();
    }

    /**
     * Nhận diện nhà mạng viễn thông Việt Nam tương ứng.
     */
    public static String detectCarrier(String rawPhone) {
        String normalized = normalize(rawPhone);
        if (!isValid(normalized)) {
            return null;
        }
        String prefix3 = normalized.substring(0, 3);
        return switch (prefix3) {
            case "086", "096", "097", "098", "032", "033", "034", "035", "036", "037", "038", "039" -> "Viettel";
            case "088", "091", "094", "081", "082", "083", "084", "085" -> "VinaPhone";
            case "089", "090", "093", "070", "076", "077", "078", "079" -> "MobiFone";
            case "092", "052", "056", "058" -> "Vietnamobile";
            case "099", "059" -> "Gmobile";
            case "087" -> "Itelecom";
            case "055" -> "Wintel";
            default -> "Vietnam Carrier";
        };
    }
}
