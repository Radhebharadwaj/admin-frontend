import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Trash2, ExternalLink } from 'lucide-react'

export default function CustomYoutubeNodeView({ node, deleteNode }: NodeViewProps) {
  const { src } = node.attrs

  return (
    <NodeViewWrapper className="group relative my-4">
      {!src ? (
        <div className="w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
          YouTube URL missing
        </div>
      ) : (
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 pointer-events-auto">
          <iframe
            src={src}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
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
          onClick={deleteNode}
          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          title="Delete Video"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}
