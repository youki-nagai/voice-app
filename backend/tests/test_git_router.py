import subprocess
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient

from app.dependencies import get_git_service
from app.git.service import GitService
from app.main import app


class TestGitRouterCheck:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()
        app.dependency_overrides[get_git_service] = lambda: GitService(project_root=self._tmpdir)
        self._client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_given_git_check_endpoint_when_called_then_returns_status(self):
        response = self._client.get("/api/git/check")

        assert response.status_code == 200
        data = response.json()

        assert "gh_status" in data
        assert "repo_info" in data

        gh_status = data["gh_status"]
        assert "gh_installed" in gh_status
        assert "gh_authenticated" in gh_status
        assert "git_repo" in gh_status
        assert "errors" in gh_status


class TestGitRouterOperations:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()
        # git init + initial commit
        subprocess.run(["git", "init"], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "config", "user.name", "test"], cwd=self._tmpdir, capture_output=True)
        Path(self._tmpdir, "test.txt").write_text("test")
        subprocess.run(["git", "add", "."], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "commit", "-m", "initial"], cwd=self._tmpdir, capture_output=True)

        app.dependency_overrides[get_git_service] = lambda: GitService(project_root=self._tmpdir)
        self._client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_given_status_endpoint_when_called_then_returns_branch_and_files(self):
        response = self._client.get("/api/git/status")

        assert response.status_code == 200
        data = response.json()
        assert "branch" in data
        assert "changed_files" in data

    def test_given_log_endpoint_when_called_then_returns_commits(self):
        response = self._client.get("/api/git/log")

        assert response.status_code == 200
        data = response.json()
        assert "log" in data
        assert len(data["log"]) >= 1

    def test_given_branch_endpoint_when_called_then_creates_branch(self):
        response = self._client.post("/api/git/branch", json={"name": "feature/test-branch"})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["branch"] == "feature/test-branch"

    def test_given_push_endpoint_when_called_without_remote_then_returns_error(self):
        response = self._client.post("/api/git/push")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
