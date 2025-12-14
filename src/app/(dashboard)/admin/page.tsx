"use client";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 카드 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">환영합니다</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">관리자님</p>
                    <p className="text-sm text-gray-400 mt-4">오늘도 좋은 하루 되세요.</p>
                </div>

                {/* 카드 2 (예시) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">시스템 상태</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <p className="text-lg font-bold text-gray-800">정상 작동 중</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">📌 시작하기</h3>
                <p className="text-blue-600 text-sm">
                    왼쪽 사이드바 메뉴에서 <strong>[과목 관리]</strong>를 먼저 등록한 후,
                    <strong>[시험 관리]</strong>를 진행해주세요.
                </p>
            </div>
        </div>
    );
}