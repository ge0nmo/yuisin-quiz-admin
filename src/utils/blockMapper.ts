import { JSONContent } from '@tiptap/react';
import { Block } from '@/src/types';

/**
 * Tiptap JSON -> Backend Block List 변환 (Deep Parsing)
 * 문단 내부에 텍스트와 이미지가 섞여 있어도 순서대로 분리합니다.
 */
export const tiptapToBackendBlocks = (json: JSONContent | null | undefined): Block[] => {
    const blocks: Block[] = [];

    if (!json || !json.content) return blocks;

    json.content.forEach((node) => {
        // 1. 이미지 노드 처리
        if (node.type === 'image' && node.attrs?.src) {
            // [핵심 수정] URL에서 ? 뒤에 있는 서명(Signature) 제거
            // 예: image.png?signature=abc -> image.png
            const cleanUrl = node.attrs.src.split('?')[0];

            blocks.push({
                type: 'image',
                src: cleanUrl, // 깨끗한 URL만 DB에 저장
                alt: node.attrs.alt || '',
            });
        }
        else if (node.type === 'paragraph' || node.type === 'heading') {
            if (node.content) {
                node.content.forEach((inner) => {
                    if (inner.type === 'image' && inner.attrs?.src) {
                        // [핵심 수정] 문단 내부 이미지도 동일하게 처리
                        const cleanUrl = inner.attrs.src.split('?')[0];

                        blocks.push({
                            type: 'image',
                            src: cleanUrl,
                            alt: inner.attrs.alt || '',
                        });
                    }
                    else if (inner.type === 'text' && inner.text) {
                        // 텍스트 병합 로직 (기존 유지)
                        const lastBlock = blocks[blocks.length - 1];
                        if (lastBlock && lastBlock.type === 'text') {
                            lastBlock.text += inner.text;
                        } else {
                            blocks.push({ type: 'text', text: inner.text });
                        }
                    }
                });
            }
        }
    });

    return blocks;
};

/**
 * Backend Block List -> Tiptap HTML String
 * (기존 코드 유지)
 */
export const backendBlocksToHtml = (blocks: Block[]): string => {
    if (!blocks || blocks.length === 0) return '<p></p>';

    return blocks
        .map((b) => {
            if (b.type === 'image') {
                return `<img src="${b.src}" alt="${b.alt || ''}">`;
            }
            if (b.type === 'text') {
                return `<p>${b.text}</p>`;
            }
            return '';
        })
        .join('');
};