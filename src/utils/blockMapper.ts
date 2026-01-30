import { JSONContent } from '@tiptap/react';
import { Block, TextBlock, ImageBlock, ListBlock, ListItemBlock, TextSpan } from '@/src/types';

/**
 * Tiptap JSON -> Backend Block List 변환 (Recursive & Nested)
 */
export const tiptapToBackendBlocks = (json: JSONContent | null | undefined): Block[] => {
    if (!json || !json.content) return [];
    const blocks: Block[] = [];
    json.content.forEach(node => {
        const block = processNode(node);
        if (block) blocks.push(block);
    });
    return blocks;
};

const processNode = (node: JSONContent): Block | null => {
    if (!node.type) return null;

    // 1. Text Block (Paragraph, Heading)
    if (node.type === 'paragraph' || node.type === 'heading') {
        const level = node.attrs?.level;
        const tag = node.type === 'heading' && level ? `h${level}` : 'p';
        const spans: TextSpan[] = [];

        if (node.content) {
            node.content.forEach((inner) => {
                if (inner.type === 'text' && inner.text) {
                    const span: TextSpan = { text: inner.text };
                    if (inner.marks) {
                        inner.marks.forEach(mark => {
                            if (mark.type === 'bold') span.bold = true;
                            if (mark.type === 'italic') span.italic = true;
                            if (mark.type === 'strike') span.strikethrough = true;
                            if (mark.type === 'underline') span.underline = true;
                            if (mark.type === 'textStyle' && mark.attrs?.color) span.color = mark.attrs.color;
                            if (mark.type === 'highlight') span.backgroundColor = mark.attrs?.color || '#fde047';
                        });
                    }
                    spans.push(span);
                } else if (inner.type === 'hardBreak') {
                    spans.push({ text: "\n" });
                }
            });
        }

        return {
            type: 'text',
            tag: tag as any,
            align: node.attrs?.textAlign,
            spans: spans
        } as TextBlock;
    }

    // 2. Image Block
    if (node.type === 'image' && node.attrs?.src) {
        return {
            type: 'image',
            src: node.attrs.src,
            alt: node.attrs.alt || '',
            align: node.attrs?.textAlign
        } as ImageBlock;
    }

    // 3. List Container (Bullet / Ordered)
    if (node.type === 'bulletList' || node.type === 'orderedList') {
        const ordered = node.type === 'orderedList';
        const children: ListItemBlock[] = [];

        if (node.content) {
            node.content.forEach(child => {
                if (child.type === 'listItem') {
                    const listItemBlock = processNode(child); // This returns a ListItemBlock
                    if (listItemBlock && listItemBlock.type === 'listItem') {
                        children.push(listItemBlock as ListItemBlock);
                    }
                }
            });
        }

        return {
            type: 'list',
            ordered: ordered,
            children: children
        } as ListBlock;
    }

    // 4. List Item
    if (node.type === 'listItem') {
        const children: Block[] = [];
        if (node.content) {
            node.content.forEach(child => {
                const block = processNode(child);
                if (block) children.push(block);
            });
        }
        return {
            type: 'listItem',
            children: children
        } as ListItemBlock;
    }

    // 5. Blockquote - Treat as a wrapper or simple text block?
    // User requested "nested logic", so Blockquote should ideally be a Block that contains other blocks.
    // However, I didn't add BlockquoteBlock to types. Mapping to TextBlock with tag 'blockquote' implies plain text content.
    // Let's stick to TextBlock for now to minimize schema changes unless critical.
    if (node.type === 'blockquote') {
        // Flatten content for now as we don't have Blockquote definition
        const spans: TextSpan[] = [];
        if (node.content) {
            node.content.forEach(p => {
                if (p.type === 'paragraph' && p.content) { // p inside blockquote
                    p.content.forEach(inner => {
                        if (inner.text) spans.push({ text: inner.text });
                        if (inner.type === 'hardBreak') spans.push({ text: "\n" });
                    });
                    spans.push({ text: "\n" });
                }
            });
        }
        return {
            type: 'text',
            tag: 'blockquote',
            spans: spans
        } as TextBlock;
    }

    return null;
};

