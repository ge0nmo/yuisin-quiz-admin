"use client";

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { useEffect, useCallback } from 'react';
import { ImageIcon } from 'lucide-react';
import { uploadFile } from '@/src/services/file';

interface TiptapEditorProps {
    value?: string;
    onChange?: (json: JSONContent) => void;
    placeholder?: string;
    minHeight?: string;
}

export default function TiptapEditor({ value, onChange, placeholder, minHeight = "200px" }: TiptapEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension.configure({
                inline: true,
                allowBase64: false,
            }),
        ],
        content: value || '<p></p>',
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getJSON());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none text-gray-900'
            },
            // ▼▼▼ [핵심 추가 1] 붙여넣기(Paste) 핸들링 ▼▼▼
            handlePaste: (view, event, slice) => {
                const items = Array.from(event.clipboardData?.items || []);
                const imageItem = items.find(item => item.type.startsWith('image'));

                if (imageItem) {
                    event.preventDefault(); // 기본 붙여넣기 막음
                    const file = imageItem.getAsFile();
                    if (file) {
                        handleImageUpload(file, view); // 업로드 함수 호출
                    }
                    return true; // 이벤트 처리 완료됨을 알림
                }
                return false; // 텍스트 등은 기본 동작 수행
            },
            // ▼▼▼ [핵심 추가 2] 드래그앤드롭(Drop) 핸들링 ▼▼▼
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image')) {
                        event.preventDefault();
                        handleImageUpload(file, view);
                        return true;
                    }
                }
                return false;
            }
        }
    });

    // [공통 함수] 이미지 업로드 및 에디터 삽입 로직 분리
    const handleImageUpload = async (file: File, view: any) => {
        try {
            // 1. 서버 업로드
            const url = await uploadFile(file);

            // 2. 현재 커서 위치에 이미지 노드 삽입
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src: url });
            const transaction = view.state.tr.replaceSelectionWith(node);
            view.dispatch(transaction);

        } catch (error) {
            console.error("Image upload failed via paste/drop:", error);
            alert("이미지 업로드에 실패했습니다.");
        }
    };

    const addImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file && editor) {
                // 위에서 만든 공통 로직 재사용 불가(view 객체가 없으므로) -> 기존 방식대로 chain 사용
                try {
                    const url = await uploadFile(file);
                    editor.chain().focus().setImage({ src: url }).run();
                } catch (error) {
                    console.error("Image upload failed:", error);
                    alert("이미지 업로드 실패");
                }
            }
        };
        input.click();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2">
                <button
                    onClick={addImage}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-600 flex items-center gap-1 text-xs font-medium"
                    type="button"
                >
                    <ImageIcon size={16} /> 이미지 추가
                </button>
            </div>

            <div
                className="p-4 cursor-text overflow-y-auto"
                style={{ minHeight }}
                onClick={() => editor.chain().focus().run()}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}