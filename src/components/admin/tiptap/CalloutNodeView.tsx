import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react'
import { Lightbulb, Trash2 } from 'lucide-react'

export default function CalloutNodeView({ deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="group relative flex gap-4 p-4 my-4 bg-zinc-800/50 border-l-4 border-emerald-500 rounded-r-lg text-zinc-200">
      <div className="flex-shrink-0 mt-0.5 text-emerald-500" contentEditable={false}>
        <Lightbulb className="w-5 h-5" />
      </div>
      <NodeViewContent className="flex-1" />
      <button 
        type="button"
        onClick={deleteNode}
        className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete Callout"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </NodeViewWrapper>
  )
}
