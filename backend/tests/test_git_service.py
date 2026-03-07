import subprocess
import tempfile
from pathlib import Path
from unittest.mock import patch

from app.git.service import GitService


def _init_git_repo() -> str:
    tmpdir = tempfile.mkdtemp()
    subprocess.run(["git", "init"], cwd=tmpdir, capture_output=True)
    subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=tmpdir, capture_output=True)
    subprocess.run(["git", "config", "user.name", "test"], cwd=tmpdir, capture_output=True)
    return tmpdir


def _init_git_repo_with_commit() -> str:
    tmpdir = _init_git_repo()
    Path(tmpdir, "test.txt").write_text("test")
    subprocess.run(["git", "add", "."], cwd=tmpdir, capture_output=True)
    subprocess.run(["git", "commit", "-m", "initial"], cwd=tmpdir, capture_output=True)
    return tmpdir


class TestGitServiceCheckGhCommand:
    def setup_method(self):
        self._service = GitService(project_root=tempfile.mkdtemp())

    @patch("subprocess.run")
    def test_given_gh_not_installed_when_check_then_returns_error(self, mock_run):
        mock_run.side_effect = FileNotFoundError("gh not found")

        result = self._service.check_gh_command()

        assert result["gh_installed"] is False
        assert len(result["errors"]) == 1
        assert "gh コマンドが見つかりません" in result["errors"][0]

    @patch("subprocess.run")
    def test_given_gh_installed_but_not_authenticated_when_check_then_returns_partial_success(self, mock_run):
        def side_effect(*args, **kwargs):
            if "gh" in args[0] and "--version" in args[0]:
                return subprocess.CompletedProcess(args[0], 0)
            elif "gh" in args[0] and "auth" in args[0]:
                raise subprocess.CalledProcessError(1, args[0])
            elif "git" in args[0] and "rev-parse" in args[0]:
                return subprocess.CompletedProcess(args[0], 0)
            return subprocess.CompletedProcess(args[0], 0)

        mock_run.side_effect = side_effect

        result = self._service.check_gh_command()

        assert result["gh_installed"] is True
        assert result["gh_authenticated"] is False
        assert result["git_repo"] is True

    @patch("subprocess.run")
    def test_given_all_conditions_met_when_check_then_returns_success(self, mock_run):
        mock_run.return_value = subprocess.CompletedProcess([], 0)

        result = self._service.check_gh_command()

        assert result["gh_installed"] is True
        assert result["gh_authenticated"] is True
        assert result["git_repo"] is True
        assert len(result["errors"]) == 0


class TestGitServiceGetRepoInfo:
    def setup_method(self):
        self._tmpdir = _init_git_repo()
        self._service = GitService(project_root=self._tmpdir)

    def test_given_no_remote_when_get_repo_info_then_returns_none(self):
        result = self._service.get_repo_info()
        assert result is None

    def test_given_remote_exists_when_get_repo_info_then_returns_info(self):
        subprocess.run(
            ["git", "remote", "add", "origin", "https://github.com/user/repo.git"],
            cwd=self._tmpdir,
            capture_output=True,
        )
        Path(self._tmpdir, "test.txt").write_text("test")
        subprocess.run(["git", "add", "."], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "commit", "-m", "initial"], cwd=self._tmpdir, capture_output=True)

        result = self._service.get_repo_info()

        assert result is not None
        assert result["remote_url"] == "https://github.com/user/repo.git"
        assert result["current_branch"] in ["main", "master"]


class TestGitServiceCreateBranch:
    def setup_method(self):
        self._tmpdir = _init_git_repo_with_commit()
        self._service = GitService(project_root=self._tmpdir)

    def test_given_valid_name_when_create_branch_then_switches_to_new_branch(self):
        result = self._service.create_branch("feature/test")

        assert result["success"] is True
        assert result["branch"] == "feature/test"

        branch_result = subprocess.run(
            ["git", "branch", "--show-current"], cwd=self._tmpdir, capture_output=True, text=True
        )
        assert branch_result.stdout.strip() == "feature/test"

    def test_given_existing_branch_when_create_branch_then_returns_error(self):
        self._service.create_branch("feature/test")
        result = self._service.create_branch("feature/test")

        assert result["success"] is False
        assert "error" in result


class TestGitServiceGetStatus:
    def setup_method(self):
        self._tmpdir = _init_git_repo_with_commit()
        self._service = GitService(project_root=self._tmpdir)

    def test_given_clean_repo_when_get_status_then_returns_clean(self):
        result = self._service.get_status()

        assert result["branch"] in ["main", "master"]
        assert result["changed_files"] == []

    def test_given_modified_file_when_get_status_then_returns_changes(self):
        Path(self._tmpdir, "test.txt").write_text("modified")

        result = self._service.get_status()

        assert len(result["changed_files"]) > 0


class TestGitServicePush:
    def setup_method(self):
        self._service = GitService(project_root=tempfile.mkdtemp())

    @patch("subprocess.run")
    def test_given_valid_repo_when_push_then_returns_success(self, mock_run):
        mock_run.return_value = subprocess.CompletedProcess([], 0, stdout="Everything up-to-date", stderr="")

        result = self._service.push()

        assert result["success"] is True
        mock_run.assert_called_once()
        call_args = mock_run.call_args[0][0]
        assert call_args == ["git", "push", "-u", "origin", "HEAD"]

    @patch("subprocess.run")
    def test_given_push_fails_when_push_then_returns_error(self, mock_run):
        mock_run.side_effect = subprocess.CalledProcessError(1, "git push", stderr="rejected")

        result = self._service.push()

        assert result["success"] is False
        assert "error" in result


class TestGitServiceCreatePr:
    def setup_method(self):
        self._service = GitService(project_root=tempfile.mkdtemp())

    @patch("subprocess.run")
    def test_given_valid_params_when_create_pr_then_returns_url(self, mock_run):
        mock_run.return_value = subprocess.CompletedProcess(
            [], 0, stdout="https://github.com/user/repo/pull/1\n", stderr=""
        )

        result = self._service.create_pr("テストPR", "テスト本文")

        assert result["success"] is True
        assert result["url"] == "https://github.com/user/repo/pull/1"
        call_args = mock_run.call_args[0][0]
        assert "gh" in call_args
        assert "pr" in call_args
        assert "create" in call_args

    @patch("subprocess.run")
    def test_given_gh_fails_when_create_pr_then_returns_error(self, mock_run):
        mock_run.side_effect = subprocess.CalledProcessError(1, "gh pr create", stderr="error")

        result = self._service.create_pr("テスト", "")

        assert result["success"] is False
        assert "error" in result


class TestGitServiceGetLog:
    def setup_method(self):
        self._tmpdir = _init_git_repo_with_commit()
        self._service = GitService(project_root=self._tmpdir)

    def test_given_commits_exist_when_get_log_then_returns_entries(self):
        result = self._service.get_log(limit=5)

        assert len(result) >= 1
        assert "initial" in result[0]


class TestGitServiceAutoCommit:
    def setup_method(self):
        self._tmpdir = _init_git_repo_with_commit()
        self._service = GitService(project_root=self._tmpdir)

    def test_given_changes_when_auto_commit_then_returns_message(self):
        Path(self._tmpdir, "new.py").write_text("print(1)")
        result = self._service.auto_commit("テストファイル追加")

        assert result == "voice: テストファイル追加"

    def test_given_no_changes_when_auto_commit_then_returns_none(self):
        result = self._service.auto_commit("何も変更なし")
        assert result is None
