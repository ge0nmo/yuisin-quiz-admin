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
    Menu,
    X
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // [Resizing Logic] 화면 크기에 따른 모바일 상태 감지 및 초기화
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // 모바일로 전환 시 사이드바 닫기, 데스크탑 전환 시 열기 (선택사항)
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // 초기 실행
        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

    // 사이드바 상태에 따른 클래스 결정
    const sidebarClasses = cn(
        "bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 transition-all duration-300 ease-in-out",
        // 모바일일 때: 항상 w-64, 열리면 translate-0, 닫히면 -translate-x-full
        // 데스크탑일 때: 열리면 w-64, 닫히면 w-20, 항상 translate-0
        isMobile
            ? `w-64 inset-y-0 left-0 ${isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`
            : `${isSidebarOpen ? "w-64" : "w-20"} translate-x-0`
    );

    // 메인 컨텐츠 영역의 마진 결정 (데스크탑만 적용, 모바일은 마진 0)
    const mainContentMargin = isMobile
        ? "ml-0"
        : (isSidebarOpen ? "ml-64" : "ml-20");

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* 모바일 오버레이 (사이드바 열렸을 때 배경 어둡게) */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 transition-opacity fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* 사이드바 */}
            <aside className={sidebarClasses}>
                {/* 로고 영역 */}
                <div className="h-16 flex items-center justify-between px-4 border-b">
                    <div className={cn("flex items-center gap-2 font-bold text-xl text-blue-600 overflow-hidden whitespace-nowrap", !isSidebarOpen && !isMobile && "justify-center w-full px-0")}>
                        <LayoutDashboard size={28} className="shrink-0" />
                        <span className={cn("transition-all", (!isSidebarOpen && !isMobile) && "hidden")}>
                            관리자 페이지
                        </span>
                    </div>
                    {/* 모바일 닫기 버튼 */}
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* 메뉴 리스트 */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => isMobile && setIsSidebarOpen(false)} // 모바일에서 클릭 시 닫기
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                                    (!isSidebarOpen && !isMobile) && "justify-center px-0"
                                )}
                                title={(!isSidebarOpen && !isMobile) ? item.name : ""}
                            >
                                <item.icon size={22} className="shrink-0" />
                                <span className={cn("whitespace-nowrap transition-all", (!isSidebarOpen && !isMobile) && "hidden")}>
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
                            (!isSidebarOpen && !isMobile) && "justify-center px-0"
                        )}
                        title="로그아웃"
                    >
                        <LogOut size={22} className="shrink-0" />
                        <span className={cn("whitespace-nowrap transition-all", (!isSidebarOpen && !isMobile) && "hidden")}>
                            로그아웃
                        </span>
                    </button>
                </div>
            </aside>

            {/* 메인 컨텐츠 영역 */}
            <div className={cn("flex-1 flex flex-col h-full transition-all duration-300", mainContentMargin)}>
                {/* 상단 헤더 */}
                <header className="h-16 min-h-[64px] bg-white border-b flex items-center px-4 sm:px-6 shadow-sm sticky top-0 z-20 w-full">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 me-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        <Menu size={20} />
                    </button>
                    <h2 className="font-semibold text-gray-700 truncate">
                        {/* 페이지 타이틀이 필요하면 여기에 추가 */}
                    </h2>
                    <div className="ml-auto">
                        {/* 우측 상단 프로필이나 알림 아이콘 등을 위한 공간 */}
                    </div>
                </header>

                {/* 페이지 컨텐츠 */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-100">
                    <div className="mx-auto max-w-7xl w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}