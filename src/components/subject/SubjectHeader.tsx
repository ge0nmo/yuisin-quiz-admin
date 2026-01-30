import { Plus } from "lucide-react";

interface Props {
    onAddSubject: () => void;
}

export default function SubjectHeader({ onAddSubject }: Props) {
    return (
        <div className="sticky top-0 z-50 mb-6 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all">
            <div className="flex items-center justify-between">
                <h1 className="ml-2 text-xl font-bold text-gray-900">과목 관리</h1>
                <button
                    onClick={onAddSubject}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md transition hover:scale-105 hover:shadow-lg active:scale-95"
                >
                    <Plus size={18} />
                    <span>과목 추가</span>
                </button>
            </div>
        </div>
    );
}
