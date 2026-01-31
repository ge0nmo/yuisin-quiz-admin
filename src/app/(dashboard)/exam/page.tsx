"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Search } from "lucide-react";
import Modal from "@/src/components/ui/Modal";

import { getSubjects } from "@/src/services/subject";
import { getExamYears, getExams, saveExam, updateExam, deleteExam } from "@/src/services/exam";
import { Subject, Exam } from "@/src/types";
import ExamHeader from "@/src/components/exam/ExamHeader";
import ExamSkeleton from "@/src/components/exam/ExamSkeleton";

export default function ExamPage() {
    const router = useRouter();

    // --- 상태 관리 (State) ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Loading state

    // 모달 관련 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "update">("create");
    const [currentExamId, setCurrentExamId] = useState<number | null>(null);

    // 입력 폼 상태
    const [inputName, setInputName] = useState("");
    const [inputYear, setInputYear] = useState<number>(new Date().getFullYear());

    // --- 함수 정의 (useEffect 위로 올림) ---

    const loadExamList = async (subId: number, year: number | null) => {
        setIsLoading(true);
        try {
            const data = await getExams(subId, year || undefined);
            setExams(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubjectSelect = async (subjectId: number) => {
        setSelectedSubjectId(subjectId);
        sessionStorage.setItem("subjectId", String(subjectId)); // 세션 저장

        try {
            const yearList = await getExamYears(subjectId);
            setYears(yearList);
        } catch (e) {
            console.error("연도 로딩 실패", e);
            setYears([]);
        }

        await loadExamList(subjectId, null);
    };

    const handleYearChange = (year: number | null) => {
        setSelectedYear(year);
        if (selectedSubjectId) {
            loadExamList(selectedSubjectId, year);
        }
    };

    // --- 초기 로딩 ---
    useEffect(() => {
        async function init() {
            try {
                const subList = await getSubjects();
                setSubjects(subList);

                const storedSubId = sessionStorage.getItem("subjectId");
                if (storedSubId) {
                    const subId = parseInt(storedSubId);
                    await handleSubjectSelect(subId);
                }
            } catch (e) {
                console.error("초기화 실패", e);
            }
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- CRUD 동작 ---

    const goToProblem = (exam: Exam) => {
        sessionStorage.setItem("examId", String(exam.id));
        sessionStorage.setItem("examName", exam.name);
        sessionStorage.setItem("examYear", String(exam.year));
        router.push("/problem");
    };

    const openCreateModal = () => {
        if (!selectedSubjectId) return alert("과목을 먼저 선택해주세요.");
        setModalMode("create");
        setInputName("");
        setInputYear(new Date().getFullYear());
        setIsModalOpen(true);
    };

    const openUpdateModal = (exam: Exam) => {
        setModalMode("update");
        setCurrentExamId(exam.id);
        setInputName(exam.name);
        setInputYear(exam.year);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!selectedSubjectId) return;
        if (!inputName.trim()) return alert("시험 이름을 입력하세요.");

        try {
            if (modalMode === "create") {
                await saveExam(selectedSubjectId, inputName, inputYear);
            } else {
                if (currentExamId) await updateExam(currentExamId, inputName, inputYear);
            }

            setIsModalOpen(false);
            const yearList = await getExamYears(selectedSubjectId);
            setYears(yearList);
            loadExamList(selectedSubjectId, selectedYear);

        } catch (e) {
            alert("저장 실패");
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteExam(id);
            if (selectedSubjectId) {
                const yearList = await getExamYears(selectedSubjectId);
                setYears(yearList);
                loadExamList(selectedSubjectId, selectedYear);
            }
        } catch (e) {
            alert("삭제 실패");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <ExamHeader
                subjects={subjects}
                years={years}
                selectedSubjectId={selectedSubjectId}
                selectedYear={selectedYear}
                onSubjectChange={handleSubjectSelect}
                onYearChange={(y) => handleYearChange(y === 0 ? null : y)}
                onAddExam={openCreateModal}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    {/* [수정] 헤더 텍스트 색상 text-gray-900 및 font-bold 명시 */}
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 text-sm uppercase">
                        <tr>
                            <th className="p-4 w-16 text-center font-bold">순번</th>
                            <th className="p-4 w-32 text-center font-bold">연도</th>
                            <th className="p-4 font-bold">시험 명칭</th>
                            <th className="p-4 w-40 text-center font-bold">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="p-0">
                                    <ExamSkeleton />
                                </td>
                            </tr>
                        ) : exams.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <Search size={40} className="text-gray-300" />
                                        <p>{selectedSubjectId ? "등록된 시험이 없습니다." : "과목을 선택해주세요."}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            exams.map((exam, index) => (
                                <tr key={exam.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 text-center text-gray-500 font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="p-4 text-center">
                                        {/* [수정] 뱃지 텍스트 색상 text-gray-900 명시 */}
                                        <span className="inline-block bg-gray-100 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">
                                            {exam.year}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {/* [수정] 시험 이름 색상 text-gray-900 명시 */}
                                        <button
                                            onClick={() => goToProblem(exam)}
                                            className="text-gray-900 font-bold hover:text-blue-600 hover:underline text-lg text-left"
                                        >
                                            {exam.name}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openUpdateModal(exam)}
                                                className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition"
                                                title="수정"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                                                title="삭제"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === "create" ? "시험 추가" : "시험 수정"}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        {/* [수정] 라벨 색상 진하게 */}
                        <label className="block text-sm font-bold text-gray-900 mb-1">시험 이름</label>
                        <input
                            type="text"
                            // [수정] 입력 텍스트 색상 text-gray-900 명시
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                            placeholder="예: 제59회 공인회계사 1차"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">연도</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                            value={inputYear}
                            onChange={(e) => setInputYear(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            저장
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}