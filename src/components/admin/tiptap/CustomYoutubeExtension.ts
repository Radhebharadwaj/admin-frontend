import Youtube from '@tiptap/extension-youtube'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CustomYoutubeNodeView from './CustomYoutubeNodeView'

export const CustomYoutubeExtension = Youtube.extend({
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomYoutubeNodeView)
  },
})
