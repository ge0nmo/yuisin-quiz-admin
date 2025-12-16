"use client";

// (dashboard)/layout.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/src/utils/cn";
import {
    LayoutDashboard,
    Book,
    BookOpen,
    FileQuestion,
    MessageCircleQuestion,
    LogOut,
    Menu
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // [보안 추가] 토큰이 없으면 로그인 페이지로 강제 리다이렉트
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.replace("/login");
        }
    }, [router]);

    const handleLogout = () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userRole");
            sessionStorage.clear();
            router.push("/login");
        }
    };

    const menuItems = [
        { name: "대시보드", href: "/", icon: LayoutDashboard },
        { name: "과목 관리", href: "/subject", icon: Book },
        { name: "시험 관리", href: "/exam", icon: BookOpen },
        { name: "문제 관리", href: "/problem", icon: FileQuestion },
        { name: "질문 게시판", href: "/question", icon: MessageCircleQuestion },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* 사이드바 */}
            <aside
                className={cn(
                    "bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 transition-all duration-300",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* 로고 영역 */}
                <div className="h-16 flex items-center justify-center border-b px-4">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-600 overflow-hidden whitespace-nowrap">
                        <LayoutDashboard size={28} />
                        <span className={cn("transition-all", !isSidebarOpen && "hidden")}>
                            관리자 페이지
                        </span>
                    </div>
                </div>

                {/* 메뉴 리스트 */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        // [핵심] 대시보드('/')와 다른 하위 메뉴 구분 로직
                        const isActive = item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                                    !isSidebarOpen && "justify-center"
                                )}
                                title={!isSidebarOpen ? item.name : ""}
                            >
                                <item.icon size={22} />
                                <span className={cn("whitespace-nowrap transition-all", !isSidebarOpen && "hidden")}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 로그아웃 버튼 */}
                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 w-full text-left text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                            !isSidebarOpen && "justify-center"
                        )}
                        title="로그아웃"
                    >
                        <LogOut size={22} />
                        <span className={cn("whitespace-nowrap", !isSidebarOpen && "hidden")}>
                            로그아웃
                        </span>
                    </button>
                </div>
            </aside>

            {/* 메인 컨텐츠 영역 */}
            <div className={cn("flex-1 flex flex-col transition-all duration-300", isSidebarOpen ? "ml-64" : "ml-20")}>
                {/* 상단 헤더 */}
                <header className="h-16 bg-white border-b flex items-center px-6 shadow-sm sticky top-0 z-10">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 mr-4"
                    >
                        <Menu size={20} />
                    </button>
                    <h2 className="font-semibold text-gray-700"></h2>
                </header>

                {/* 페이지 컨텐츠 */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}