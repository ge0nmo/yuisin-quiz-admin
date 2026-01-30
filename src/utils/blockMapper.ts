import { JSONContent } from '@tiptap/react';
import { Block, TextSpan } from '@/src/types';

/**
 * Tiptap JSON -> Backend Block List 변환 (Rich Text Supported)
 * [수정] 문단(Paragraph) 처리 시 marks를 분석하여 spans로 변환
 */
export const tiptapToBackendBlocks = (json: JSONContent | null | undefined): Block[] => {
    const blocks: Block[] = [];

    if (!json || !json.content) return blocks;

    const processNode = (node: JSONContent, listType?: 'bullet' | 'ordered') => {
        // 1. 이미지 노드 처리
        if (node.type === 'image' && node.attrs?.src) {
            const cleanUrl = node.attrs.src.split('?')[0];
            blocks.push({
                type: 'image',
                src: cleanUrl,
                alt: node.attrs.alt || '',
                // images don't have spans
                align: node.attrs?.textAlign // 이미지 정렬 (extension 설정 필요)
            });
        }
        // 2. 리스트 컨테이너 (bulletList, orderedList)
        else if (node.type === 'bulletList' || node.type === 'orderedList') {
            const currentListType = node.type === 'bulletList' ? 'bullet' : 'ordered';
            if (node.content) {
                node.content.forEach(listItem => {
                    // listItem 안에는 보통 paragraph가 들어있음
                    if (listItem.content) {
                        listItem.content.forEach(child => processNode(child, currentListType));
                    }
                });
            }
        }
        // 3. 리스트 아이템 (listItem) - 위에서 처리되지만 혹시나 직접 올 경우
        else if (node.type === 'listItem') {
            if (node.content) {
                node.content.forEach(child => processNode(child, listType));
            }
        }
        // 4. 문단(paragraph) 또는 제목(heading) 처리
        else if (node.type === 'paragraph' || node.type === 'heading') {

            // 새 문단 시작 시, 직전 블록이 텍스트라면 줄바꿈 추가 (기존 로직 유지)
            // 단, 리스트 내부라면 줄바꿈보다는 별도 블록으로 나가는게 맞음.
            // 여기서는 리스트 처리가 들어왔으므로 "같은 리스트" 연속성은 backendBlocksToHtml에서 처리.
            // JSON 변환 시에는 최대한 block으로 쪼개서 저장.

            // 현재 문단을 처리할 temporary spans 배열
            const currentSpans: TextSpan[] = [];

            if (node.content) {
                node.content.forEach((inner) => {
                    // 2-1. 문단 내부 이미지 -> 텍스트 흐름을 끊고 이미지 블록 삽입
                    if (inner.type === 'image' && inner.attrs?.src) {
                        if (currentSpans.length > 0) {
                            // 앞쪽 텍스트 저장
                            appendToLastOrNewBlock(blocks, [...currentSpans], node.attrs?.textAlign, listType);
                            currentSpans.length = 0;
                        }
                        const cleanUrl = inner.attrs.src.split('?')[0];
                        blocks.push({
                            type: 'image',
                            src: cleanUrl,
                            alt: inner.attrs.alt || '',
                            align: inner.attrs?.textAlign
                        });
                    }
                    // 2-2. 텍스트 처리 (Marks 파싱)
                    else if (inner.type === 'text' && inner.text) {
                        const span: TextSpan = { text: inner.text };

                        if (inner.marks) {
                            inner.marks.forEach(mark => {
                                if (mark.type === 'bold') span.bold = true;
                                if (mark.type === 'italic') span.italic = true;
                                if (mark.type === 'strike') span.strikethrough = true;
                                if (mark.type === 'underline') span.underline = true;
                                if (mark.type === 'textStyle' && mark.attrs?.color) {
                                    span.color = mark.attrs.color;
                                }
                                if (mark.type === 'highlight' && mark.attrs?.color) {
                                    span.backgroundColor = mark.attrs.color;
                                }
                                // Tiptap's Highlight extension defaults to yellow if no color is specified, but usually adds a class or style.
                                // If the mark exists but no color attribute, we might want a default.
                                // However, in our configured extension we allowed multicolor. 
                                // Ideally we check mark.attrs.color. If undefined, it might be the default yellow.
                                if (mark.type === 'highlight' && !mark.attrs?.color) {
                                    span.backgroundColor = '#fde047'; // tailwind yellow-300 or similar default
                                }
                            });
                        }
                        currentSpans.push(span);
                    }
                    // 2-3. HardBreak (Shift+Enter)
                    else if (inner.type === 'hardBreak') {
                        currentSpans.push({ text: "\n" });
                    }
                });
            }

            // 문단 처리가 끝났는데 모아둔 span이 있다면 블록에 추가
            if (currentSpans.length > 0) {
                appendToLastOrNewBlock(blocks, currentSpans, node.attrs?.textAlign, listType);
            } else {
                // 빈 문단 처리
            }
        }
    };

    json.content.forEach(node => processNode(node));

    return blocks;
};

