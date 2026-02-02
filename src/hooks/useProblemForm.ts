import { useState, useCallback } from 'react';
import { Problem, ProblemSaveV2Request, Choice } from "@/src/types";
import { saveProblemV2, deleteProblem, getProblemsV2 } from "@/src/services/problem";
import { tiptapToBackendBlocks, backendBlocksToHtml } from "@/src/utils/blockTransformer";
import { JSONContent } from '@tiptap/react';

export function useProblemForm(examId: number | null, onRefresh: () => void) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [inputNumber, setInputNumber] = useState<number>(0);
    const [inputChoices, setInputChoices] = useState<Choice[]>([]);

    // 에디터 상태
    const [initialContentHtml, setInitialContentHtml] = useState("");
    const [initialExplanationHtml, setInitialExplanationHtml] = useState("");
    const [contentJson, setContentJson] = useState<JSONContent | null>(null);
    const [explanationJson, setExplanationJson] = useState<JSONContent | null>(null);

    const openCreate = useCallback((currentCount: number) => {
        if (!examId) { alert("시험을 선택해주세요."); return; }

        setEditingId(null);
        setInputNumber(currentCount + 1);

        setInitialContentHtml("<p></p>");
        setInitialExplanationHtml("<p></p>");
        setContentJson(null);
        setExplanationJson(null);

        setInputChoices(Array.from({ length: 5 }, (_, i) => ({
            number: i + 1, content: "", isAnswer: false
        })));
        setIsModalOpen(true);
    }, [examId]);

    const openUpdate = useCallback((p: Problem) => {
        setEditingId(p.id);
        setInputNumber(p.number);

        // Block -> HTML 변환 (초기 로딩용)
        setInitialContentHtml(backendBlocksToHtml(p.content));
        setInitialExplanationHtml(backendBlocksToHtml(p.explanation));

        // 저장용 JSON 초기화 (수정 안하고 저장할 경우 대비는 save에서 처리 필요)
        setContentJson(null);
        setExplanationJson(null);

        setInputChoices(JSON.parse(JSON.stringify(p.choices)));
        setIsModalOpen(true);
    }, []);

    const save = async () => {
        if (!examId) return;
        if (!inputNumber) return alert("번호를 입력하세요.");
        if (!inputChoices.some(c => c.isAnswer)) return alert("정답을 선택하세요.");

        // [방어 코드] 에디터를 건드리지 않았으면(null) 기존 데이터를 유지해야 할까요?
        // TiptapEditor 구조상 mount시 onUpdate가 불리거나, 초기값을 파싱해야 합니다.
        // 여기서는 TiptapEditor가 초기 로드 시에도 JSON을 뱉어주도록 컴포넌트 설계를 가정하거나,
        // null일 경우 "수정 없음"으로 간주해야 합니다.
        // 하지만 transformer는 HTML string을 역변환하지 않으므로,
        // 에디터 컴포넌트가 반드시 현재 상태의 JSON을 제공해야 합니다.

        // contentJson이 null이면(사용자가 클릭도 안함), 기존 HTML을 다시 파싱하는건 비효율적.
        // -> TiptapEditor의 onCreate에서 setContentJson을 호출해주도록 컴포넌트 수정됨.

        const contentBlocks = contentJson ? tiptapToBackendBlocks(contentJson) : tiptapToBackendBlocks({ type: 'doc', content: [] });
        // 주의: 실제로 에디터가 로딩되면 onCreate가 호출되어 contentJson이 채워질 것입니다.

        // 지문 유효성 검사 (Block 단위)
        if (contentBlocks.length === 0 && !editingId) {
            return alert("지문을 입력하세요.");
        }

        const explanationBlocks = explanationJson ? tiptapToBackendBlocks(explanationJson) : [];

        try {
            const req: ProblemSaveV2Request = {
                id: editingId || undefined,
                number: inputNumber,
                content: contentBlocks,
                explanation: explanationBlocks,
                choices: inputChoices
            };

            await saveProblemV2(examId, req);
            setIsModalOpen(false);
            onRefresh();
            alert("저장되었습니다.");
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        }
    };

    const remove = async (id: number) => {
        if (!confirm("삭제하시겠습니까?")) return;
        try {
            await deleteProblem(id);
            onRefresh();
        } catch (e) { alert("삭제 실패"); }
    };

    return {
        isModalOpen, setIsModalOpen,
        editingId, inputNumber, setInputNumber,
        inputChoices, setInputChoices,
        initialContentHtml, initialExplanationHtml,
        setContentJson, setExplanationJson,
        openCreate, openUpdate, save, remove
    };
}