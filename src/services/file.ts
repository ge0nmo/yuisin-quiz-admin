
// next.config.ts rewrites to /api/admin/file
const UPLOAD_URL = "/api/admin/file";

export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // fetcher.ts와 동일한 인증 로직 사용
    const headers: HeadersInit = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!res.ok) {
        // 에러 처리
        const text = await res.text();
        throw new Error(text || `Upload failed: ${res.status}`);
    }

    // 백엔드는 URL 문자열(text/plain)을 반환함
    return res.text();
};
