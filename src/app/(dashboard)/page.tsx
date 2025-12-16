// (dashboard)/page.tsx

"use client";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">시스템 상태</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <p className="text-lg font-bold text-gray-800">정상 작동 중</p>
                    </div>
                </div>
            </div>
        </div>
    );
}