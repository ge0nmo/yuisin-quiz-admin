"use client";

import { useEffect, useState } from "react";
import {
    Plus, Search, Trash2, Edit, Save, X,
    Square, CheckSquare
} from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import TiptapEditor from "@/src/components/editor/TiptapEditor";

import { getSubjects } from "@/src/services/subject";
import { getExamYears, getExams } from "@/src/services/exam";
import { getProblems, saveProblem, deleteProblem } from "@/src/services/problem";
import { Subject, Exam, Problem, Choice } from "@/src/types";

export default function ProblemPage() {
    // --- State ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);

    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

    const [problems, setProblems] = useState<Problem[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [inputNumber, setInputNumber] = useState<number>(0);
    const [inputContent, setInputContent] = useState("");
    const [inputExplanation, setInputExplanation] = useState("");
    const [inputChoices, setInputChoices] = useState<Choice[]>([]);

    // --- Helpers (단순 조회용) ---
    const fetchProblems = async (examId: number) => {
        try {
            const list = await getProblems(examId);
            setProblems(list);
        } catch (e) { console.error(e); }
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
            // 1. 과목 로딩
            const subList = await getSubjects();
            setSubjects(subList);

            // 2. 세션 확인
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
    }, []); // 최초 1회만 실행

    // --- 이벤트 핸들러 ---
    const onSubjectChange = async (subId: number) => {
        setSelectedSubjectId(subId);
        sessionStorage.setItem("subjectId", String(subId));

        // 초기화
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

    // --- 모달 로직 ---
    const openCreate = () => {
        if (!selectedExamId) return alert("시험을 선택해주세요.");
        setEditingId(null);
        setInputNumber(problems.length + 1);
        setInputContent("");
        setInputExplanation("");
        // 기본 보기 5개 생성
        setInputChoices(Array.from({ length: 5 }, (_, i) => ({
            number: i + 1, content: "", isAnswer: false
        })));
        setIsModalOpen(true);
    };

    const openUpdate = (p: Problem) => {
        setEditingId(p.id);
        setInputNumber(p.number);
        setInputContent(p.content);
        setInputExplanation(p.explanation);
        setInputChoices(JSON.parse(JSON.stringify(p.choices)));
        setIsModalOpen(true);
    };

    const onSave = async () => {
        if (!selectedExamId) return;
        if (!inputNumber) return alert("번호를 입력하세요.");

        // 내용 체크
        const textOnly = inputContent.replace(/<[^>]*>?/gm, '').trim();
        if (!textOnly && !inputContent.includes("<img")) return alert("지문을 입력하세요.");

        // 정답 체크
        if (!inputChoices.some(c => c.isAnswer)) return alert("정답을 최소 1개 선택하세요.");

        try {
            await saveProblem(selectedExamId, {
                id: editingId || undefined,
                examId: selectedExamId,
                number: inputNumber,
                content: inputContent,
                explanation: inputExplanation,
                choices: inputChoices
            });

            setIsModalOpen(false);
            fetchProblems(selectedExamId); // 목록 갱신
            alert("저장되었습니다.");
        } catch (e) {
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

    // --- 보기(Choices) 제어 ---
    // value의 타입을 'string | boolean | null'로 지정하여 문자열과 불리언 모두 허용
    const updateChoice = (index: number, field: 'content' | 'isAnswer', value: string | boolean | null) => {
        const newChoices = [...inputChoices];

        if (field === 'isAnswer') {
            // 정답 체크는 기존 값을 반전(토글)시키는 방식이므로 value 값을 굳이 안 써도 됨
            // (만약 value로 강제 지정하고 싶다면 newChoices[index].isAnswer = !!value; 로 해도 됨)
            newChoices[index].isAnswer = !newChoices[index].isAnswer;
        } else {
            // content는 문자열이어야 함. null이나 boolean이 들어오면 무시하거나 빈 문자열 처리
            if (typeof value === 'string') {
                newChoices[index].content = value;
            }
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
        newChoices.forEach((c, i) => c.number = i + 1); // 번호 재정렬
        setInputChoices(newChoices);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            {/* 필터 영역 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-wrap items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900 mr-2">문제 관리</h1>

                <select
                    className="border p-2.5 rounded-xl text-sm min-w-[150px] text-gray-900 font-medium"
                    value={selectedSubjectId || ""}
                    onChange={(e) => onSubjectChange(Number(e.target.value))}
                >
                    <option value="">과목 선택</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select
                    className="border p-2.5 rounded-xl text-sm min-w-[120px] text-gray-900 font-medium"
                    value={selectedYear || ""}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    disabled={!selectedSubjectId}
                >
                    <option value="">연도 선택</option>
                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>

                <select
                    className="border p-2.5 rounded-xl text-sm min-w-[200px] text-gray-900 font-medium"
                    value={selectedExamId || ""}
                    onChange={(e) => onExamChange(Number(e.target.value))}
                    disabled={!selectedYear}
                >
                    <option value="">시험 선택</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>

                <div className="flex-1"></div>

                <button onClick={openCreate} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-medium">
                    <Plus size={18} /> 새 문제 등록
                </button>
            </div>

            {/* 리스트 영역 */}
            <div className="grid gap-6">
                {problems.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p>등록된 문제가 없습니다.</p>
                    </div>
                ) : (
                    problems.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg text-sm">No. {p.number}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => openUpdate(p)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={18} /></button>
                                    <button onClick={() => onDelete(p.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="prose prose-sm max-w-none mb-6 text-gray-900" dangerouslySetInnerHTML={{ __html: p.content }} />
                                <div className="grid grid-cols-1 gap-2">
                                    {p.choices.map((c) => (
                                        <div key={c.number} className={`flex items-start p-3 rounded-xl border ${c.isAnswer ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                            <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${c.isAnswer ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{c.number}</span>
                                            <span className={`text-sm ${c.isAnswer ? 'font-bold text-green-800' : 'text-gray-700'}`}>{c.content}</span>
                                        </div>
                                    ))}
                                </div>
                                {p.explanation && (
                                    <div className="bg-amber-50 p-4 rounded-xl text-sm text-gray-800 border border-amber-100 mt-4">
                                        <strong className="block text-amber-800 mb-2 font-bold">💡 해설</strong>
                                        <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: p.explanation }} />
                                    </div>
                                )}
                            </div>
                        </div>
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
                        <TiptapEditor value={inputContent} onChange={setInputContent} minHeight="200px" />
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-gray-900">보기 설정</label>
                            <button onClick={addChoiceRow} className="text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium text-gray-700">+ 추가</button>
                        </div>
                        {inputChoices.map((choice, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <button onClick={() => updateChoice(idx, 'isAnswer', null)} className={`p-1 rounded transition ${choice.isAnswer ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}>
                                    {choice.isAnswer ? <CheckSquare size={24} /> : <Square size={24} />}
                                </button>
                                <span className="font-bold text-gray-500 w-6 text-center">{choice.number}</span>
                                <input
                                    type="text"
                                    className="flex-1 border p-2 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={choice.content}
                                    onChange={(e) => updateChoice(idx, 'content', e.target.value)}
                                    placeholder={`보기 ${choice.number}`}
                                />
                                {inputChoices.length > 2 && <button onClick={() => removeChoiceRow(idx)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-gray-900">해설</label>
                        <TiptapEditor value={inputExplanation} onChange={setInputExplanation} minHeight="150px" placeholder="해설 입력" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">취소</button>
                        <button onClick={onSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"><Save size={18} /> 저장</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}