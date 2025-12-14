import { GlobalResponse } from "@/src/types";

// next.config.ts의 rewrites에 의해 http://localhost:8080/api... 로 연결됨
const BASE_URL = "/api";

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    // 1. 로컬 스토리지에서 토큰 가져오기
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // [수정] 로그인 관련 요청인지 확인 (로그인 요청에는 토큰을 보내면 안 됨)
    const isLoginRequest = url.includes("/login");

    const headers = {
        "Content-Type": "application/json",
        ...(options?.headers),
        // [수정] 로그인 요청이 아닐 때만 토큰을 헤더에 추가
        ...(!isLoginRequest && token && { Authorization: `Bearer ${token}` }),
    };

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMessage = `API Error: ${res.status}`;
        try {
            const errorBody = await res.json();
            if (errorBody.message) errorMessage = errorBody.message;
            else if (errorBody.error) errorMessage = errorBody.error;
        } catch (e) {
            console.error("Error parsing error response", e);
        }
        throw new Error(errorMessage);
    }

    // 응답 바디가 없는 경우(204) 처리
    if (res.status === 204 || res.headers.get("content-length") === "0") {
        return {} as T;
    }

    return res.json();
}