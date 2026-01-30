// login/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2 } from "lucide-react";
import { login } from "@/src/services/auth";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // [추가] 로그인 시도 시 기존에 남아있던 만료된 토큰 삭제 (안전장치)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");

        setError("");
        setIsLoading(true);

        try {
            const response = await login(email, password);
            const { accessToken, refreshToken, role } = response.data;

            if (role !== "ADMIN") {
                throw new Error("관리자 계정이 아닙니다.");
            }

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", role);

            router.push("/"); // 대시보드로 이동

        } catch (err: any) {
            console.error("로그인 에러:", err);
            setError(err.message || "아이디 또는 비밀번호가 일치하지 않습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">

                <div className="text-center mb-8">
                    <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-blue-600" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">관리자 로그인</h1>
                    <p className="text-gray-500 text-sm mt-2">서비스 관리를 위해 로그인해주세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">
                                <User size={18} />
                            </span>
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">
                                <Lock size={18} />
                            </span>
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="비밀번호 입력"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                로그인 중...
                            </>
                        ) : (
                            "로그인"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}