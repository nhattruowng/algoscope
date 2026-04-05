import ast


class PythonHeuristicAnalyzer:
    def analyze(self, code: str, entrypoint: str | None = None) -> dict:
        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            message = f"Lỗi cú pháp tại dòng {exc.lineno}: {exc.msg}"
            return {
                "explanation": "Không thể phân tích đầy đủ vì mã nguồn có lỗi cú pháp.",
                "detected_entrypoint": entrypoint,
                "warnings": [message],
                "hotspots": [
                    {
                        "line_start": exc.lineno or 1,
                        "line_end": exc.lineno or 1,
                        "severity": "high",
                        "type": "risk",
                        "label": "Lỗi cú pháp",
                    }
                ],
                "complexity_hints": ["Cần sửa lỗi cú pháp trước khi đánh giá độ phức tạp."],
                "annotations": [
                    {
                        "line_start": exc.lineno or 1,
                        "line_end": exc.lineno or 1,
                        "severity": "high",
                        "category": "risk",
                        "message": message,
                        "weights": {"time": 0.05, "memory": 0.05, "risk": 1.0},
                    }
                ],
                "recommendations": [
                    {
                        "title": "Sửa lỗi cú pháp",
                        "detail": "Mã cần parse thành công trước khi có thể benchmark hoặc so sánh đáng tin cậy.",
                        "category": "risk",
                        "priority": "high",
                    }
                ],
                "risk_score": 95,
            }

        functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        loops = [node for node in ast.walk(tree) if isinstance(node, (ast.For, ast.While))]
        comprehensions = [node for node in ast.walk(tree) if isinstance(node, (ast.ListComp, ast.DictComp, ast.SetComp))]

        detected_entrypoint = entrypoint or (functions[0].name if functions else None)
        warnings: list[str] = []
        hotspots: list[dict] = []
        annotations: list[dict] = []
        complexity_hints: list[str] = []
        recommendations: list[dict] = []

        for node in functions:
            if self._is_recursive(node):
                warnings.append(f"Hàm `{node.name}` có dấu hiệu đệ quy và có thể làm tăng stack usage.")
                hotspots.append(
                    {
                        "line_start": getattr(node, "lineno", 1),
                        "line_end": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
                        "severity": "medium",
                        "type": "risk",
                        "label": "Recursive function",
                    }
                )
                annotations.append(
                    self._annotation(node, "medium", "risk", "Phát hiện lời gọi đệ quy.", 0.45, 0.2, 0.8)
                )
                complexity_hints.append("Đệ quy có thể làm tăng chi phí stack và làm khó việc dự đoán hiệu năng.")
                recommendations.append(
                    {
                        "title": "Đánh giá lại đệ quy",
                        "detail": "Nếu dữ liệu lớn, hãy cân nhắc chuyển sang iterative approach hoặc bổ sung guard rõ ràng.",
                        "category": "risk",
                        "priority": "medium",
                    }
                )

        for node in loops:
            if self._contains_nested_loop(node):
                warnings.append("Phát hiện vòng lặp lồng nhau; runtime có thể tăng nhanh theo input size.")
                hotspots.append(
                    {
                        "line_start": getattr(node, "lineno", 1),
                        "line_end": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
                        "severity": "high",
                        "type": "time",
                        "label": "Nested loop hotspot",
                    }
                )
                annotations.append(
                    self._annotation(node, "high", "time", "Vùng vòng lặp lồng nhau có nguy cơ trở thành hotspot.", 0.9, 0.3, 0.7)
                )
                complexity_hints.append("Có dấu hiệu hành vi O(n^2) hoặc tệ hơn ở vùng được tô sáng.")
                recommendations.append(
                    {
                        "title": "Giảm nested loop",
                        "detail": "Xem xét dùng hash map, precomputation hoặc built-in vectorized operation để giảm độ phức tạp thời gian.",
                        "category": "time",
                        "priority": "high",
                    }
                )

        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in {"sorted", "list", "dict", "set"}:
                annotations.append(
                    self._annotation(
                        node,
                        "low",
                        "memory",
                        f"Lời gọi `{node.func.id}` có thể tạo thêm allocation.",
                        0.25,
                        0.65,
                        0.3,
                    )
                )
                if node.func.id == "sorted":
                    recommendations.append(
                        {
                            "title": "Theo dõi chi phí sort",
                            "detail": "Nếu sorting nằm trong đường nóng, hãy cân nhắc giảm số lần gọi hoặc cache kết quả khi phù hợp.",
                            "category": "time",
                            "priority": "medium",
                        }
                    )
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr in {"copy", "deepcopy"}:
                warnings.append("Phát hiện thao tác copy; dữ liệu lớn có thể làm tăng chi phí bộ nhớ.")
                hotspots.append(
                    {
                        "line_start": getattr(node, "lineno", 1),
                        "line_end": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
                        "severity": "medium",
                        "type": "memory",
                        "label": "Copy allocation hotspot",
                    }
                )
                annotations.append(
                    self._annotation(node, "medium", "memory", "Copy operation có thể làm tăng memory pressure.", 0.35, 0.85, 0.55)
                )
                complexity_hints.append("Copy dữ liệu trong đường nóng có thể làm tăng memory churn.")
                recommendations.append(
                    {
                        "title": "Giảm sao chép dữ liệu",
                        "detail": "Ưu tiên pass-by-reference, in-place update hoặc slice hẹp hơn nếu logic cho phép.",
                        "category": "memory",
                        "priority": "medium",
                    }
                )

        explanation = self._build_explanation(functions, loops, comprehensions, detected_entrypoint)
        if not complexity_hints:
            complexity_hints.append(
                "Chưa thấy hotspot rõ ràng; chi phí thực thi có thể phụ thuộc vào lời gọi built-in và hình dạng dữ liệu đầu vào."
            )
        if not recommendations:
            recommendations.append(
                {
                    "title": "Benchmark theo nhiều data shape",
                    "detail": "Giữ ít nhất một preset scaling và một preset memory-focused để quan sát hành vi khi input thay đổi.",
                    "category": "readability",
                    "priority": "low",
                }
            )

        risk_score = min(100, self._score_risk(warnings, hotspots))

        return {
            "explanation": explanation,
            "detected_entrypoint": detected_entrypoint,
            "warnings": warnings,
            "hotspots": hotspots,
            "complexity_hints": complexity_hints,
            "annotations": annotations,
            "recommendations": self._dedupe_recommendations(recommendations),
            "risk_score": risk_score,
        }

    def _build_explanation(
        self,
        functions: list[ast.FunctionDef],
        loops: list[ast.AST],
        comprehensions: list[ast.AST],
        entrypoint: str | None,
    ) -> str:
        parts = []
        if functions:
            parts.append(f"Đoạn mã định nghĩa {len(functions)} hàm.")
        else:
            parts.append("Đoạn mã dựa vào luồng thực thi ở mức top-level.")
        if entrypoint:
            parts.append(f"Entrypoint có khả năng cao là `{entrypoint}`.")
        if loops:
            parts.append(f"Có {len(loops)} cấu trúc lặp tường minh trong mã.")
        if comprehensions:
            parts.append(f"Có {len(comprehensions)} comprehension có thể dẫn tới allocation bổ sung.")
        return " ".join(parts)

    def _contains_nested_loop(self, node: ast.AST) -> bool:
        for child in ast.walk(node):
            if child is node:
                continue
            if isinstance(child, (ast.For, ast.While)):
                return True
        return False

    def _is_recursive(self, function_node: ast.FunctionDef) -> bool:
        for child in ast.walk(function_node):
            if isinstance(child, ast.Call) and isinstance(child.func, ast.Name) and child.func.id == function_node.name:
                return True
        return False

    def _annotation(
        self,
        node: ast.AST,
        severity: str,
        category: str,
        message: str,
        time_weight: float,
        memory_weight: float,
        risk_weight: float,
    ) -> dict:
        return {
            "line_start": getattr(node, "lineno", 1),
            "line_end": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
            "severity": severity,
            "category": category,
            "message": message,
            "weights": {
                "time": time_weight,
                "memory": memory_weight,
                "risk": risk_weight,
            },
        }

    def _score_risk(self, warnings: list[str], hotspots: list[dict]) -> int:
        base = len(warnings) * 10
        for hotspot in hotspots:
            if hotspot["severity"] == "high":
                base += 25
            elif hotspot["severity"] == "medium":
                base += 15
            else:
                base += 5
        return max(5, base)

    def _dedupe_recommendations(self, recommendations: list[dict]) -> list[dict]:
        seen: set[tuple[str, str]] = set()
        result: list[dict] = []
        for item in recommendations:
            key = (item["title"], item["detail"])
            if key in seen:
                continue
            seen.add(key)
            result.append(item)
        return result[:6]
