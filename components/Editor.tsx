'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect } from 'react'

interface Props {
  content: string
  onChange: (text: string) => void
  placeholder?: string
}

export default function Editor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Mulai menulis di sini… atau tempel teks yang ingin direvisi.',
      }),
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-ink max-w-none focus:outline-none px-8 py-6 min-h-full text-base leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText())
    },
  })

  // Sync external content changes (e.g. when user clicks "Terapkan")
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(`<p>${content}</p>`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const wordCount = editor
    ? editor.getText().trim().split(/\s+/).filter(Boolean).length
    : 0
  const charCount = editor?.storage.characterCount.characters() ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ink-200 bg-white">
        {[
          { cmd: () => editor?.chain().focus().toggleBold().run(),
            label: 'B', title: 'Bold', active: editor?.isActive('bold') },
          { cmd: () => editor?.chain().focus().toggleItalic().run(),
            label: 'I', title: 'Italic', active: editor?.isActive('italic') },
          { cmd: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            label: 'H2', title: 'Heading', active: editor?.isActive('heading', { level: 2 }) },
          { cmd: () => editor?.chain().focus().toggleBulletList().run(),
            label: '•', title: 'List', active: editor?.isActive('bulletList') },
        ].map((btn) => (
          <button
            key={btn.title}
            onClick={btn.cmd}
            title={btn.title}
            className={`
              px-2.5 py-1 rounded text-sm font-medium transition-colors
              ${btn.active
                ? 'bg-ink-200 text-ink-900'
                : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
              }
            `}
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-ink-400">
          {wordCount} kata · {charCount} karakter
        </span>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}
