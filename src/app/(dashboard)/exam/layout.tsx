// src/app/(dashboard)/exam/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "시험 관리",
    description: "시험 관리 페이지",
};

export default function SubjectLayout(
    {children,
    }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}