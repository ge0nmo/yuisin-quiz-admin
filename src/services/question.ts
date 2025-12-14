import { fetcher } from "@/src/services/fetcher";
import { Question, GlobalResponse } from "@/src/types";

const DOMAIN = "/admin/question";

// 1. 질문 목록 조회 (페이징)
export const getQuestions = async (page: number = 1, size: number = 10) => {
    // 백엔드 Pageable은 0부터 시작하므로 page - 1 처리
    const res = await fetcher<GlobalResponse<Question[]>>(`${DOMAIN}?page=${page - 1}&size=${size}`);
    return { data: res.data, pageInfo: res.pageInfo };
};

// 2. 질문 상세 조회
export const getQuestionDetail = async (id: number) => {
    const res = await fetcher<GlobalResponse<Question>>(`${DOMAIN}/${id}`);
    return res.data;
};

// 3. 질문 삭제
export const deleteQuestion = (id: number) =>
    fetcher<void>(`${DOMAIN}/${id}`, { method: "DELETE" });