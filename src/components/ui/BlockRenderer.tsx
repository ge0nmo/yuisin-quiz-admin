// src/components/ui/BlockRenderer.tsx
import { Block, TextSpan } from "@/src/types";

// Helper Component for rendering spans
const RichText = ({ block }: { block: Block }) => {
    // 1. Spans (Rich Text)
    if (block.spans && block.spans.length > 0) {
        return (
            <>
                {block.spans.map((span, sIdx) => {
                    // Style classes
                    const classes = [
                        span.bold ? 'font-bold' : '',
                        span.italic ? 'italic' : '',
                        span.underline ? 'underline' : '',
                        span.strikethrough ? 'line-through' : '',
                    ].filter(Boolean).join(' ');

                    // Inline styles
                    const style: React.CSSProperties = {};
                    if (span.color) style.color = span.color;
                    if (span.backgroundColor) style.backgroundColor = span.backgroundColor;

                    return (
                        <span key={sIdx} className={classes} style={style}>
                            {span.text}
                        </span>
                    );
                })}
            </>
        );
    }

    // 2. Fallback (Legacy Simple Text)
    if (block.text) {
        return <>{block.text}</>;
    }

    // 3. Empty (Enter only) -> Render br to keep height
    return <br />;
};

// Helper to group consecutive list items
const groupBlocks = (blocks: Block[]) => {
    const groups: (Block | Block[])[] = [];
    let currentList: Block[] = [];
    let currentListType: 'bullet' | 'ordered' | null = null;

    blocks.forEach((block) => {
        if (block.type === 'text' && block.listing) {
            // If list type changes, push current list and start new
            if (currentList.length > 0 && currentListType && currentListType !== block.listing) {
                groups.push([...currentList]);
                currentList = [];
            }
            currentListType = block.listing;
            currentList.push(block);
        } else {
            // Not a list item or non-text block
            if (currentList.length > 0) {
                groups.push([...currentList]);
                currentList = [];
                currentListType = null;
            }
            groups.push(block);
        }
    });

    // Push remaining list
    if (currentList.length > 0) {
        groups.push([...currentList]);
    }

    return groups;
};

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
    if (!blocks || blocks.length === 0) return null;

    const groups = groupBlocks(blocks);

    return (
        <div className="space-y-2 text-gray-900">
            {groups.map((item, index) => {
                // 1. List Group (Array of blocks)
                if (Array.isArray(item)) {
                    if (item.length === 0) return null;
                    const firstBlock = item[0];
                    const listType = firstBlock.listing;
                    const ListTag = listType === 'ordered' ? 'ol' : 'ul';
                    const listClass = listType === 'ordered' ? 'list-decimal' : 'list-disc';

                    return (
                        <ListTag key={index} className={`pl-5 space-y-1 ${listClass}`}>
                            {item.map((block, bIdx) => (
                                <li key={bIdx} style={{ textAlign: block.align || 'left' }}>
                                    <RichText block={block} />
                                </li>
                            ))}
                        </ListTag>
                    );
                }

                // 2. Single Block
                const block = item as Block;

                if (block.type === 'image' && block.src) {
                    return (
                        <div key={index} className="my-2" style={{ textAlign: block.align || 'left' }}>
                            <img
                                src={block.src}
                                alt={block.alt || "problem-image"}
                                className="max-w-full h-auto rounded-md border border-gray-200 inline-block"
                            />
                        </div>
                    );
                }

                if (block.type === 'text') {
                    // Standard Paragraph
                    return (
                        <div key={index} style={{ textAlign: block.align || 'left' }} className="whitespace-pre-wrap leading-relaxed min-h-[1.5em]">
                            <RichText block={block} />
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}