/**
 * Backend Block structure -> HTML string for Tiptap initial load
 */

/**
 * Backend Block structure -> HTML string for Tiptap initial load
 */
export const backendBlocksToHtml = (blocks: Block[]): string => {
    if (!blocks || blocks.length === 0) return '<p></p>';

    let html = '';
    let currentListType: 'bullet' | 'ordered' | null = null;

    blocks.forEach((block) => {
        // Handle Legacy List (TextBlock with listing prop)
        const isLegacyListBlock = block.type === 'text' && (block as TextBlock).listing;
        const legacyListType = isLegacyListBlock ? (block as TextBlock).listing : null;

        // 1. Close list if type changed or not a list anymore
        if (currentListType && currentListType !== legacyListType) {
            html += currentListType === 'bullet' ? '</ul>' : '</ol>';
            currentListType = null;
        }

        // 2. Open new list if needed
        if (legacyListType && currentListType !== legacyListType) {
            html += legacyListType === 'bullet' ? '<ul>' : '<ol>';
            currentListType = legacyListType;
        }

        // 3. Render Block
        if (isLegacyListBlock) {
            // Render as <li>
            html += `<li>${blockToHtmlContent(block)}</li>`;
        } else {
            // Normal Block
            html += blockToHtml(block);
        }
    });

    // Close remaining list
    if (currentListType) {
        html += currentListType === 'bullet' ? '</ul>' : '</ol>';
    }

    return html;
};

// Helper for inner content of a block (spans to html)
const blockToHtmlContent = (block: Block): string => {
    if (block.type === 'text') {
        const b = block as TextBlock;
        // Spans to HTML
        if (b.spans) {
            return b.spans.map(span => {
                let text = span.text || '';
                text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                text = text.replace(/\n/g, '<br>');

                let open = '', close = '';
                if (span.color) { open += `<span style="color: ${span.color}">`; close = `</span>` + close; }
                if (span.backgroundColor) { open += `<mark style="background-color: ${span.backgroundColor}">`; close = `</mark>` + close; }

                if (span.bold) { open += '<strong>'; close = '</strong>' + close; }
                if (span.italic) { open += '<em>'; close = '</em>' + close; }
                if (span.underline) { open += '<u>'; close = '</u>' + close; }
                if (span.strikethrough) { open += '<s>'; close = '</s>' + close; }

                return `${open}${text}${close}`;
            }).join('');
        }
        return '';
    }
    return '';
};


const blockToHtml = (block: Block): string => {
    if (!block) return '';

    // 1. Text Block
    if (block.type === 'text') {
        const b = block as TextBlock;
        const tag = b.tag || 'p';
        const alignStyle = b.align ? `text-align: ${b.align};` : '';
        const styleAttr = alignStyle ? ` style="${alignStyle}"` : '';

        const contentHtml = blockToHtmlContent(block) || '<br>';

        return `<${tag}${styleAttr}>${contentHtml}</${tag}>`;
    }

    // 2. Image Block
    if (block.type === 'image') {
        const b = block as ImageBlock;
        const style = b.align ? `style="text-align: ${b.align}"` : '';
        if (b.align) {
            return `<div ${style}><img src="${b.src}" alt="${b.alt || ''}"></div>`;
        }
        return `<img src="${b.src}" alt="${b.alt || ''}">`;
    }

    // 3. List Block
    if (block.type === 'list') {
        const b = block as ListBlock;
        const tag = b.ordered ? 'ol' : 'ul';
        const childrenHtml = b.children ? b.children.map(child => blockToHtml(child)).join('') : '';
        return `<${tag}>${childrenHtml}</${tag}>`;
    }

    // 4. List Item Block
    if (block.type === 'listItem') {
        const b = block as ListItemBlock;
        const childrenHtml = b.children ? b.children.map(child => blockToHtml(child)).join('') : '';
        return `<li>${childrenHtml}</li>`;
    }

    return '';
};