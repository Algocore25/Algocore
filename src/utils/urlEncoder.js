/**
 * URL Safe Base64 Encoder/Decoder to keep URLs as short as possible
 */

export const encodeShort = (str) => {
    if (!str) return "";
    try {
        // Use btoa for base64, then make it URL safe
        // 1. encodeURIComponent to handle special characters (UTF-8)
        // 2. unescape/encode trick for btoa to handle UTF-8
        const utf8str = unescape(encodeURIComponent(str));
        const base64 = btoa(utf8str);
        // Replace chars that are not URL safe and remove padding
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch (e) {
        console.error("Encoding error", e);
        return encodeURIComponent(str);
    }
};

export const decodeShort = (encoded) => {
    if (!encoded) return "";
    try {
        // Restore URL safety and padding
        let base64 = encoded
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        while (base64.length % 4) {
            base64 += '=';
        }

        // Decode
        const utf8str = atob(base64);
        return decodeURIComponent(escape(utf8str));
    } catch (e) {
        // Fallback to simple decode if it wasn't base64 encoded
        try {
            return decodeURIComponent(encoded);
        } catch (e2) {
            return encoded;
        }
    }
};
