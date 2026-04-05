from app.analyzers.python_heuristics import PythonHeuristicAnalyzer


def test_python_heuristic_analyzer_flags_nested_loop_and_copy():
    analyzer = PythonHeuristicAnalyzer()

    result = analyzer.analyze(
        """
def solve(data):
    clone = data.copy()
    total = 0
    for item in clone:
        for peer in clone:
            total += item + peer
    return total
""".strip(),
        entrypoint="solve",
    )

    assert result["detected_entrypoint"] == "solve"
    assert any("vòng lặp lồng nhau" in warning for warning in result["warnings"])
    assert any(hotspot["type"] == "time" for hotspot in result["hotspots"])
    assert any(item["category"] == "time" for item in result["recommendations"])
    assert result["risk_score"] >= 25
