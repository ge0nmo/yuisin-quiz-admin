import { GlobalResponse } from "@/src/types";

// next.config.ts의 rewrites에 의해 http://localhost:8080/api... 로 연결됨
const BASE_URL = "/api";

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    // 1. 로컬 스토리지에서 토큰 가져오기
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // 로그인 관련 요청인지 확인
    const isLoginRequest = url.includes("/login");

    const headers = {
        "Content-Type": "application/json",
        ...(options?.headers),
        // 로그인 요청이 아닐 때만 토큰을 헤더에 추가
        ...(!isLoginRequest && token && { Authorization: `Bearer ${token}` }),
    };

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    // 2. 에러 처리 로직
    if (!res.ok) {
        let errorMessage = `API Error: ${res.status}`;
        let errorBody = null;

        try {
            errorBody = await res.json();
            if (errorBody.message) errorMessage = errorBody.message;
            else if (errorBody.error) errorMessage = errorBody.error;
        } catch (e) {
            console.error("Error parsing error response", e);
        }

        // [핵심] 토큰 만료 감지 및 리다이렉트 로직
        // 1) 백엔드가 500을 주더라도 메시지에 "JWT expired"가 있는 경우
        // 2) 혹은 백엔드가 401(Unauthorized)을 주는 경우
        const isExpired = errorMessage.includes("JWT expired") || errorMessage.includes("expired");

        if (res.status === 401 || res.status === 403 || isExpired) {
            if (typeof window !== 'undefined' && !isLoginRequest) {
                // 토큰 삭제
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userRole");

                // 로그인 페이지로 강제 이동 (새로고침 효과를 위해 window.location 사용)
                alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                window.location.href = "/login";

                // 실행 중단 (빈 객체 반환)
                return {} as T;
            }
        }

        throw new Error(errorMessage);
    }

    // 응답 바디가 없는 경우(204) 처리
    if (res.status === 204 || res.headers.get("content-length") === "0") {
        return {} as T;
    }

    return res.json();
}