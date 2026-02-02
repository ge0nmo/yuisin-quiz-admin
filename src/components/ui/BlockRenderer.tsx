// src/components/ui/BlockRenderer.tsx
import React, { useState } from 'react';
import { X, ZoomIn } from "lucide-react";
import { Block, TextBlock, ImageBlock, ListBlock, ListItemBlock, TextSpan } from "@/src/types";

// [Type Fix] any 대신 CSS 속성 타입 사용
type TextAlign = React.CSSProperties['textAlign'];

interface ExpandableImageProps {
    src: string;
    alt: string;
    align?: TextAlign;
}

const ExpandableImage = ({ src, alt, align }: ExpandableImageProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (isOpen) {
        return (
            <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                }}
            >
                <div className="relative max-w-[90vw] max-h-[90vh]">
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-[90vh] object-contain rounded-md"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        className="absolute -top-10 right-0 text-white hover:text-gray-300"
                    >
                        <X size={32} />
                    </button>
                    <p className="text-white/70 text-center mt-2 text-sm">클릭하면 닫힙니다</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-4 relative group block" style={{ textAlign: align || 'left' }}>
            <div className="inline-block relative">
                <img
                    src={src}
                    alt={alt}
                    onClick={() => setIsOpen(true)}
                    // [UX 해결] max-w-sm: 모바일 사이즈(약 384px)로 강제 고정
                    className="max-w-sm w-full h-auto object-contain rounded-lg shadow-sm border border-gray-100 cursor-zoom-in hover:opacity-95 transition"
                />
                {/* 호버 시 돋보기 아이콘 표시 */}
                <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    <ZoomIn size={16} />
                </div>
            </div>
        </div>
    );
};

// [분리] 복잡한 RichText 렌더링을 별도 컴포넌트로
const RichTextRenderer = ({ spans, text }: { spans?: TextSpan[], text?: string }) => {
    if (spans && spans.length > 0) {
        return (
            <>
                {spans.map((span, index) => {
                    if (span.text === "\n") return <br key={index} />;

                    const classes = [
                        span.bold ? 'font-bold' : '',
                        span.italic ? 'italic' : '',
                        span.underline ? 'underline' : '',
                        span.strikethrough ? 'line-through' : '',
                    ].filter(Boolean).join(' ');

                    const style: React.CSSProperties = {};
                    if (span.color) style.color = span.color;
                    if (span.backgroundColor) style.backgroundColor = span.backgroundColor;

                    return (
                        <span key={index} className={classes} style={style}>
                            {span.text}
                        </span>
                    );
                })}
            </>
        );
    }
    // 레거시 텍스트 처리
    return <>{text}</>;
};

// [분리] 단일 블록 렌더러
const SingleBlockRenderer = ({ block }: { block: Block }) => {
    if (!block) return null;

    if (block.type === 'text') {
        const b = block as TextBlock;
        const Tag = b.tag || 'p';

        // [UX 해결] 두 줄 내려감 방지 및 줄간격 최적화
        let baseClass = "min-h-[1.5em] break-words leading-relaxed";

        if (Tag === 'h1') baseClass += " text-2xl font-bold mt-4 mb-2";
        else if (Tag === 'h2') baseClass += " text-xl font-bold mt-3 mb-2";
        else if (Tag === 'h3') baseClass += " text-lg font-bold mt-2 mb-1";
        else if (Tag === 'blockquote') baseClass += " border-l-4 border-gray-300 pl-4 py-1 italic bg-gray-50 text-gray-700 my-2";

        return (
            <Tag style={{ textAlign: b.align || 'left' }} className={baseClass}>
                <RichTextRenderer spans={b.spans} text={b.text} />
            </Tag>
        );
    }

    if (block.type === 'image') {
        const b = block as ImageBlock;
        // any 타입 에러 해결을 위해 타입 단언 혹은 안전한 처리
        const align = (b.align as TextAlign) || 'left';
        return <ExpandableImage src={b.src} alt={b.alt || ''} align={align} />;
    }

    if (block.type === 'list') {
        const b = block as ListBlock;
        const ListTag = b.ordered ? 'ol' : 'ul';
        const listClass = b.ordered ? 'list-decimal' : 'list-disc';
        return (
            <ListTag className={`pl-6 my-2 space-y-1 ${listClass}`}>
                {b.children.map((child, idx) => (
                    <SingleBlockRenderer key={idx} block={child} />
                ))}
            </ListTag>
        );
    }

    if (block.type === 'listItem') {
        const b = block as ListItemBlock;
        return (
            <li className="pl-1">
                {b.children.map((child, idx) => (
                    <div key={idx}>
                        <SingleBlockRenderer block={child} />
                    </div>
                ))}
            </li>
        );
    }

    return null;
};

// [레거시 호환] 옛날 데이터 구조 처리
const groupLegacyBlocks = (blocks: Block[]) => {
    const groups: (Block | Block[])[] = [];
    let currentList: Block[] = [];
    let currentListType: 'bullet' | 'ordered' | null = null;

    blocks.forEach((block) => {
        if (block.type === 'text' && (block as TextBlock).listing) {
            const tb = block as TextBlock;
            if (currentList.length > 0 && currentListType && currentListType !== tb.listing) {
                groups.push([...currentList]);
                currentList = [];
            }
            currentListType = tb.listing!;
            currentList.push(block);
        } else {
            if (currentList.length > 0) {
                groups.push([...currentList]);
                currentList = [];
                currentListType = null;
            }
            groups.push(block);
        }
    });
    if (currentList.length > 0) groups.push([...currentList]);
    return groups;
};

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
    if (!blocks || blocks.length === 0) return null;
    const groups = groupLegacyBlocks(blocks);

    return (
        <div className="space-y-1 text-gray-900 text-[15px] leading-7">
            {groups.map((item, index) => {
                if (Array.isArray(item)) {
                    // Legacy List Rendering
                    if (item.length === 0) return null;
                    const first = item[0] as TextBlock;
                    const Tag = first.listing === 'ordered' ? 'ol' : 'ul';
                    const listStyle = first.listing === 'ordered' ? 'list-decimal' : 'list-disc';
                    return (
                        <Tag key={index} className={`pl-6 my-2 space-y-0.5 ${listStyle}`}>
                            {item.map((b, idx) => (
                                <li key={idx}>
                                    <RichTextRenderer spans={(b as TextBlock).spans} text={(b as TextBlock).text} />
                                </li>
                            ))}
                        </Tag>
                    );
                }
                return <SingleBlockRenderer key={index} block={item as Block} />;
            })}
        </div>
    );
}