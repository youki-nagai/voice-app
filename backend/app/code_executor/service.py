import os
import re
import subprocess
from pathlib import Path

from app.chat.schemas import FileChange

IGNORE_DIRS = {".git", ".venv", "__pycache__", "node_modules", ".ruff_cache", ".pytest_cache"}
IGNORE_EXTENSIONS = {".pyc", ".lock"}
MAX_FILE_SIZE = 50_000  # 50KB


class CodeExecutorService:
    def __init__(self, project_root: str):
        self._project_root = Path(project_root)

    def get_project_context(self) -> str:
        """プロジェクトのファイル構造とコード内容を取得"""
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
        """ファイル変更を適用"""
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

    def auto_commit(self, instruction: str) -> str | None:
        """変更を自動コミット"""
        try:
            subprocess.run(
                ["git", "add", "-A"],
                cwd=self._project_root,
                capture_output=True,
                check=True,
            )

            result = subprocess.run(
                ["git", "diff", "--cached", "--quiet"],
                cwd=self._project_root,
                capture_output=True,
            )

            if result.returncode == 0:
                return None

            summary = instruction[:80]
            commit_message = f"voice: {summary}"

            subprocess.run(
                ["git", "commit", "-m", commit_message],
                cwd=self._project_root,
                capture_output=True,
                check=True,
                env={**os.environ, "GIT_AUTHOR_NAME": "voice-app", "GIT_AUTHOR_EMAIL": "voice-app@local"},
            )

            return commit_message

        except subprocess.CalledProcessError:
            return None

    def run_tests(self) -> dict:
        """pytest を実行してテスト結果を返す"""
        result = subprocess.run(
            ["python", "-m", "pytest", "--tb=short", "-q"],
            cwd=self._project_root,
            capture_output=True,
            text=True,
        )
        output = result.stdout + result.stderr
        passed = 0
        failed = 0
        for line in output.splitlines():
            if "passed" in line or "failed" in line:
                m_passed = re.search(r"(\d+) passed", line)
                m_failed = re.search(r"(\d+) failed", line)
                if m_passed:
                    passed = int(m_passed.group(1))
                if m_failed:
                    failed = int(m_failed.group(1))

        success = result.returncode == 0 or (passed == 0 and failed == 0 and "no tests ran" in output.lower())
        return {
            "success": success,
            "passed": passed,
            "failed": failed,
            "output": output,
        }

    def run_lint(self) -> dict:
        """ruff check を実行してlint結果を返す"""
        result = subprocess.run(
            ["python", "-m", "ruff", "check", "."],
            cwd=self._project_root,
            capture_output=True,
            text=True,
        )
        output = result.stdout + result.stderr
        return {
            "success": result.returncode == 0,
            "output": output,
        }
