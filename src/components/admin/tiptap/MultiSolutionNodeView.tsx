import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react'

export default function MultiSolutionNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { question, solutions } = node.attrs

  const updateQuestion = (q: string) => {
    updateAttributes({ question: q })
  }

  const addSolution = () => {
    const newSolution = {
      id: Date.now().toString(),
      author_type: 'Official',
      content: ''
    }
    updateAttributes({ solutions: [...solutions, newSolution] })
  }

  const updateSolutionContent = (id: string, newContent: string) => {
    const updated = solutions.map((s: any) => s.id === id ? { ...s, content: newContent } : s)
    updateAttributes({ solutions: updated })
  }

  const updateSolutionAuthor = (id: string, newAuthor: string) => {
    const updated = solutions.map((s: any) => s.id === id ? { ...s, author_type: newAuthor } : s)
    updateAttributes({ solutions: updated })
  }

  const removeSolution = (id: string) => {
    updateAttributes({ solutions: solutions.filter((s: any) => s.id !== id) })
  }

  return (
    <NodeViewWrapper className="my-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm" contentEditable={false}>
        {/* Header */}
        <div className="bg-zinc-950/50 px-4 py-3 border-b border-zinc-800 flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div 
              className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-1 rounded transition-colors" 
              data-drag-handle
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Multi-Solution Block
            </h3>
          </div>
          <button
            type="button"
            onClick={deleteNode}
            className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete Block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Main Question */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Question Context
            </label>
            <textarea
              value={question}
              onChange={(e) => updateQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              placeholder="e.g. Write a python script to reverse a string..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder-zinc-600 min-h-[80px] resize-y"
            />
          </div>

          {/* Solutions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Solutions ({solutions.length})
              </label>
              <button
                type="button"
                onClick={addSolution}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Solution
              </button>
            </div>

            {solutions.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                No solutions added yet. Click "+ Add Solution" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {solutions.map((sol: any, index: number) => (
                  <div key={sol.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden relative group">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeSolution(sol.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Remove Solution"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <select
                          value={sol.author_type}
                          onChange={(e) => updateSolutionAuthor(sol.id, e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                        >
                          <option value="Official">Official Solution</option>
                          <option value="Community">Community Solution</option>
                          <option value="Alternative">Alternative Approach</option>
                        </select>
                      </div>

                      <textarea
                        value={sol.content}
                        onChange={(e) => updateSolutionContent(sol.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                          }
                        }}
                        placeholder="Enter the solution content (HTML/Text)..."
                        className="w-full bg-transparent border-0 text-zinc-200 text-sm focus:outline-none focus:ring-0 p-0 min-h-[100px] resize-y placeholder-zinc-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
