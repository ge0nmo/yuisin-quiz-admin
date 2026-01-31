import { Plus } from "lucide-react";
import { Subject, Exam } from "@/src/types";

interface Props {
    subjects: Subject[];
    years: number[];
    exams: Exam[];
    selectedSubjectId: number | null;
    selectedYear: number | null;
    selectedExamId: number | null;
    onSubjectChange: (id: number) => void;
    onYearChange: (year: number) => void;
    onExamChange: (id: number) => void;
    onCreate: () => void;
}

export default function ProblemHeader({
    subjects,
    years,
    exams,
    selectedSubjectId,
    selectedYear,
    selectedExamId,
    onSubjectChange,
    onYearChange,
    onExamChange,
    onCreate,
}: Props) {
    return (
        <div className="sticky top-0 z-50 mb-6 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all">
            <div className="flex flex-wrap items-center gap-4">
                {/*<h1 className="mr-2 text-xl font-bold text-gray-900">문제 관리</h1>*/}

                {/*<div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>*/}

                <select
                    className="min-w-[150px] rounded-xl border border-gray-200 bg-white/50 p-2.5 text-sm font-medium text-gray-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={selectedSubjectId || ""}
                    onChange={(e) => onSubjectChange(Number(e.target.value))}
                >
                    <option value="">과목 선택</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>

                <select
                    className="min-w-[120px] rounded-xl border border-gray-200 bg-white/50 p-2.5 text-sm font-medium text-gray-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                    value={selectedYear || ""}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    disabled={!selectedSubjectId}
                >
                    <option value="">연도 선택</option>
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {y}년
                        </option>
                    ))}
                </select>

                <select
                    className="min-w-[200px] rounded-xl border border-gray-200 bg-white/50 p-2.5 text-sm font-medium text-gray-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                    value={selectedExamId || ""}
                    onChange={(e) => onExamChange(Number(e.target.value))}
                    disabled={!selectedYear}
                >
                    <option value="">시험 선택</option>
                    {exams.map((e) => (
                        <option key={e.id} value={e.id}>
                            {e.name}
                        </option>
                    ))}
                </select>

                <div className="flex-1"></div>

                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md transition hover:scale-105 hover:shadow-lg active:scale-95"
                >
                    <Plus size={18} />
                    <span>새 문제 등록</span>
                </button>
            </div>
        </div>
    );
}
