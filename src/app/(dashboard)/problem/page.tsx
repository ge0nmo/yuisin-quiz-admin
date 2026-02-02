"use client";

import { useEffect, useState } from "react";
import {
    Plus, Search, Trash2, Edit, Save, X,
    Square, CheckSquare
} from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import TiptapEditor from "@/src/components/editor/TiptapEditor";
import ProblemHeader from "@/src/components/problem/ProblemHeader";
import ProblemCard from "@/src/components/problem/ProblemCard";
import ProblemSkeleton from "@/src/components/problem/ProblemSkeleton";

// Services & Hooks
import { getSubjects } from "@/src/services/subject";
import { getExamYears, getExams } from "@/src/services/exam";
import { getProblemsV2 } from "@/src/services/problem";
import { useProblemForm } from "@/src/hooks/useProblemForm";
import { Subject, Exam, Problem } from "@/src/types";

export default function ProblemPage() {
    // --- State: 필터링 ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);

    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

    const [problems, setProblems] = useState<Problem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Data Fetching Logic ---
    const fetchProblems = async (examId: number) => {
        setIsLoading(true);
        try {
            const list = await getProblemsV2(examId);
            setProblems(list);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const refreshProblems = () => {
        if (selectedExamId) fetchProblems(selectedExamId);
    };

    // --- Custom Hook for Form Logic ---
    const form = useProblemForm(selectedExamId, refreshProblems);

    // --- Initial Load & Filters ---
    // (기존과 동일하되 가독성을 위해 간략화)
    useEffect(() => {
        const initialize = async () => {
            const subList = await getSubjects();
            setSubjects(subList);
            const sSubId = sessionStorage.getItem("subjectId");
            const sExamId = sessionStorage.getItem("examId");
            const sYear = sessionStorage.getItem("examYear");

            if (sSubId) {
                const subId = Number(sSubId);
                setSelectedSubjectId(subId);
                const yearList = await getExamYears(subId); // fetchYears logic inline
                setYears(yearList);

                if (sYear && sExamId) {
                    const year = Number(sYear);
                    const examId = Number(sExamId);
                    setSelectedYear(year);
                    const examList = await getExams(subId, year); // fetchExams inline
                    setExams(examList);
                    setSelectedExamId(examId);
                    await fetchProblems(examId);
                }
            }
        };
        initialize();
    }, []);

    const onSubjectChange = async (subId: number) => {
        setSelectedSubjectId(subId);
        sessionStorage.setItem("subjectId", String(subId));
        setSelectedYear(null);
        setSelectedExamId(null);
        setExams([]);
        setProblems([]);
        const yList = await getExamYears(subId);
        setYears(yList);
    };

    const onYearChange = async (year: number) => {
        setSelectedYear(year);
        setSelectedExamId(null);
        setProblems([]);
        if (selectedSubjectId) {
            const eList = await getExams(selectedSubjectId, year);
            setExams(eList);
        }
    };

    const onExamChange = async (examId: number) => {
        setSelectedExamId(examId);
        sessionStorage.setItem("examId", String(examId));
        await fetchProblems(examId);
    };

    // Helper for Choices UI
    const updateChoice = (index: number, val: string) => {
        const newChoices = [...form.inputChoices];
        newChoices[index].content = val;
        form.setInputChoices(newChoices);
    };
    const toggleAnswer = (index: number) => {
        const newChoices = [...form.inputChoices];
        newChoices[index].isAnswer = !newChoices[index].isAnswer;
        form.setInputChoices(newChoices);
    };
    const addChoice = () => {
        form.setInputChoices([...form.inputChoices, { number: form.inputChoices.length + 1, content: "", isAnswer: false }]);
    };
    const removeChoice = (idx: number) => {
        const next = form.inputChoices.filter((_, i) => i !== idx);
        next.forEach((c, i) => c.number = i + 1);
        form.setInputChoices(next);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            <ProblemHeader
                subjects={subjects} years={years} exams={exams}
                selectedSubjectId={selectedSubjectId} selectedYear={selectedYear} selectedExamId={selectedExamId}
                onSubjectChange={onSubjectChange} onYearChange={onYearChange} onExamChange={onExamChange}
                onCreate={() => form.openCreate(problems.length)}
            />

            <div className="grid gap-6 mt-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <ProblemSkeleton key={i} />)
                ) : problems.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p>문제가 없습니다.</p>
                        <button onClick={() => form.openCreate(problems.length)} className="text-blue-600 font-bold hover:underline mt-2">새 문제 등록하기</button>
                    </div>
                ) : (
                    problems.map((p) => (
                        <ProblemCard
                            key={p.id}
                            problem={p}
                            onEdit={() => form.openUpdate(p)}
                            onDelete={form.remove}
                        />
                    ))
                )}
            </div>

            <Modal isOpen={form.isModalOpen} onClose={() => form.setIsModalOpen(false)} title={form.editingId ? "문제 수정" : "새 문제 등록"} size="2xl">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <label className="font-bold text-gray-900 w-20">번호</label>
                        <input
                            type="number"
                            className="border p-2 rounded-lg w-24 text-center font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.inputNumber}
                            onChange={(e) => form.setInputNumber(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-gray-900">지문</label>
                        {/* Key를 변경하여 모달 열 때마다 에디터 강제 리셋 */}
                        <TiptapEditor
                            key={`content-${form.editingId || 'new'}`}
                            value={form.initialContentHtml}
                            onChange={form.setContentJson}
                            minHeight="200px"
                            placeholder="지문을 입력하세요"
                        />
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-gray-900">보기 설정</label>
                            <button onClick={addChoice} className="text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium">+ 추가</button>
                        </div>
                        {form.inputChoices.map((choice, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {/* 1. 체크박스 버튼: text-gray-300(연함) -> text-gray-400(잘보임)으로 변경 */}
                                <button
                                    onClick={() => toggleAnswer(idx)}
                                    className={`p-1 rounded transition ${
                                        choice.isAnswer
                                            ? 'text-green-600'
                                            : 'text-gray-400 hover:text-gray-600' // 여기를 400으로 진하게 수정
                                    }`}
                                >
                                    {choice.isAnswer ? <CheckSquare size={24} /> : <Square size={24} />}
                                </button>

                                {/* 번호 표시 */}
                                <span className="font-bold text-gray-500 w-6 text-center">{choice.number}</span>

                                {/* 2. 입력창: 글자색(text-gray-900)과 테두리(border-gray-300) 명시 */}
                                <input
                                    type="text"
                                    className="flex-1 border border-gray-300 p-2 rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    value={choice.content}
                                    onChange={(e) => updateChoice(idx, e.target.value)}
                                    placeholder={`보기 ${choice.number}`}
                                />

                                {/* 삭제 버튼 */}
                                {form.inputChoices.length > 2 && (
                                    <button
                                        onClick={() => removeChoice(idx)}
                                        className="text-gray-400 hover:text-red-500 transition"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-gray-900">해설</label>
                        <TiptapEditor
                            key={`expl-${form.editingId || 'new'}`}
                            value={form.initialExplanationHtml}
                            onChange={form.setExplanationJson}
                            minHeight="150px"
                            placeholder="해설을 입력하세요"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => form.setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl">취소</button>
                        <button onClick={form.save} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"><Save size={18} /> 저장</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}