"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, JSONContent } from '@tiptap/react'; // JSONContent 추가
import {
    Plus, Search, Trash2, Edit, Save, X,
    Square, CheckSquare
} from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import TiptapEditor from "@/src/components/editor/TiptapEditor";
import BlockRenderer from "@/src/components/ui/BlockRenderer";
import ProblemHeader from "@/src/components/problem/ProblemHeader";
import ProblemCard from "@/src/components/problem/ProblemCard";
import ProblemSkeleton from "@/src/components/problem/ProblemSkeleton";

// [V2] Services & Utils
import { getSubjects } from "@/src/services/subject";
import { getExamYears, getExams } from "@/src/services/exam";
import { getProblemsV2, saveProblemV2, deleteProblem } from "@/src/services/problem"; // V2 API 사용
import { tiptapToBackendBlocks, backendBlocksToHtml } from "@/src/utils/blockMapper"; // [V2] 변환기

// [V2] Types
import { Subject, Exam, Problem, Choice } from "@/src/types";

export default function ProblemPage() {
    // --- State: 필터링 관련 ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);

    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

    // --- State: 데이터 (V2 타입) ---
    const [problems, setProblems] = useState<Problem[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Loading state added

    // --- State: 모달 및 입력 폼 ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [inputNumber, setInputNumber] = useState<number>(0);
    const [inputChoices, setInputChoices] = useState<Choice[]>([]);

    // [V2 핵심] 에디터 상태 관리전략
    // 1. 초기 로딩용 (DB Block -> HTML String 변환)
    const [editorContentHtml, setEditorContentHtml] = useState("");
    const [editorExplanationHtml, setEditorExplanationHtml] = useState("");

    // 2. 저장용 (Tiptap JSON Output)
    const [contentJson, setContentJson] = useState<JSONContent | null>(null);
    const [explanationJson, setExplanationJson] = useState<JSONContent | null>(null);


    // --- Helpers ---
    const fetchProblems = async (examId: number) => {
        setIsLoading(true);
        try {
            const list = await getProblemsV2(examId); // [V2] API 호출
            setProblems(list);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExams = async (subId: number, year: number) => {
        try {
            const list = await getExams(subId, year);
            setExams(list);
            return list;
        } catch (e) { return []; }
    };

    const fetchYears = async (subId: number) => {
        try {
            const list = await getExamYears(subId);
            setYears(list);
            return list;
        } catch (e) { return []; }
    };

    // --- 초기화 (세션 복구) ---
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
                await fetchYears(subId);

                if (sYear && sExamId) {
                    const year = Number(sYear);
                    const examId = Number(sExamId);

                    setSelectedYear(year);
                    await fetchExams(subId, year);

                    setSelectedExamId(examId);
                    await fetchProblems(examId);
                }
            }
        };

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- 이벤트 핸들러 (필터) ---
    const onSubjectChange = async (subId: number) => {
        setSelectedSubjectId(subId);
        sessionStorage.setItem("subjectId", String(subId));

        setSelectedYear(null);
        setSelectedExamId(null);
        setExams([]);
        setProblems([]);
        await fetchYears(subId);
    };

    const onYearChange = async (year: number) => {
        setSelectedYear(year);
        setSelectedExamId(null);
        setProblems([]);
        if (selectedSubjectId) {
            await fetchExams(selectedSubjectId, year);
        }
    };

    const onExamChange = async (examId: number) => {
        setSelectedExamId(examId);
        sessionStorage.setItem("examId", String(examId));
        await fetchProblems(examId);
    };

    // --- 모달 로직 (V2 적용) ---
    const openCreate = () => {
        if (!selectedExamId) return alert("시험을 선택해주세요.");
        setEditingId(null);
        setInputNumber(problems.length + 1);

        // [V2] 에디터 초기화
        setEditorContentHtml("<p></p>");
        setEditorExplanationHtml("<p></p>");
        setEditorContentHtml("<p></p>");
        setEditorExplanationHtml("<p></p>");
        setContentJson(null);
        setExplanationJson(null);

        setInputChoices(Array.from({ length: 5 }, (_, i) => ({
            number: i + 1, content: "", isAnswer: false
        })));
        setIsModalOpen(true);
    };

    const openUpdate = (p: Problem) => {
        setEditingId(p.id);
        setInputNumber(p.number);

        // [V2 핵심] DB의 Block List를 Tiptap이 이해할 수 있는 HTML로 변환하여 주입
        setEditorContentHtml(backendBlocksToHtml(p.content));
        setEditorExplanationHtml(backendBlocksToHtml(p.explanation));

        // State 초기화: TiptapEditor가 마운트되면서 onCreate로 채워줄 것임.
        // 이를 초기화하지 않으면 이전 문제의 데이터가 남아있을 수 있음.
        setContentJson(null);
        setExplanationJson(null);

        setInputChoices(JSON.parse(JSON.stringify(p.choices)));
        setIsModalOpen(true);
    };

    const onSave = async () => {
        if (!selectedExamId) return;
        if (!inputNumber) return alert("번호를 입력하세요.");

        // [V2 핵심] Tiptap JSON -> Backend Block List 변환
        // 주의: 모달을 열고 아무것도 수정하지 않고 '저장'을 누르면 contentJson이 비어있을 수 있음.
        // 이 경우, 초기 로딩된 HTML을 다시 파싱하거나, 에디터 컴포넌트가 마운트 시 JSON을 뱉어주어야 함.
        // TiptapEditor 컴포넌트에서 onUpdate를 초기 로딩 시에도 호출해주면 해결됨.

        const contentBlocks = tiptapToBackendBlocks(contentJson);
        const explanationBlocks = tiptapToBackendBlocks(explanationJson);

        // 내용 체크 (텍스트나 이미지가 하나라도 있는지)
        // contentBlocks가 비어있다면, 사용자가 에디터를 건드리지 않았거나 진짜 비운 것임.
        // 여기서는 "편집을 안 건드렸다"고 가정하고 기존 데이터를 쓰는 복잡한 로직보다는,
        // TiptapEditor가 로딩 시 onUpdate를 호출하게 만드는 것이 가장 깔끔함 (앞선 TiptapEditor 코드에 반영됨)

        if (contentBlocks.length === 0 && editingId === null) {
            // 신규 생성인데 내용이 없으면 경고
            return alert("지문을 입력하세요.");
        }

        if (!inputChoices.some(c => c.isAnswer)) return alert("정답을 최소 1개 선택하세요.");

        try {
            await saveProblemV2(selectedExamId, {
                id: editingId || undefined,
                number: inputNumber,
                content: contentBlocks,         // [V2] Block List 전송
                explanation: explanationBlocks, // [V2] Block List 전송
                choices: inputChoices
            });

            setIsModalOpen(false);
            fetchProblems(selectedExamId);
            alert("저장되었습니다.");
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        }
    };

    const onDelete = async (id: number) => {
        if (!confirm("삭제하시겠습니까?")) return;
        try {
            await deleteProblem(id);
            if (selectedExamId) fetchProblems(selectedExamId);
        } catch (e) { alert("삭제 실패"); }
    };

    // --- 보기(Choices) 제어 (기존 로직 유지) ---
    const updateChoice = (index: number, field: 'content' | 'isAnswer', value: string | boolean | null) => {
        const newChoices = [...inputChoices];
        if (field === 'isAnswer') {
            newChoices[index].isAnswer = !newChoices[index].isAnswer;
        } else {
            if (typeof value === 'string') newChoices[index].content = value;
        }
        setInputChoices(newChoices);
    };

    const addChoiceRow = () => {
        setInputChoices([
            ...inputChoices,
            { number: inputChoices.length + 1, content: "", isAnswer: false }
        ]);
    };

    const removeChoiceRow = (index: number) => {
        const newChoices = inputChoices.filter((_, i) => i !== index);
        newChoices.forEach((c, i) => c.number = i + 1);
        setInputChoices(newChoices);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            {/* 필터 영역 */}
            {/* Sticky Header */}
            <ProblemHeader
                subjects={subjects}
                years={years}
                exams={exams}
                selectedSubjectId={selectedSubjectId}
                selectedYear={selectedYear}
                selectedExamId={selectedExamId}
                onSubjectChange={onSubjectChange}
                onYearChange={onYearChange}
                onExamChange={onExamChange}
                onCreate={openCreate}
            />

            {/* 리스트 영역 */}
            <div className="grid gap-6">
                {isLoading ? (
                    // Loading State: Show 3 Skeletons
                    Array.from({ length: 3 }).map((_, i) => <ProblemSkeleton key={i} />)
                ) : problems.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg mt-2 font-medium">문제가 없습니다.</p>
                        <p className="text-sm mb-6">새로운 문제를 등록하여 시작해보세요.</p>
                        <button
                            onClick={openCreate}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            새 문제 등록하기
                        </button>
                    </div>
                ) : (
                    problems.map((p) => (
                        <ProblemCard
                            key={p.id}
                            problem={p}
                            onEdit={() => openUpdate(p)}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>

            {/* 모달 영역 */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "문제 수정" : "새 문제 등록"} size="2xl">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <label className="font-bold text-gray-900 w-20">번호</label>
                        <input
                            type="number"
                            className="border p-2 rounded-lg w-24 text-center font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                            value={inputNumber}
                            onChange={(e) => setInputNumber(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-gray-900">지문</label>
                        {/* [V2] TiptapEditor: HTML로 초기화, JSON으로 출력 */}
                        {/* key를 사용하여 모달이 열릴 때마다(editingId 변경 시) 에디터를 완전히 리셋 */}
                        <TiptapEditor
                            key={`content-${editingId || 'new'}`}
                            value={editorContentHtml}
                            onChange={setContentJson}
                            minHeight="200px"
                            placeholder="문제 지문을 입력하세요 (이미지 드래그 가능)"
                        />
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-gray-900">보기 설정</label>
                            <button onClick={addChoiceRow} className="text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium text-gray-700 shadow-sm">+ 추가</button>
                        </div>
                        {inputChoices.map((choice, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <button onClick={() => updateChoice(idx, 'isAnswer', null)} className={`p-1 rounded transition ${choice.isAnswer ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}>
                                    {choice.isAnswer ? <CheckSquare size={24} /> : <Square size={24} />}
                                </button>
                                <span className="font-bold text-gray-500 w-6 text-center">{choice.number}</span>
                                <input
                                    type="text"
                                    className="flex-1 border p-2 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={choice.content}
                                    onChange={(e) => updateChoice(idx, 'content', e.target.value)}
                                    placeholder={`보기 ${choice.number}`}
                                />
                                {inputChoices.length > 2 && <button onClick={() => removeChoiceRow(idx)} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-gray-900">해설</label>
                        <TiptapEditor
                            key={`expl-${editingId || 'new'}`}
                            value={editorExplanationHtml}
                            onChange={setExplanationJson}
                            minHeight="150px"
                            placeholder="해설을 입력하세요"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition">취소</button>
                        <button onClick={onSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"><Save size={18} /> 저장</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}