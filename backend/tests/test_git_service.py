import subprocess
import tempfile
from pathlib import Path
from unittest.mock import patch

from app.git.service import GitService


class TestGitServiceCheckGhCommand:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()
        self._service = GitService(project_root=self._tmpdir)

    @patch('subprocess.run')
    def test_given_gh_not_installed_when_check_then_returns_error(self, mock_run):
        mock_run.side_effect = FileNotFoundError("gh not found")
        
        result = self._service.check_gh_command()
        
        assert result["gh_installed"] is False
        assert result["gh_authenticated"] is False
        assert result["git_repo"] is False
        assert len(result["errors"]) == 1
        assert "gh コマンドが見つかりません" in result["errors"][0]

    @patch('subprocess.run')
    def test_given_gh_installed_but_not_authenticated_when_check_then_returns_partial_success(self, mock_run):
        def side_effect(*args, **kwargs):
            if "gh" in args[0] and "--version" in args[0]:
                return subprocess.CompletedProcess(args[0], 0)
            elif "gh" in args[0] and "auth" in args[0]:
                raise subprocess.CalledProcessError(1, args[0])
            elif "git" in args[0] and "rev-parse" in args[0]:
                return subprocess.CompletedProcess(args[0], 0)
        
        mock_run.side_effect = side_effect
        
        result = self._service.check_gh_command()
        
        assert result["gh_installed"] is True
        assert result["gh_authenticated"] is False
        assert result["git_repo"] is True
        assert len(result["errors"]) == 1
        assert "gh の認証が必要です" in result["errors"][0]

    @patch('subprocess.run')
    def test_given_all_conditions_met_when_check_then_returns_success(self, mock_run):
        mock_run.return_value = subprocess.CompletedProcess([], 0)
        
        result = self._service.check_gh_command()
        
        assert result["gh_installed"] is True
        assert result["gh_authenticated"] is True
        assert result["git_repo"] is True
        assert len(result["errors"]) == 0


class TestGitServiceGetRepoInfo:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()
        subprocess.run(["git", "init"], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "config", "user.name", "test"], cwd=self._tmpdir, capture_output=True)
        self._service = GitService(project_root=self._tmpdir)

    def test_given_no_remote_when_get_repo_info_then_returns_none(self):
        result = self._service.get_repo_info()
        assert result is None

    def test_given_remote_exists_when_get_repo_info_then_returns_info(self):
        # リモートとブランチを設定
        subprocess.run(["git", "remote", "add", "origin", "https://github.com/user/repo.git"], 
                      cwd=self._tmpdir, capture_output=True)
        
        # 初期コミットとブランチ作成
        Path(self._tmpdir, "test.txt").write_text("test")
        subprocess.run(["git", "add", "."], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "commit", "-m", "initial"], cwd=self._tmpdir, capture_output=True)
        
        result = self._service.get_repo_info()
        
        assert result is not None
        assert result["remote_url"] == "https://github.com/user/repo.git"
        assert result["current_branch"] in ["main", "master"]  # Git設定による
