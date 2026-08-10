import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CalloutNodeView from './CalloutNodeView'

export const CalloutExtension = Node.create({
  name: 'calloutBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'callout-block',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['callout-block', mergeAttributes(HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
