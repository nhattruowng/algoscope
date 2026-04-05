import { useMutation } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { SearchCode } from "lucide-react";
import { useState } from "react";

import type { AnalysisRequest, HeatmapMode } from "@algoscope/shared-types";
import { HeatmapEditor } from "@/components/heatmap/heatmap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { saveLatestAnalyzeResult } from "@/lib/session-result";

const starterCode = `def solve(data):
    output = []
    for item in data:
        for peer in data:
            output.append(item + peer)
    return output
`;

export function AnalyzePage() {
  const [mode, setMode] = useState<HeatmapMode>("risk");
  const [payload, setPayload] = useState<AnalysisRequest>({
    language: "python",
    code: starterCode,
    entrypoint: "solve",
    profile_label: "analysis-workbench",
  });

  const mutation = useMutation({
    mutationFn: () => api.analyze(payload),
    onSuccess: (result) => saveLatestAnalyzeResult(result),
  });

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-panel/95 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="section-title mb-2">Analyze Code</div>
          <h1 className="text-3xl font-semibold tracking-tight">Phân tích code heuristic không cần chạy benchmark</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Workspace này hữu ích khi bạn chỉ muốn xem explanation, hotspot, warning, annotation và khuyến nghị tối
            ưu trước khi bắn sang flow simulate đầy đủ.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <SearchCode className="mr-2 h-4 w-4" />
          {mutation.isPending ? "Analyzing..." : "Analyze"}
        </Button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="section-title">Analysis Workspace</div>
            <div className="mt-1 text-lg font-semibold">Code input</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={payload.profile_label ?? ""}
                onChange={(event) => setPayload({ ...payload, profile_label: event.target.value })}
                placeholder="Profile label"
              />
              <Input
                value={payload.entrypoint ?? ""}
                onChange={(event) => setPayload({ ...payload, entrypoint: event.target.value })}
                placeholder="Entrypoint"
              />
            </div>
            <Editor
              height="520px"
              defaultLanguage="python"
              theme="vs-dark"
              value={payload.code}
              onChange={(value) => setPayload({ ...payload, code: value ?? "" })}
              options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 22 }}
            />
            {mutation.error ? <p className="text-sm text-danger">{String(mutation.error)}</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="section-title">Insight Snapshot</div>
              <div className="mt-1 text-lg font-semibold">Kết quả mới nhất</div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {result ? (
                <>
                  <div className="flex items-center gap-3">
                    <Badge value={`Risk ${result.insights.risk_score}`} tone={result.insights.risk_score >= 70 ? "danger" : result.insights.risk_score >= 40 ? "warning" : "success"} />
                    <Badge value={result.report.cache_hit ? "cache hit" : "fresh"} tone={result.report.cache_hit ? "warning" : "default"} />
                  </div>
                  <p className="leading-6 text-muted">{result.insights.explanation}</p>
                  <div>
                    <div className="font-semibold">Warnings</div>
                    <ul className="mt-2 space-y-2 text-muted">
                      {result.insights.warnings.length ? (
                        result.insights.warnings.map((warning, index) => (
                          <li key={index} className="rounded-xl border border-line bg-panelAlt p-3">
                            {warning}
                          </li>
                        ))
                      ) : (
                        <li>Không có warning nào được phát hiện.</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold">Recommendations</div>
                    <ul className="mt-2 space-y-2 text-muted">
                      {result.insights.recommendations.length ? (
                        result.insights.recommendations.map((item, index) => (
                          <li key={index} className="rounded-xl border border-line bg-panelAlt p-3">
                            <div className="font-semibold text-text">{item.title}</div>
                            <div className="mt-1 leading-6">{item.detail}</div>
                          </li>
                        ))
                      ) : (
                        <li>Chưa có khuyến nghị nổi bật.</li>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-muted">Gửi request analyze để xem explanation và heatmap heuristic.</p>
              )}
            </CardContent>
          </Card>

          {result ? (
            <Card className="overflow-hidden">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <div className="section-title">Code Heatmap</div>
                  <div className="mt-1 text-lg font-semibold">Annotation overlay</div>
                </div>
                <div className="flex gap-2">
                  {(["time", "memory", "risk"] as HeatmapMode[]).map((item) => (
                    <Button key={item} variant={mode === item ? "primary" : "secondary"} onClick={() => setMode(item)}>
                      {item}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <HeatmapEditor code={payload.code} annotations={result.insights.annotations} mode={mode} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
