// src/components/ui/BlockRenderer.tsx
import { Block } from "@/src/types";

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
    if (!blocks || blocks.length === 0) return null;

    return (
        <div className="space-y-2">
            {blocks.map((block, index) => {
                if (block.type === 'image' && block.src) {
                    //
                    return (
                        <div key={index} className="my-2">
                            <img
                                src={block.src}
                                alt={block.alt || "problem-image"}
                                className="max-w-full h-auto rounded-md border border-gray-100"
                            />
                        </div>
                    );
                }
                if (block.type === 'text' && block.text) {
                    // 텍스트는 whitespace-pre-wrap으로 줄바꿈 표현
                    return (
                        <p key={index} className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {block.text}
                        </p>
                    );
                }
                return null;
            })}
        </div>
    );
}