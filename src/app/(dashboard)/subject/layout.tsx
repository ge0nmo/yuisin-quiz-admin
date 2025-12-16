// src/app/(dashboard)/subject/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "과목 관리",
    description: "과목 관리 페이지",
};

export default function SubjectLayout(
    {children,
    }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}