"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getQuestionDetail, deleteQuestion } from "@/src/services/question";
import { getAnswers, saveAnswer, deleteAnswer, updateAnswer } from "@/src/services/answer";
import { getProblemDetail } from "@/src/services/problem";
import { Question, Answer, Problem } from "@/src/types";

// 분리한 컴포넌트 임포트
import QuestionCard from "@/src/components/admin/question/QuestionCard";
import AnswerList from "@/src/components/admin/question/AnswerList";
import AnswerForm from "@/src/components/admin/question/AnswerForm";
import RelatedProblemModal from "@/src/components/admin/question/RelatedProblemModal";

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const questionId = Number(id);

    // --- State ---
    const [question, setQuestion] = useState<Question | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);

    // 모달 상태
    const [relatedProblem, setRelatedProblem] = useState<Problem | null>(null);
    const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);

    // 답변 폼 상태
    const [answerContent, setAnswerContent] = useState("");
    const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);

    // --- Data Loading ---
    const loadData = async () => {
        try {
            const q = await getQuestionDetail(questionId);
            setQuestion(q);
            const aList = await getAnswers(questionId);
            setAnswers(aList);
        } catch (e) {
            console.error(e);
            alert("데이터를 불러오는데 실패했습니다.");
            router.back();
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionId]);

    // --- Handlers ---
    const handleViewProblem = async () => {
        if (!question?.problemId) return alert("연결된 문제 정보가 없습니다.");
        try {
            const problemData = await getProblemDetail(question.problemId);
            setRelatedProblem(problemData);
            setIsProblemModalOpen(true);
        } catch (e) {
            alert("문제 정보를 불러오지 못했습니다.");
        }
    };

    const handleDeleteQuestion = async () => {
        if (!confirm("정말 이 질문을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) return;
        try {
            await deleteQuestion(questionId);
            alert("질문이 삭제되었습니다.");
            router.replace("/admin/question");
        } catch (e) { alert("질문 삭제 실패"); }
    };

    const handleSubmitAnswer = async () => {
        if (!answerContent.trim()) return alert("내용을 입력하세요.");
        try {
            if (editingAnswerId) {
                await updateAnswer(editingAnswerId, answerContent);
            } else {
                await saveAnswer(questionId, answerContent);
            }
            setAnswerContent("");
            setEditingAnswerId(null);
            loadData();
        } catch (e) { alert("저장 실패"); }
    };

    const handleDeleteAnswer = async (answerId: number) => {
        if (!confirm("답변을 삭제하시겠습니까?")) return;
        try { await deleteAnswer(answerId); loadData(); } catch (e) { alert("삭제 실패"); }
    };

    const handleEditAnswer = (answer: Answer) => {
        setEditingAnswerId(answer.id);
        setAnswerContent(answer.content);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingAnswerId(null);
        setAnswerContent("");
    };

    if (!question) return <div className="p-10 text-center text-gray-500">로딩 중...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition font-medium"
            >
                <ArrowLeft size={20} /> 목록으로 돌아가기
            </button>

            {/* 1. 질문 상세 카드 */}
            <QuestionCard
                question={question}
                onViewProblem={handleViewProblem}
                onDelete={handleDeleteQuestion}
            />

            {/* 2. 답변 목록 */}
            <AnswerList
                answers={answers}
                onEdit={handleEditAnswer}
                onDelete={handleDeleteAnswer}
            />

            {/* 3. 답변 입력 폼 */}
            <AnswerForm
                value={answerContent}
                onChange={setAnswerContent}
                onSubmit={handleSubmitAnswer}
                onCancel={handleCancelEdit}
                isEditing={!!editingAnswerId}
            />

            {/* 4. 관련 문제 모달 */}
            <RelatedProblemModal
                isOpen={isProblemModalOpen}
                onClose={() => setIsProblemModalOpen(false)}
                problem={relatedProblem}
            />
        </div>
    );
}