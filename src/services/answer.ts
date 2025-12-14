import { fetcher } from "./fetcher";
import { Answer, GlobalResponse } from "@/src/types";

const BASE_PATH = "/admin";

// 1. 답변 목록 조회
export const getAnswers = async (questionId: number, page: number = 1, size: number = 100) => {
    const res = await fetcher<GlobalResponse<Answer[]>>(`${BASE_PATH}/question/${questionId}/answer?page=${page - 1}&size=${size}`);
    return res.data;
};

// 2. 답변 등록 (AdminAnswerRegisterRequest 대응)
export const saveAnswer = (questionId: number, content: string) => {
    return fetcher<GlobalResponse<number>>(`${BASE_PATH}/question/${questionId}/answer`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
};

// 3. 답변 수정 (AdminAnswerUpdateRequest 대응)
export const updateAnswer = (answerId: number, content: string) => {
    return fetcher<GlobalResponse<void>>(`${BASE_PATH}/answer/${answerId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
    });
};

// 4. 답변 삭제
export const deleteAnswer = (answerId: number) =>
    fetcher<void>(`${BASE_PATH}/answer/${answerId}`, { method: "DELETE" });