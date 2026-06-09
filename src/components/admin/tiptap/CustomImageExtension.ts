import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CustomImageNodeView from './CustomImageNodeView'

export const CustomImageExtension = Image.extend({
  selectable: true,
  draggable: true,

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageNodeView)
  },
})
