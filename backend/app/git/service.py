import subprocess
from pathlib import Path


class GitService:
    def __init__(self, project_root: str):
        self._project_root = Path(project_root)

    def _run(self, cmd: list[str], *, timeout: int = 10) -> subprocess.CompletedProcess:
        return subprocess.run(
            cmd,
            cwd=self._project_root,
            capture_output=True,
            text=True,
            check=True,
            timeout=timeout,
        )

    def _run_safe(self, cmd: list[str], *, timeout: int = 10) -> subprocess.CompletedProcess:
        """check=False 版。戻り値で成否を判断する用途。"""
        return subprocess.run(
            cmd,
            cwd=self._project_root,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

    def check_gh_command(self) -> dict:
        result = {"gh_installed": False, "gh_authenticated": False, "git_repo": False, "errors": []}

        try:
            self._run(["gh", "--version"], timeout=5)
            result["gh_installed"] = True
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            result["errors"].append(f"gh コマンドが見つかりません: {e}")
            return result

        try:
            self._run(["gh", "auth", "status"], timeout=5)
            result["gh_authenticated"] = True
        except subprocess.CalledProcessError as e:
            result["errors"].append(f"gh の認証が必要です: {e}")

        try:
            self._run(["git", "rev-parse", "--git-dir"], timeout=5)
            result["git_repo"] = True
        except subprocess.CalledProcessError as e:
            result["errors"].append(f"Git リポジトリではありません: {e}")

        return result

    def create_branch(self, name: str) -> dict:
        try:
            self._run(["git", "checkout", "-b", name])
            return {"success": True, "branch": name}
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": e.stderr.strip() or str(e)}

    def get_status(self) -> dict:
        branch = self._run_safe(["git", "branch", "--show-current"], timeout=5).stdout.strip()
        status = self._run_safe(["git", "status", "--porcelain"], timeout=5).stdout.strip()
        changed_files = [line.strip() for line in status.split("\n") if line.strip()]
        return {"branch": branch, "changed_files": changed_files}

    def push(self) -> dict:
        try:
            r = self._run(["git", "push", "-u", "origin", "HEAD"], timeout=30)
            return {"success": True, "output": r.stderr.strip() or r.stdout.strip()}
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": e.stderr.strip() or str(e)}

    def create_pr(self, title: str, body: str) -> dict:
        try:
            r = self._run(["gh", "pr", "create", "--title", title, "--body", body], timeout=30)
            return {"success": True, "url": r.stdout.strip()}
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": e.stderr.strip() or str(e)}

    def get_log(self, limit: int = 10) -> list[str]:
        r = self._run_safe(["git", "log", f"--max-count={limit}", "--oneline"], timeout=5)
        return [line for line in r.stdout.strip().split("\n") if line.strip()]

    def get_repo_info(self) -> dict | None:
        try:
            remote_url = self._run(["git", "remote", "get-url", "origin"], timeout=5).stdout.strip()
            branch = self._run(["git", "branch", "--show-current"], timeout=5).stdout.strip()
            return {"remote_url": remote_url, "current_branch": branch}
        except subprocess.CalledProcessError:
            return None

    def auto_commit(
        self, instruction: str, *, author_name: str = "voice-app", author_email: str = "voice-app@local"
    ) -> str | None:
        """変更をステージング＆コミット。変更がなければ None を返す。"""
        import os

        try:
            self._run(["git", "add", "-A"])

            diff = self._run_safe(["git", "diff", "--cached", "--quiet"])
            if diff.returncode == 0:
                return None

            message = f"voice: {instruction[:80]}"
            subprocess.run(
                ["git", "commit", "-m", message],
                cwd=self._project_root,
                capture_output=True,
                check=True,
                env={**os.environ, "GIT_AUTHOR_NAME": author_name, "GIT_AUTHOR_EMAIL": author_email},
            )
            return message
        except subprocess.CalledProcessError:
            return None
