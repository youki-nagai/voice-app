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
