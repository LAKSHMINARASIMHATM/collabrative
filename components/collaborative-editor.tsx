'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useCollaboration } from '@/lib/collaboration/collaboration-context';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';

interface CollaborativeEditorProps {
  language?: string;
  theme?: string;
  onCodeChange?: (code: string) => void;
  initialCode?: string;
}

export function CollaborativeEditor({
  language = 'javascript',
  theme = 'vs-dark',
  onCodeChange,
  initialCode = '',
}: CollaborativeEditorProps) {
  const { provider, yText, code } = useCollaboration();
  const [editor, setEditor] = useState<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Handle editor mount
  const handleEditorDidMount = (editorInstance: any, monaco: any) => {
    setEditor(editorInstance);
  };

  // Bind Yjs to Monaco
  useEffect(() => {
    if (!editor || !provider || !yText || !provider.awareness) return;

    // Destroy previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const model = editor.getModel();
    if (!model) return;

    // Create new binding
    // internal awareness is managed by provider.awareness
    try {
      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        provider.awareness
      );
    } catch (error) {
      console.error('Failed to create Monaco binding:', error);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editor, provider, yText]);

  // Handle onCodeChange prop manually if needed (binding handles validation)
  // But usually we don't need to lift state up with Yjs unless for validtion.
  useEffect(() => {
    if (onCodeChange && code) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        theme={theme}
        // value is managed by binding, but we can set initial
        defaultValue={initialCode}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          cursorStyle: 'line',
          cursorBlinking: 'smooth',
        }}
      />
      <style jsx global>{`
        .yRemoteSelection {
            background-color: rgb(250, 129, 0, .5);
        }
        .yRemoteSelectionHead {
            position: absolute;
            border-left: orange solid 2px;
            border-top: orange solid 2px;
            border-bottom: orange solid 2px;
            height: 100%;
            box-sizing: border-box;
        }
        .yRemoteSelectionHead::after {
            position: absolute;
            content: ' ';
            border: 3px solid orange;
            border-radius: 4px;
            left: -4px;
            top: -5px;
        }
      `}</style>
    </div>
  );
}
