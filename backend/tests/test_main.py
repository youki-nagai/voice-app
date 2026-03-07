from fastapi.testclient import TestClient

from app.main import app


class TestAppSetup:
    def setup_method(self):
        self._client = TestClient(app)

    def test_given_app_when_check_title_then_returns_voice_app(self):
        assert app.title == "voice-app"

    def test_given_app_when_get_openapi_then_includes_voice_and_git_tags(self):
        schema = app.openapi()
        paths = schema["paths"]
        assert "/api/voice/stream" in paths
        assert "/api/git/check" in paths
        assert "/api/git/status" in paths
        assert "/api/git/log" in paths
        assert "/api/git/branch" in paths
        assert "/api/git/push" in paths
        assert "/api/git/pr" in paths

    def test_given_cors_middleware_when_options_then_allows_all(self):
        response = self._client.options(
            "/api/git/check",
            headers={"Origin": "http://example.com", "Access-Control-Request-Method": "GET"},
        )
        assert response.headers.get("access-control-allow-origin") == "*"
