import type { editor as MonacoEditor } from "monaco-editor";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { CodeAnnotation } from "@algoscope/shared-types";
import { useEffect, useRef } from "react";

type HeatmapMode = "time" | "memory" | "risk";

export function HeatmapEditor({
  code,
  annotations,
  mode,
}: {
  code: string;
  annotations: CodeAnnotation[];
  mode: HeatmapMode;
}) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIds = useRef<string[]>([]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const decorations = annotations.map((annotation) => {
      const weight = annotation.weights[mode] ?? 0;
      const className = weight > 0.75 ? "heatmap-high" : weight > 0.4 ? "heatmap-medium" : "heatmap-low";
      return {
        range: new monaco.Range(annotation.line_start, 1, annotation.line_end, 1),
        options: {
          isWholeLine: true,
          className,
          glyphMarginClassName: `${className}-gutter`,
          hoverMessage: [
            {
              value: `**${annotation.category.toUpperCase()}**\n\n${annotation.message}\n\nWeight: ${weight.toFixed(2)}`,
            },
          ],
        },
      };
    });

    decorationIds.current = editor.deltaDecorations(decorationIds.current, decorations);
  }, [annotations, mode]);

  return (
    <Editor
      height="420px"
      defaultLanguage="python"
      value={code}
      theme="vs-dark"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        glyphMargin: true,
        fontSize: 13,
        lineHeight: 22,
        roundedSelection: false,
      }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
      }}
    />
  );
}

