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
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Maximize, Minimize, Video, FileUp, Palette, Table as TableIcon, LayoutTemplate, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { MultiSolutionExtension } from './tiptap/MultiSolutionExtension'
import { CalloutExtension } from './tiptap/CalloutExtension'
import { CustomVideoExtension } from './tiptap/CustomVideoExtension'
import Image from '@tiptap/extension-image'
import Dropcursor from '@tiptap/extension-dropcursor'
import { Markdown } from 'tiptap-markdown'

// Mock upload function (to be wired to API later)
const uploadMediaToR2 = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    toast.loading('Uploading media...', { id: 'media-upload' })
    setTimeout(() => {
      toast.success('Media uploaded!', { id: 'media-upload' })
      resolve(URL.createObjectURL(file))
    }, 1500)
  })
}

interface TiptapEditorProps {
  value: any
  onChange: (value: any) => void
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Track value changes externally (e.g., loading data)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  let parsedContent = value;
  if (typeof value === 'string' && value.startsWith('{')) {
    try { parsedContent = JSON.parse(value); } 
    catch (e) { console.error("Tiptap Parse Error"); }
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      MultiSolutionExtension,
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
      CalloutExtension,
      CustomVideoExtension,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'rounded-xl border border-zinc-800 my-4 max-w-full',
        },
      }),
      Dropcursor.configure({
        color: '#10b981', // emerald-500
        width: 3,
      }),
      Markdown.configure({
        html: true, 
        transformPastedText: true,
      }),
    ],
    content: parsedContent,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] h-full p-4 text-sm text-zinc-300',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            event.preventDefault();
            uploadMediaToR2(file).then((url) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                const node = file.type.startsWith('image/') 
                  ? schema.nodes.image.create({ src: url }) 
                  : schema.nodes.customVideo.create({ src: url });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            event.preventDefault();
            uploadMediaToR2(file).then((url) => {
              const { schema } = view.state;
              const node = file.type.startsWith('image/') 
                ? schema.nodes.image.create({ src: url }) 
                : schema.nodes.customVideo.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            });
            return true;
          }
        }
        
        // Custom paste interceptor for ```solution blocks
        const text = event.clipboardData?.getData('text/plain');
        if (text && text.trim().startsWith('```solution') && text.trim().endsWith('```')) {
          event.preventDefault();
          const contentMatch = text.match(/```solution\n([\s\S]*?)```/);
          const solutionContent = contentMatch ? contentMatch[1].trim() : '';
          
          const { schema } = view.state;
          const node = schema.nodes.multiSolutionBlock.create({
            question: "Pasted Solution",
            solutions: [{ id: Date.now().toString(), author_type: "Official", content: solutionContent }]
          });
          const transaction = view.state.tr.replaceSelectionWith(node);
          view.dispatch(transaction);
          return true;
        }
        
        return false;
      },
    },
  })

  useEffect(() => {
    if (editor && value) {
      let parsed = value;
      if (typeof value === 'string' && value.startsWith('{')) {
        try { parsed = JSON.parse(value); } 
        catch (e) { console.error("Tiptap Parse Error"); }
      }
      
      // Only set content if editor is empty, typical during hydration of edit form
      if (editor.isEmpty) {
        editor.commands.setContent(parsed);
      }
    }
  }, [editor, value])

  if (!mounted || !editor) {
    return null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isMarkdownOrText = file.name.endsWith('.md') || file.name.endsWith('.txt')
    const isJson = file.name.endsWith('.json')

    if (!isMarkdownOrText && !isJson) {
      toast.error('Invalid File Type: Please upload only Markdown (.md/.txt) or JSON (.json) files.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (isJson) {
        try {
          const jsonContent = JSON.parse(text)
          editor.commands.setContent(jsonContent)
          toast.success('JSON imported successfully')
        } catch (err) {
          toast.error('Invalid JSON file format')
        }
      } else {
        // For Markdown, tiptap-markdown parses natively if we setContent with Markdown format, 
        // but since we want to be safe, we can use marked for standard HTML rendering, or just feed it directly.
        // tiptap-markdown intercepts setContent if we pass raw markdown string (depending on config).
        // It's safer to use editor.commands.setContent(text) since we have Markdown extension installed.
        editor.commands.setContent(text)
        toast.success('Markdown imported successfully')
      }
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
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-1">
          <input
            type="file"
            accept=".md,.txt,.json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 mr-2"
            title="Import File (.md, .json)"
          >
            <FileUp className="w-3.5 h-3.5" />
            Import File
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
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

          {/* Multi-Solution Block */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertContent({ type: 'multiSolutionBlock' }).run()}
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg transition-colors text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            title="Add Multi-Solution Block"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            + Solution Block
          </button>

          {/* Callout Block */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertContent({ type: 'calloutBlock' }).run()}
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg transition-colors text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
            title="Add Callout/Summary"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Callout
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

        <div className="flex items-center gap-2">
          {isFullScreen && (
            <button
              type="button"
              onClick={toggleFullScreen}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
            >
              Done Editing
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullScreen}
            className={`p-2 rounded-lg transition-colors ${isFullScreen ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
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
