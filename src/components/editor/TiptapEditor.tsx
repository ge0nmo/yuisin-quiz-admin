"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
    Bold, Italic, List, ListOrdered, Image as ImageIcon,
    Heading1, Heading2, Quote, Undo, Redo
} from "lucide-react";
import { cn } from "@/src/utils/cn";

interface TiptapEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export default function TiptapEditor({
                                         value,
                                         onChange,
                                         placeholder = "내용을 입력하세요...",
                                         minHeight = "300px"
                                     }: TiptapEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: true }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose max-w-none focus:outline-none p-4 min-h-[${minHeight}] text-gray-900`, // text-gray-900 추가됨
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        // [핵심 수정] SSR 환경에서의 하이드레이션 불일치 방지
        immediatelyRender: false,
    });

    if (!editor) return null;

    // 툴바 버튼 스타일
    const btnClass = (isActive: boolean = false) =>
        cn(
            "p-2 rounded hover:bg-gray-100 transition-colors",
            isActive ? "bg-blue-50 text-blue-600" : "text-gray-600"
        );

    const addImage = () => {
        const url = window.prompt("이미지 URL을 입력하세요 (추후 파일 업로드로 교체 가능)");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="border rounded-lg overflow-hidden border-gray-200 bg-white shadow-sm flex flex-col h-full">
            {/* 툴바 */}
            <div className="flex items-center gap-1 bg-white border-b p-2 flex-wrap sticky top-0 z-10">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
                    <Bold size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
                    <Italic size={18} />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive("heading", { level: 1 }))}>
                    <Heading1 size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))}>
                    <Heading2 size={18} />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
                    <List size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
                    <ListOrdered size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>
                    <Quote size={18} />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <button type="button" onClick={addImage} className={btnClass()}>
                    <ImageIcon size={18} />
                </button>

                <div className="flex-1" /> {/* 우측 정렬을 위한 여백 */}

                <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass()}>
                    <Undo size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass()}>
                    <Redo size={18} />
                </button>
            </div>

            {/* 에디터 본문 영역 */}
            <div className="flex-1 overflow-y-auto cursor-text bg-gray-50/30" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} style={{ minHeight }} />
            </div>
        </div>
    );
}