import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CustomImageNodeView from './CustomImageNodeView'

export const CustomImageExtension = Image.extend({
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      alt: { default: null },
      title: { default: null },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageNodeView)
  },
})
