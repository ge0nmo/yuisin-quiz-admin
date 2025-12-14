// 1. 공통 응답 구조 (백엔드의 GlobalResponse와 매칭)
export interface GlobalResponse<T> {
    resultCode?: string;
    message?: string;
    data: T;
    pageInfo?: PageInfo; // 페이징 정보 추가
}

// 2. 페이징 정보
export interface PageInfo {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

// 2. 과목 (Subject)
export interface Subject {
    id: number;
    name: string;
}

// 3. 시험 (Exam)
export interface Exam {
    id: number;
    name: string;
    year: number;
    subjectId: number;
}

// 4. 문제의 보기 (Choice)
export interface Choice {
    id?: number; // 등록 시에는 없을 수 있음
    number: number;
    content: string;
    isAnswer: boolean;
}

// 5. 문제 (Problem - 조회용)
export interface Problem {
    id: number;
    examId: number;
    number: number;
    content: string;     // HTML content
    explanation: string; // HTML content
    choices: Choice[];
}

// 6. 문제 요청 DTO (ProblemRequest - 등록/수정용)
export interface ProblemRequest {
    id?: number;
    examId: number;
    number: number;
    content: string;
    explanation: string;
    choices: Choice[];
}

// [신규] 로그인 응답 데이터 (백엔드 JSON 참고)
export interface LoginResult {
    id: number;
    email: string;
    role: "ADMIN" | "USER"; // Enum 처럼 사용
    accessToken: string;
}

// [신규] 질문 (Question)
export interface Question {
    id: number;
    title: string;
    username: string; // 작성자
    content: string;
    answerCount: number;
    answeredByAdmin: boolean;
    createdAt: string;
}

// [신규] 답변 (Answer)
export interface Answer {
    id: number;
    username: string; // 답변자 (관리자)
    content: string;
    createdAt: string;
}