// src/services/subject.ts
import { fetcher } from "./fetcher";
import { Subject, GlobalResponse } from "@/src/types";

const DOMAIN = "/admin/subject"; // @RequestMapping("/api/admin/subject")

// [GET] 목록 조회 (Controller가 List<SubjectDTO>를 바로 반환함)
export const getSubjects = () =>
    fetcher<Subject[]>(`${DOMAIN}`);

// [POST] 등록
export const saveSubject = (name: string) =>
    fetcher<GlobalResponse<number>>(`${DOMAIN}`, {
        method: "POST",
        body: JSON.stringify({ name }),
    });

// [PATCH] 수정
export const updateSubject = (id: number, name: string) =>
    fetcher<void>(`${DOMAIN}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    });

// [DELETE] 삭제
export const deleteSubject = (id: number) =>
    fetcher<void>(`${DOMAIN}/${id}`, { method: "DELETE" });