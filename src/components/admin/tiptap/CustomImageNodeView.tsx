import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Trash2, ExternalLink, ImageOff } from 'lucide-react'
import { useState } from 'react'

export default function CustomImageNodeView(props: NodeViewProps) {
  const src = props.node.attrs.src
  const alt = props.node.attrs.alt
  const [hasError, setHasError] = useState(false)

  console.log('[CustomImageNodeView] src:', src, '| all attrs:', props.node.attrs)

  return (
    <NodeViewWrapper className="group relative my-4">
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || 'Uploaded resource'}
          onError={() => {
            console.error('[CustomImageNodeView] Image failed to load:', src)
            setHasError(true)
          }}
          className="w-full rounded-xl border border-zinc-800 object-contain max-h-[500px]"
        />
      ) : (
        <div className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 gap-2">
          <ImageOff className="w-8 h-8 text-zinc-600" />
          <span className="text-sm">{!src ? 'Image URL missing' : 'Broken Image / Not Found'}</span>
          {src && <span className="text-xs text-zinc-600 max-w-md truncate px-4">{src}</span>}
        </div>
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
          onClick={props.deleteNode}
          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          title="Delete Image"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}
