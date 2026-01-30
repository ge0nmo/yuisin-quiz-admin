"use client";

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useCallback } from 'react';
import {
    ImageIcon, Bold, Italic, Strikethrough, Underline as UnderlineIcon,
    Baseline, Highlighter, Undo2, Redo2,
    AlignLeft, AlignCenter, AlignRight, List, ListOrdered
} from 'lucide-react';
import { uploadFile } from '@/src/services/file';

interface TiptapEditorProps {
    value?: string;
    onChange?: (json: JSONContent) => void;
    placeholder?: string;
    minHeight?: string;
}

// ---------------------------------------------------------------------------
// Helper Component: Toolbar Button
// Defined outside to avoid re-creation on every render (Performance & Lint Fix)
// ---------------------------------------------------------------------------
const ToolbarButton = ({ onClick, isActive, icon: Icon, title }: { onClick: () => void, isActive?: boolean, icon: any, title: string }) => (
    <button
        onClick={onClick}
        className={`p-1.5 rounded transition ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
        type="button"
        title={title}
    >
        <Icon size={18} strokeWidth={2} />
    </button>
);

export default function TiptapEditor({ value, onChange, placeholder, minHeight = "200px" }: TiptapEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Underline,
            Highlight.configure({ multicolor: true }),
            ImageExtension.configure({
                inline: false,
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
        onCreate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getJSON());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none text-gray-900 leading-relaxed px-2 max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5'
            },
            handlePaste: (view, event, slice) => {
                const items = Array.from(event.clipboardData?.items || []);
                const imageItem = items.find(item => item.type.startsWith('image'));

                if (imageItem) {
                    event.preventDefault();
                    const file = imageItem.getAsFile();
                    if (file) {
                        handleImageUpload(file, view);
                    }
                    return true;
                }
                return false;
            },
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

    const handleImageUpload = async (file: File, view: any) => {
        try {
            const url = await uploadFile(file);
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
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col shadow-sm">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-1 items-center flex-wrap select-none">

                {/* History */}
                <div className="flex gap-0.5 mr-2">
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo2} title="실행 취소" />
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo2} title="다시 실행" />
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Text Style */}
                <div className="flex gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="굵게" />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="기울임" />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} title="밑줄" />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="취소선" />
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Alignment */}
                <div className="flex gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="왼쪽 정렬" />
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="가운데 정렬" />
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="오른쪽 정렬" />
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Lists */}
                <div className="flex gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="목록" />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="번호 목록" />
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Color & Highlight */}
                <div className="flex gap-1 items-center">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition cursor-pointer overflow-hidden group" title="글자 색상">
                        <Baseline size={18} className="text-gray-600 group-hover:text-gray-900 z-0" />
                        <div className="absolute bottom-1.5 left-2 right-2 h-1 rounded-full z-0 pointer-events-none" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}></div>
                        <input
                            type="color"
                            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                            value={editor.getAttributes('textStyle').color || '#000000'}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                    <div className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition cursor-pointer overflow-hidden group" title="하이라이트">
                        <Highlighter size={18} className="text-gray-600 group-hover:text-gray-900 z-0" />
                        <div className="absolute bottom-1.5 left-2 right-2 h-1 rounded-full z-0 pointer-events-none" style={{ backgroundColor: editor.getAttributes('highlight')?.color || 'transparent' }}></div>
                        <input
                            type="color"
                            onInput={(e) => editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()}
                            value={editor.getAttributes('highlight')?.color || '#fde047'}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Image */}
                <button
                    onClick={addImage}
                    className="px-2 py-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-xs font-semibold transition"
                    type="button"
                >
                    <ImageIcon size={18} />
                </button>
            </div>

            <div
                className="p-4 cursor-text overflow-y-auto bg-white min-h-[200px]"
                style={{ minHeight }}
                onClick={() => editor.chain().focus().run()}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}