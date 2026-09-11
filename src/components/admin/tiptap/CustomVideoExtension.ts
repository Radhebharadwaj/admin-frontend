import { Node, mergeAttributes } from '@tiptap/core'

export const CustomVideoExtension = Node.create({
  name: 'customVideo',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes({ controls: true, class: 'w-full aspect-video rounded-lg overflow-hidden border border-zinc-800 my-4' }, HTMLAttributes)]
  },
  
  addCommands() {
    return {
      setCustomVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
