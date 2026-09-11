import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CustomImageNodeView from './CustomImageNodeView'

export const CustomImageExtension = Image.extend({
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageNodeView)
  },
})
