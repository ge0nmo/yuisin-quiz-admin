import { GlobalResponse, TokenResponse } from "@/src/types";

// next.config.ts의 rewrites에 의해 http://localhost:8080/api... 로 연결됨
const BASE_URL = "/api";

// 리프레시 토큰 갱신 중인지 여부 (동시성 제어)
let isRefreshing = false;
// 갱신 대기 중인 요청들을 담아둘 배열
let refreshSubscribers: ((token: string) => void)[] = [];

// 갱신 후 대기 중인 요청들을 재시도하게 만드는 함수
function onRefreshed(accessToken: string) {
    refreshSubscribers.forEach((callback) => callback(accessToken));
    refreshSubscribers = [];
}

// 갱신 요청을 구독(대기)시키는 함수
function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

// 토큰 갱신 API 호출
async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return null;

        const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
            throw new Error("Failed to refresh token");
        }

        const responseBody: GlobalResponse<TokenResponse> = await res.json();
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = responseBody.data;

        localStorage.setItem("accessToken", newAccessToken);
        // 리프레시 토큰도 새로 발급된다면 갱신 (Rotation)
        if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
        }

        return newAccessToken;
    } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
    }
}

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    // 1. 로컬 스토리지에서 토큰 가져오기
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // 로그인 관련 요청인지 확인
    const isLoginRequest = url.includes("/login");

    const getHeaders = (accessToken: string | null) => ({
        "Content-Type": "application/json",
        ...(options?.headers),
        // 로그인 요청이 아닐 때만 토큰을 헤더에 추가
        ...(!isLoginRequest && accessToken && { Authorization: `Bearer ${accessToken}` }),
    });

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: getHeaders(token),
    });

    // 2. 에러 처리 로직
    if (!res.ok) {
        let errorMessage = `API Error: ${res.status}`;
        let errorCode = "";

        try {
            const errorBody = await res.json();
            if (errorBody.message) errorMessage = errorBody.message;
            if (errorBody.code) errorCode = errorBody.code; // 백엔드 에러 코드 확인
        } catch (e) {
            console.error("Error parsing error response", e);
        }

        // [핵심] 토큰 만료 감지 및 갱신 로직
        // 백엔드에서 내려주는 "TOKEN_EXPIRED" 코드 확인
        if (res.status === 401 && errorCode === "TOKEN_EXPIRED") {
            if (typeof window !== 'undefined' && !isLoginRequest) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    const newToken = await refreshAccessToken();
                    isRefreshing = false;

                    if (newToken) {
                        onRefreshed(newToken);
                    } else {
                        // 갱신 실패 시 로그아웃 처리
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        localStorage.removeItem("userRole");
                        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                        window.location.href = "/login";
                        return {} as T;
                    }
                }

                // 토큰 갱신 대기 후 재요청 (Queueing)
                return new Promise((resolve) => {
                    addRefreshSubscriber((newToken) => {
                        // 갱신된 토큰으로 헤더 교체 후 재요청
                        fetch(`${BASE_URL}${url}`, {
                            ...options,
                            headers: getHeaders(newToken),
                        })
                            .then((retryRes) => retryRes.json())
                            .then((data) => resolve(data));
                    });
                });
            }
        }

        // 401 Unauthorized (다른 이유) 또는 403 Forbidden 처리
        if (res.status === 401 || res.status === 403) {
            if (typeof window !== 'undefined' && !isLoginRequest) {
                // 토큰 삭제 및 로그아웃
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userRole");

                // alert("접근 권한이 없거나 세션이 만료되었습니다.");
                window.location.href = "/login";

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