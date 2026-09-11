import Youtube from '@tiptap/extension-youtube'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CustomYoutubeNodeView from './CustomYoutubeNodeView'

export const CustomYoutubeExtension = Youtube.extend({
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomYoutubeNodeView)
  },
})
