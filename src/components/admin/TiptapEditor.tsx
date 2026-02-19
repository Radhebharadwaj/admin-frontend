"use client"

import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Youtube from '@tiptap/extension-youtube'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { marked } from 'marked'
import toast from 'react-hot-toast'
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Maximize, Minimize, Video, FileUp, Palette, Table as TableIcon } from 'lucide-react'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Track value changes externally (e.g., loading data)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your module here...',
        emptyEditorClass: 'is-editor-empty',
      }),
      TextStyle,
      Color,
      Youtube.configure({
        inline: false,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg overflow-hidden border border-zinc-800 my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full border-collapse table-auto my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-zinc-700 bg-zinc-800/50 p-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-zinc-700 p-2',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] h-full p-4 text-sm text-zinc-300',
      },
    },
  })

  if (!mounted || !editor) {
    return null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isMarkdownOrText = file.name.endsWith('.md') || file.name.endsWith('.txt')
    if (!isMarkdownOrText) {
      toast.error('Invalid File Type: Please upload only Markdown (.md) or Text (.txt) files for the module.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      // parse markdown
      const html = await marked.parse(text)
      editor.commands.setContent(html)
    }
    reader.readAsText(file)
    // reset input
    e.target.value = ''
  }

  const addVideo = () => {
    if (videoUrl) {
      editor.commands.setYoutubeVideo({ src: videoUrl })
      setVideoUrl('')
      setShowVideoModal(false)
    }
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
    // Lock body scroll when full screen
    if (!isFullScreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  return (
    <div className={
      isFullScreen 
        ? "fixed inset-0 z-[9999] bg-zinc-950 w-full h-full flex flex-col p-4 md:p-10"
        : "border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 flex flex-col"
    }>
      {/* Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          
          {/* Table */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-2 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {/* Color Picker */}
          <div className="relative flex items-center p-1 rounded-lg hover:bg-zinc-800 cursor-pointer" title="Text Color">
            <Palette className="w-4 h-4 text-zinc-400 pointer-events-none absolute left-2" />
            <input
              type="color"
              onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
              value={editor.getAttributes('textStyle').color || '#ffffff'}
              className="w-6 h-6 opacity-0 cursor-pointer ml-4"
              title="Text Color"
            />
          </div>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* YouTube Video */}
          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="p-2 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Embed Video"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Markdown Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Import Markdown (.md)"
          >
            <FileUp className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            accept="*/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </div>

        <div>
          <button
            type="button"
            onClick={toggleFullScreen}
            className={`p-2 rounded-lg transition-colors ${isFullScreen ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className={`flex-1 overflow-y-auto ${isFullScreen ? 'max-w-4xl mx-auto w-full bg-zinc-950 mt-4 rounded-xl border border-zinc-800/50 shadow-2xl' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Embed YouTube Video</h3>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white placeholder:text-zinc-500 outline-none focus:border-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={addVideo}
                className="px-4 py-2 rounded-lg font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                Embed Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles without styled-jsx to avoid Next.js warnings */}
      <style dangerouslySetInnerHTML={{ __html: `
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #52525b;
          pointer-events: none;
          height: 0;
        }
        .prose h1, .prose h2 {
          color: white;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .prose h1 { font-size: 1.5em; }
        .prose h2 { font-size: 1.25em; }
        .prose p { margin-bottom: 1em; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        /* Tiptap Table Styles */
        .prose table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .prose table td,
        .prose table th {
          min-width: 1em;
          border: 1px solid #3f3f46;
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .prose table th {
          font-weight: bold;
          text-align: left;
          background-color: #27272a;
        }
        .prose table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #6366f1;
          pointer-events: none;
        }
      `}} />
    </div>
  )
}
