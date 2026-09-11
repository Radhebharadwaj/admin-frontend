import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Lightbulb } from 'lucide-react'

export default function CalloutNodeView() {
  return (
    <NodeViewWrapper className="flex gap-4 p-4 my-4 bg-zinc-800/50 border-l-4 border-emerald-500 rounded-r-lg text-zinc-200">
      <div className="flex-shrink-0 mt-0.5 text-emerald-500" contentEditable={false}>
        <Lightbulb className="w-5 h-5" />
      </div>
      <NodeViewContent className="flex-1" />
    </NodeViewWrapper>
  )
}
