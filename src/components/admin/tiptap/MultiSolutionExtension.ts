import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MultiSolutionNodeView from './MultiSolutionNodeView'

export const MultiSolutionExtension = Node.create({
  name: 'multiSolutionBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      question: {
        default: '',
        parseHTML: element => element.getAttribute('data-question'),
        renderHTML: attributes => {
          return {
            'data-question': attributes.question,
          }
        },
      },
      solutions: {
        default: [],
        parseHTML: element => {
          const parsed = element.getAttribute('data-solutions');
          return parsed ? JSON.parse(parsed) : [];
        },
        renderHTML: attributes => {
          return {
            'data-solutions': JSON.stringify(attributes.solutions),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'multi-solution-block',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['multi-solution-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MultiSolutionNodeView)
  },
})