// Helper: 블록 리스트 관리
const appendToLastOrNewBlock = (
    blocks: Block[],
    newSpans: TextSpan[],
    align?: string,
    listing?: 'bullet' | 'ordered'
) => {
    // 리스트 아이템이거나 정렬이 있거나 이미지가 끼어든 경우 등 -> 무조건 새 블록 생성하는게 속편함.
    // 기존 로직: 텍스트 합치기.
    // [변경] 리스트나 정렬 속성이 있다면 합치지 말고 분리해야 함.
    // 또한 일반 텍스트라도 Block 단위로 관리하는게 Tiptap과 1:1 매핑에 유리할 수 있음.
    // 하지만 "줄바꿈" 이슈 때문에 합쳤었음.
    // 여기서는 "같은 속성(align, listing)"일때만 합치도록 개선하거나,
    // 일단 간단히 "새 블록 생성" 전략으로 변경? 
    // -> 아니면 기존 유지하되 리스트/정렬이 없으면 합치기.

    if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];

        // *조건부 병합*: 
        // 1. 둘 다 텍스트여야 함
        // 2. 둘 다 리스트가 아니어야 함 (리스트 아이템은 각각 블록이어야 html 생성 시 li로 분리됨)
        // 3. 둘 다 정렬이 없거나 같아야 함
        const isList = !!listing || !!lastBlock.listing;
        const isAlignDifferent = align !== lastBlock.align;

        if (lastBlock.type === 'text' && !isList && !isAlignDifferent) {
            if (!lastBlock.spans) lastBlock.spans = [];
            // 줄바꿈 추가 (문단 구분)
            lastBlock.spans.push({ text: "\n" });
            lastBlock.spans.push(...newSpans);
            return;
        }
    }

    // Create new block
    blocks.push({
        type: 'text',
        spans: newSpans,
        align: align as any,
        listing: listing
    });
};


// ... backendBlocksToHtml 수정 ...
export const backendBlocksToHtml = (blocks: Block[]): string => {
    if (!blocks || blocks.length === 0) return '<p></p>';

    let html = '';
    let currentListType: 'bullet' | 'ordered' | null = null;

    blocks.forEach((b, index) => {
        // 리스트 처리: 블록의 listing 속성을 보고 ul/ol 열기/닫기
        const blockListing = b.listing || null;

        // 리스트 타입이 바뀌거나 끝났으면 닫기
        if (currentListType && currentListType !== blockListing) {
            html += currentListType === 'bullet' ? '</ul>' : '</ol>';
            currentListType = null;
        }

        // 새 리스트 시작
        if (blockListing && currentListType !== blockListing) {
            html += blockListing === 'bullet' ? '<ul>' : '<ol>';
            currentListType = blockListing;
        }

        // 내용 렌더링
        let innerHtml = '';
        if (b.type === 'image') {
            // 이미지의 경우 정렬 처리
            const style = b.align ? `style="text-align: ${b.align}; display: block;"` : '';
            // Tiptap image extension uses just img tag usually, or div wrapper for alignment.
            // wrapper for alignment:
            if (b.align) {
                innerHtml = `<div style="text-align: ${b.align}"><img src="${b.src}" alt="${b.alt || ''}"></div>`;
            } else {
                innerHtml = `<img src="${b.src}" alt="${b.alt || ''}">`;
            }
        }
        else if (b.type === 'text') {
            const spans = b.spans || (b.text ? [{ text: b.text }] : []);
            // align style
            let pStyle = '';
            if (b.align) pStyle += `text-align: ${b.align};`;
            const styleAttr = pStyle ? ` style="${pStyle}"` : '';

            let spansHtml = '';
            spans.forEach(span => {
                let text = span.text || '';
                // Escape
                text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                // Newline to br
                text = text.replace(/\n/g, '<br>');

                // Styles
                let sStyle = '';
                if (span.color) sStyle += `color: ${span.color};`;

                let open = '';
                let close = '';

                if (span.backgroundColor) {
                    open += `<mark style="background-color: ${span.backgroundColor}">`;
                    close = `</mark>` + close;
                }

                if (sStyle) { open += `<span style="${sStyle}">`; close = `</span>` + close; }
                if (span.bold) { open += '<strong>'; close = '</strong>' + close; }
                if (span.italic) { open += '<em>'; close = '</em>' + close; }
                if (span.underline) { open += '<u>'; close = '</u>' + close; }
                if (span.strikethrough) { open += '<s>'; close = '</s>' + close; }

                spansHtml += `${open}${text}${close}`;
            });

            if (blockListing) {
                innerHtml = `<li${styleAttr}>${spansHtml}</li>`; // 리스트 아이템은 p 대신 li (Tiptap이 p를 안에 넣기도 하지만 li로 충분)
                // 정확히는 Tiptap: <ul><li><p>content</p></li></ul> 구조를 선호함.
                // 하지만 <li>content</li>로 줘도 Tiptap이 잘 파싱함.
                // 정렬이 있다면 <li>에 style을 주거나 내부에 <p>를 둬야 함.
                if (pStyle) {
                    innerHtml = `<li><p style="${pStyle}">${spansHtml}</p></li>`;
                } else {
                    innerHtml = `<li>${spansHtml}</li>`;
                }
            } else {
                innerHtml = `<p${styleAttr}>${spansHtml}</p>`;
            }
        }

        html += innerHtml;
    });

    // 마지막에 리스트가 열려있다면 닫기
    if (currentListType) {
        html += currentListType === 'bullet' ? '</ul>' : '</ol>';
    }

    return html;
};