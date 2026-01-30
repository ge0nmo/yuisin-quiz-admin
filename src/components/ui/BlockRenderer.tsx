// src/components/ui/BlockRenderer.tsx
import { Block, TextSpan, TextBlock, ImageBlock, ListBlock, ListItemBlock } from "@/src/types";

// Helper Component for rendering spans
const RichText = ({ spans, text }: { spans?: TextSpan[], text?: string }) => {
    // 1. Spans (Rich Text)
    if (spans && spans.length > 0) {
        return (
            <>
                {spans.map((span, sIdx) => {
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
    if (text) {
        return <>{text}</>;
    }

    // 3. Empty (Enter only) -> Render br to keep height
    return <br />;
};

// Helper to group consecutive legacy list items
const groupLegacyBlocks = (blocks: Block[]) => {
    const groups: (Block | Block[])[] = [];
    let currentList: Block[] = [];
    let currentListType: 'bullet' | 'ordered' | null = null;

    // Legacy list handling: consecutive TextBlocks with 'listing' prop should be grouped
    blocks.forEach((block) => {
        if (block.type === 'text' && (block as TextBlock).listing) {
            const tb = block as TextBlock;
            // If list type changes, push current list and start new
            if (currentList.length > 0 && currentListType && currentListType !== tb.listing) {
                groups.push([...currentList]);
                currentList = [];
            }
            currentListType = tb.listing!;
            currentList.push(block);
        } else {
            // Not a legacy list item
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

    // Group blocks to handle legacy lists
    // Note: New recursive ListBlocks are single items in this array, so they pass through fine.
    const groups = groupLegacyBlocks(blocks);

    return (
        <div className="space-y-2 text-gray-900 leading-relaxed">
            {groups.map((item, index) => {
                // 1. Legacy List Group
                if (Array.isArray(item)) {
                    if (item.length === 0) return null;
                    const firstBlock = item[0] as TextBlock;
                    const listType = firstBlock.listing;
                    const ListTag = listType === 'ordered' ? 'ol' : 'ul';
                    const listClass = listType === 'ordered' ? 'list-decimal' : 'list-disc';

                    return (
                        <ListTag key={index} className={`pl-5 space-y-1 ${listClass} my-2`}>
                            {item.map((block, bIdx) => {
                                const tb = block as TextBlock;
                                return (
                                    <li key={bIdx} style={{ textAlign: tb.align || 'left' }}>
                                        <RichText spans={tb.spans} text={tb.text} />
                                    </li>
                                );
                            })}
                        </ListTag>
                    );
                }

                // 2. Single Block (New types or non-list Legacy Types)
                return <SingleBlockRenderer key={index} block={item as Block} />;
            })}
        </div>
    );
}

const SingleBlockRenderer = ({ block }: { block: Block }) => {
    if (!block) return null;

    // 1. Text Block (Paragraph / Heading / Blockquote)
    if (block.type === 'text') {
        const b = block as TextBlock;
        // If it has listing, it should have been handled by groupLegacyBlocks ideally.
        // But if it slips through (single item?), we render as li if inside ul/ol context?
        // No context here. Treat as paragraph if not grouped.

        const Tag = b.tag || 'p'; // h1, h2, h3, p, blockquote

        let classes = "whitespace-pre-wrap min-h-[1.5em]";
        if (Tag === 'h1') classes += " text-2xl font-bold mt-4 mb-2";
        else if (Tag === 'h2') classes += " text-xl font-bold mt-3 mb-2";
        else if (Tag === 'h3') classes += " text-lg font-bold mt-2 mb-1";
        else if (Tag === 'blockquote') classes += " border-l-4 border-gray-300 pl-4 py-1 italic bg-gray-50 text-gray-700";

        return (
            <Tag style={{ textAlign: b.align || 'left' }} className={classes}>
                <RichText spans={b.spans} text={b.text} />
            </Tag>
        );
    }

    // 2. Image Block
    if (block.type === 'image') {
        const b = block as ImageBlock;
        return (
            <div className="my-2" style={{ textAlign: b.align || 'left' }}>
                <img
                    src={b.src}
                    alt={b.alt || "problem-image"}
                    className="max-w-full h-auto rounded-md border border-gray-200 inline-block"
                />
            </div>
        );
    }

    // 3. New List Block (Recursive)
    if (block.type === 'list') {
        const b = block as ListBlock;
        const ListTag = b.ordered ? 'ol' : 'ul';
        const listClass = b.ordered ? 'list-decimal' : 'list-disc';

        return (
            <ListTag className={`pl-5 space-y-1 ${listClass} my-2`}>
                {b.children.map((child, idx) => (
                    <SingleBlockRenderer key={idx} block={child} />
                ))}
            </ListTag>
        );
    }

    // 4. List Item Block
    if (block.type === 'listItem') {
        const b = block as ListItemBlock;
        return (
            <li className="pl-1">
                {b.children.map((child, idx) => (
                    <SingleBlockRenderer key={idx} block={child} />
                ))}
            </li>
        );
    }

    return null;
};