import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Trash2, ExternalLink, ImageOff } from 'lucide-react'
import { useState } from 'react'

export default function CustomImageNodeView({ node, deleteNode }: NodeViewProps) {
  const { src, alt } = node.attrs
  const [hasError, setHasError] = useState(false)

  return (
    <NodeViewWrapper className="group relative my-4">
      {!src || hasError ? (
        <div className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 gap-2">
          <ImageOff className="w-8 h-8 text-zinc-600" />
          <span className="text-sm">{!src ? "Media URL missing" : "Broken Image / Not Found"}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt || ''}
          onError={() => setHasError(true)}
          className="w-full rounded-xl border border-zinc-800 object-contain max-h-[500px]"
        />
      )}
      <div
        className="absolute top-2 right-2 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity bg-zinc-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-zinc-700/50"
        contentEditable={false}
      >
        <button
          type="button"
          onClick={() => window.open(src, '_blank')}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={deleteNode}
          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          title="Delete Image"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}
