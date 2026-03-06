import tempfile

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
