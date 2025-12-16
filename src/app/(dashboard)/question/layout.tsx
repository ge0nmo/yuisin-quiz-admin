// src/app/(dashboard)/question/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "질문 게시판",
    description: "질문 게시판 페이지",
};

export default function SubjectLayout(
    {children,
    }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}