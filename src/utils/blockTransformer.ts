import { JSONContent } from '@tiptap/react';
import { Block, TextBlock, ImageBlock, ListBlock, ListItemBlock, TextSpan } from '@/src/types';

/**
 * Tiptap JSON -> Backend Block List 변환
 * [설계 의도] 저장 시점에 데이터를 정규화하여 렌더링 시의 모호함을 없앱니다.
 */
export const tiptapToBackendBlocks = (json: JSONContent | null | undefined): Block[] => {
    if (!json || !json.content) return [];

    const blocks: Block[] = [];
    json.content.forEach(node => {
        const block = processNode(node);
        if (block) {
            // [정규화] 빈 텍스트 블록 처리 정책
            // 내용이 없는 문단은 저장하지 않거나, 의도된 줄바꿈인지 확인해야 합니다.
            // 여기서는 완전히 비어있는 텍스트 블록은 제외하되,
            // 명시적인 줄바꿈(br)은 TextSpan에 포함되므로 유지됩니다.
            if (block.type === 'text') {
                const tb = block as TextBlock;
                const hasContent = tb.spans && tb.spans.length > 0 && tb.spans.some(s => s.text.trim() !== '');
                // 내용이 없더라도 사용자가 강제로 줄을 띄우고 싶어하는 경우(hardBreak)는 spans에 '\n'이 들어있음.
                // 완전히 빈 껍데기만 필터링.
                if (!hasContent && (!tb.spans || tb.spans.length === 0)) {
                    return;
                }
            }
            blocks.push(block);
        }
    });
    return blocks;
};

// 재귀적 노드 처리
const processNode = (node: JSONContent): Block | null => {
    if (!node.type) return null;

    // 1. Text Block
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
                    // [중요] Tiptap의 Shift+Enter는 여기서 \n으로 변환됨.
                    spans.push({ text: "\n" });
                }
            });
        }

        // [UX 개선] 빈 문단(Enter만 침)일 경우, 시각적으로 자연스러운 높이를 유지하기 위해
        // 빈 span 하나를 넣어주는 것이 렌더러 입장에서 처리가 쉬움.
        if (spans.length === 0) {
            // spans.push({ text: " " }); // 공백을 넣어 높이 유지 (선택사항)
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

    // 3. Lists (Recursive)
    if (node.type === 'bulletList' || node.type === 'orderedList') {
        const ordered = node.type === 'orderedList';
        const children: ListItemBlock[] = [];

        if (node.content) {
            node.content.forEach(child => {
                if (child.type === 'listItem') {
                    const itemBlock = processNode(child);
                    if (itemBlock && itemBlock.type === 'listItem') {
                        children.push(itemBlock as ListItemBlock);
                    }
                }
            });
        }
        return { type: 'list', ordered, children } as ListBlock;
    }

    // 4. List Item
    if (node.type === 'listItem') {
        const children: Block[] = [];
        if (node.content) {
            node.content.forEach(child => {
                const b = processNode(child);
                if (b) children.push(b);
            });
        }
        return { type: 'listItem', children } as ListItemBlock;
    }

    return null;
};

/**
 * Backend Blocks -> HTML String (for Tiptap Initial Load)
 * [보안] XSS 방지를 위해 텍스트 이스케이프 처리가 필요합니다.
 */
export const backendBlocksToHtml = (blocks: Block[]): string => {
    if (!blocks || blocks.length === 0) return '<p></p>';

    // [레거시 호환] DB에 저장된 옛날 리스트 포맷을 처리하기 위해 그룹핑 로직이 필요할 수 있으나,
    // Tiptap으로 로드할 때는 HTML 태그 구조만 맞추면 Tiptap이 알아서 파싱합니다.
    return blocks.map(block => blockToHtml(block)).join('');
};

const escapeHtml = (text: string) => {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const blockToHtml = (block: Block): string => {
    if (!block) return '';

    if (block.type === 'text') {
        const b = block as TextBlock;
        const tag = b.tag || 'p';
        const alignStyle = b.align ? ` style="text-align: ${b.align}"` : '';

        // Spans to HTML string
        const content = b.spans?.map(span => {
            let text = escapeHtml(span.text);
            // [중요] \n은 <br>로 변환하여 Tiptap이 hardBreak로 인식하게 함
            text = text.replace(/\n/g, '<br>');

            let style = '';
            if (span.color) style += `color: ${span.color};`;
            if (span.backgroundColor) style += `background-color: ${span.backgroundColor};`;

            let wrapped = text;
            if (style) wrapped = `<span style="${style}">${wrapped}</span>`;
            if (span.bold) wrapped = `<strong>${wrapped}</strong>`;
            if (span.italic) wrapped = `<em>${wrapped}</em>`;
            if (span.underline) wrapped = `<u>${wrapped}</u>`;
            if (span.strikethrough) wrapped = `<s>${wrapped}</s>`;
            return wrapped;
        }).join('') || ''; // 빈 문단일 경우 내용 없음

        return `<${tag}${alignStyle}>${content}</${tag}>`;
    }

    if (block.type === 'image') {
        const b = block as ImageBlock;
        const alignStyle = b.align ? ` style="text-align: ${b.align}"` : '';
        // HTML 생성 시에는 단순히 img 태그만 제공하면 Tiptap이 처리함
        return `<div${alignStyle}><img src="${b.src}" alt="${b.alt || ''}"></div>`;
    }

    if (block.type === 'list') {
        const b = block as ListBlock;
        const tag = b.ordered ? 'ol' : 'ul';
        const children = b.children.map(c => blockToHtml(c)).join('');
        return `<${tag}>${children}</${tag}>`;
    }

    if (block.type === 'listItem') {
        const b = block as ListItemBlock;
        const children = b.children.map(c => blockToHtml(c)).join('');
        return `<li>${children}</li>`;
    }

    return '';
};