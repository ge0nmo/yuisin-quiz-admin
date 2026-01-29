import { JSONContent } from '@tiptap/react';
import { Block } from '@/src/types';

/**
 * Tiptap JSON -> Backend Block List 변환 (Deep Parsing)
 * [수정] 문단(Paragraph)이 바뀔 때마다 자동으로 줄바꿈(\n)을 추가합니다.
 */
export const tiptapToBackendBlocks = (json: JSONContent | null | undefined): Block[] => {
    const blocks: Block[] = [];

    if (!json || !json.content) return blocks;

    json.content.forEach((node, nodeIndex) => {
        // 1. 이미지 노드 처리 (기존 동일)
        if (node.type === 'image' && node.attrs?.src) {
            const cleanUrl = node.attrs.src.split('?')[0];
            blocks.push({
                type: 'image',
                src: cleanUrl,
                alt: node.attrs.alt || '',
            });
        }
        // 2. 문단(paragraph) 또는 제목(heading) 처리
        else if (node.type === 'paragraph' || node.type === 'heading') {

            // ▼▼▼ [핵심 수정] 문단 시작 시, 직전 블록이 텍스트라면 줄바꿈(\n) 추가 ▼▼▼
            // 첫 번째 문단이 아니고, 직전 블록이 텍스트라면 -> 이어쓰지 말고 줄을 바꿈
            if (blocks.length > 0) {
                const lastBlock = blocks[blocks.length - 1];
                if (lastBlock.type === 'text') {
                    // 예: "1문단" + "\n" -> "2문단 시작"
                    lastBlock.text += "\n";
                }
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            if (node.content) {
                node.content.forEach((inner) => {
                    // 2-1. 문단 내부 이미지 (기존 동일)
                    if (inner.type === 'image' && inner.attrs?.src) {
                        const cleanUrl = inner.attrs.src.split('?')[0];
                        blocks.push({
                            type: 'image',
                            src: cleanUrl,
                            alt: inner.attrs.alt || '',
                        });
                    }
                    // 2-2. 텍스트 처리
                    else if (inner.type === 'text' && inner.text) {
                        const lastBlock = blocks[blocks.length - 1];
                        // 직전 블록이 텍스트면 합침 (위에서 넣은 \n 뒤에 붙음)
                        if (lastBlock && lastBlock.type === 'text') {
                            lastBlock.text += inner.text;
                        } else {
                            blocks.push({ type: 'text', text: inner.text });
                        }
                    }
                    // 2-3. [추가] Shift+Enter (HardBreak) 처리
                    else if (inner.type === 'hardBreak') {
                        const lastBlock = blocks[blocks.length - 1];
                        if (lastBlock && lastBlock.type === 'text') {
                            lastBlock.text += "\n";
                        }
                    }
                });
            }
        }
    });

    return blocks;
};

// ... backendBlocksToHtml 기존 코드 유지 ...
export const backendBlocksToHtml = (blocks: Block[]): string => {
    if (!blocks || blocks.length === 0) return '<p></p>';

    let html = '';
    let textBuffer = '';

    blocks.forEach((b) => {
        if (b.type === 'text' && b.text) {
            textBuffer += b.text;
        } else {
            if (textBuffer) {
                // 줄바꿈(\n)을 <br>로 변환하지 않아도 whitespace-pre-wrap 덕분에 보이지만,
                // 에디터 로딩 시 정확한 줄바꿈을 위해 replace 처리
                html += `<p>${textBuffer.replace(/\n/g, '<br>')}</p>`;
                textBuffer = '';
            }
            if (b.type === 'image') {
                html += `<img src="${b.src}" alt="${b.alt || ''}">`;
            }
        }
    });

    if (textBuffer) {
        html += `<p>${textBuffer.replace(/\n/g, '<br>')}</p>`;
    }

    return html;
};