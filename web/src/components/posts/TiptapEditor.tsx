'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Minus,
  Undo,
  Redo,
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder: _placeholder = 'Write content here...',
}: TiptapEditorProps) {
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] p-4 text-xs md:text-sm text-foreground focus:outline-none prose dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="h-48 w-full animate-pulse rounded-lg bg-muted/40 p-4" />
    );
  }

  const addImage = () => {
    if (imageUrlInput.trim()) {
      editor.chain().focus().setImage({ src: imageUrlInput.trim() }).run();
      setImageUrlInput('');
      setShowImagePrompt(false);
    }
  };

  return (
    <div className="rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('bold')
              ? 'bg-primary text-primary-foreground font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('italic')
              ? 'bg-primary text-primary-foreground italic'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('strike')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-primary text-primary-foreground font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-primary text-primary-foreground font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 text-xs transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => setShowImagePrompt(!showImagePrompt)}
          className={`rounded p-1.5 text-xs transition-colors ${
            showImagePrompt
              ? 'bg-secondary/20 text-secondary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Insert Image Bar */}
      {showImagePrompt && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 p-2 text-xs">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Enter image URL (https://... or /uploads/...)"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addImage()}
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowImagePrompt(false)}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
