from fastapi.testclient import TestClient

from app.main import app


class TestGitRouterCheck:
    def setup_method(self):
        self._client = TestClient(app)

    def test_given_git_check_endpoint_when_called_then_returns_status(self):
        """実際にgh コマンドの状況をチェックする"""
        response = self._client.get("/api/git/check")
        
        assert response.status_code == 200
        data = response.json()
        
        # レスポンス構造の確認
        assert "gh_status" in data
        assert "repo_info" in data
        
        gh_status = data["gh_status"]
        assert "gh_installed" in gh_status
        assert "gh_authenticated" in gh_status
        assert "git_repo" in gh_status
        assert "errors" in gh_status
        
        # 実際の状況をテスト出力で確認できるようにする
        print(f"\n=== gh コマンド実行状況 ===")
        print(f"gh インストール済み: {gh_status['gh_installed']}")
        print(f"gh 認証済み: {gh_status['gh_authenticated']}")
        print(f"Git リポジトリ: {gh_status['git_repo']}")
        
        if gh_status['errors']:
            print(f"エラー:")
            for error in gh_status['errors']:
                print(f"  - {error}")
        else:
            print("エラーなし")
        
        if data['repo_info']:
            repo_info = data['repo_info']
            print(f"リモート URL: {repo_info['remote_url']}")
            print(f"現在のブランチ: {repo_info['current_branch']}")
        else:
            print("リポジトリ情報なし")
        
        print(f"========================")
