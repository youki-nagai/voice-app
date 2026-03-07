import re
import subprocess
from pathlib import Path

from app.chat.schemas import FileChange

IGNORE_DIRS = {".git", ".venv", "__pycache__", "node_modules", ".ruff_cache", ".pytest_cache"}
IGNORE_EXTENSIONS = {".pyc", ".lock"}
MAX_FILE_SIZE = 50_000


class CodeExecutorService:
    def __init__(self, project_root: str):
        self._project_root = Path(project_root)

    def _run(self, cmd: list[str]) -> subprocess.CompletedProcess:
        return subprocess.run(
            cmd,
            cwd=self._project_root,
            capture_output=True,
            text=True,
        )

    def get_project_context(self) -> str:
        file_list = []
        file_contents = []

        for path in sorted(self._project_root.rglob("*")):
            if any(part in IGNORE_DIRS for part in path.parts):
                continue
            if path.is_dir() or path.suffix in IGNORE_EXTENSIONS:
                continue

            relative = path.relative_to(self._project_root)
            file_list.append(str(relative))

            if path.stat().st_size > MAX_FILE_SIZE:
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, PermissionError):
                continue

            file_contents.append(f"### {relative}\n```{path.suffix.lstrip('.')}\n{content}\n```\n")

        return "```\n" + "\n".join(file_list) + "\n```\n\n" + "\n".join(file_contents)

    def apply_changes(self, file_changes: list[FileChange]) -> list[dict]:
        results = []
        for change in file_changes:
            file_path = self._project_root / change.path

            if change.action == "delete":
                if file_path.exists():
                    file_path.unlink()
                    results.append({"path": change.path, "action": "deleted"})

            elif change.action in ("create", "update"):
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(change.content, encoding="utf-8")
                action = "created" if change.action == "create" else "updated"
                results.append({"path": change.path, "action": action})

        return results

    def run_tests(self) -> dict:
        result = self._run(["python", "-m", "pytest", "--tb=short", "-q"])
        output = result.stdout + result.stderr
        passed = 0
        failed = 0
        for line in output.splitlines():
            m_passed = re.search(r"(\d+) passed", line)
            m_failed = re.search(r"(\d+) failed", line)
            if m_passed:
                passed = int(m_passed.group(1))
            if m_failed:
                failed = int(m_failed.group(1))

        success = result.returncode == 0 or (passed == 0 and failed == 0 and "no tests ran" in output.lower())
        return {"success": success, "passed": passed, "failed": failed, "output": output}

    def run_lint(self) -> dict:
        result = self._run(["python", "-m", "ruff", "check", "."])
        output = result.stdout + result.stderr
        return {"success": result.returncode == 0, "output": output}
