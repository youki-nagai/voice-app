import subprocess
from pathlib import Path


class GitService:
    def __init__(self, project_root: str):
        self._project_root = Path(project_root)

    def check_gh_command(self) -> dict:
        """gh コマンドの実行可能性をチェック"""
        result = {"gh_installed": False, "gh_authenticated": False, "git_repo": False, "errors": []}

        # gh コマンドがインストールされているかチェック
        try:
            subprocess.run(["gh", "--version"], capture_output=True, check=True, timeout=5)
            result["gh_installed"] = True
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            result["errors"].append(f"gh コマンドが見つかりません: {e}")
            return result

        # gh の認証状態をチェック
        try:
            subprocess.run(["gh", "auth", "status"], capture_output=True, check=True, timeout=5)
            result["gh_authenticated"] = True
        except subprocess.CalledProcessError as e:
            result["errors"].append(f"gh の認証が必要です: {e}")

        # Git リポジトリかチェック
        try:
            subprocess.run(
                ["git", "rev-parse", "--git-dir"], cwd=self._project_root, capture_output=True, check=True, timeout=5
            )
            result["git_repo"] = True
        except subprocess.CalledProcessError as e:
            result["errors"].append(f"Git リポジトリではありません: {e}")

        return result

    def create_branch(self, name: str) -> dict:
        """ブランチを作成して切り替え"""
        try:
            subprocess.run(
                ["git", "checkout", "-b", name],
                cwd=self._project_root,
                capture_output=True,
                text=True,
                check=True,
                timeout=10,
            )
            return {"success": True, "branch": name}
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": e.stderr.strip() or str(e)}

    def get_status(self) -> dict:
        """git status を取得"""
        branch_result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=self._project_root,
            capture_output=True,
            text=True,
            timeout=5,
        )
        status_result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=self._project_root,
            capture_output=True,
            text=True,
            timeout=5,
        )
        changed_files = [line.strip() for line in status_result.stdout.strip().split("\n") if line.strip()]
        return {
            "branch": branch_result.stdout.strip(),
            "changed_files": changed_files,
        }

    def push(self) -> dict:
        """現在のブランチをpush"""
        try:
            result = subprocess.run(
                ["git", "push", "-u", "origin", "HEAD"],
                cwd=self._project_root,
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )
            return {"success": True, "output": result.stderr.strip() or result.stdout.strip()}
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": e.stderr.strip() or str(e)}

    def create_pr(self, title: str, body: str) -> dict:
        """gh pr create でPRを作成"""
        try:
            cmd = ["gh", "pr", "create", "--title", title, "--body", body]
            result = subprocess.run(
                cmd,
                cwd=self._project_root,
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )
            return {"success": True, "url": result.stdout.strip()}
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": e.stderr.strip() or str(e)}

    def get_log(self, limit: int = 10) -> list[str]:
        """直近のコミットログを取得"""
        result = subprocess.run(
            ["git", "log", f"--max-count={limit}", "--oneline"],
            cwd=self._project_root,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return [line for line in result.stdout.strip().split("\n") if line.strip()]

    def get_repo_info(self) -> dict | None:
        """リポジトリ情報を取得"""
        try:
            # リモート URL を取得
            result = subprocess.run(
                ["git", "remote", "get-url", "origin"],
                cwd=self._project_root,
                capture_output=True,
                text=True,
                check=True,
                timeout=5,
            )
            remote_url = result.stdout.strip()

            # ブランチ名を取得
            result = subprocess.run(
                ["git", "branch", "--show-current"],
                cwd=self._project_root,
                capture_output=True,
                text=True,
                check=True,
                timeout=5,
            )
            current_branch = result.stdout.strip()

            return {"remote_url": remote_url, "current_branch": current_branch}
        except subprocess.CalledProcessError:
            return None
