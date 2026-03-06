import subprocess
import tempfile
from pathlib import Path

from app.chat.schemas import FileChange
from app.code_executor.service import CodeExecutorService


class TestCodeExecutorApplyChanges:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()
        self._service = CodeExecutorService(project_root=self._tmpdir)

    def test_given_create_action_when_apply_then_creates_file(self):
        changes = [FileChange(path="hello.py", content="print('hello')", action="create")]
        results = self._service.apply_changes(changes)

        assert results[0]["action"] == "created"
        assert (Path(self._tmpdir) / "hello.py").read_text() == "print('hello')"

    def test_given_nested_path_when_apply_then_creates_directories(self):
        changes = [FileChange(path="src/lib/util.py", content="x = 1", action="create")]
        results = self._service.apply_changes(changes)

        assert results[0]["action"] == "created"
        assert (Path(self._tmpdir) / "src/lib/util.py").exists()

    def test_given_delete_action_when_apply_then_deletes_file(self):
        file_path = Path(self._tmpdir) / "to_delete.py"
        file_path.write_text("delete me")

        changes = [FileChange(path="to_delete.py", content="", action="delete")]
        results = self._service.apply_changes(changes)

        assert results[0]["action"] == "deleted"
        assert not file_path.exists()

    def test_given_update_action_when_apply_then_overwrites_file(self):
        file_path = Path(self._tmpdir) / "existing.py"
        file_path.write_text("old content")

        changes = [FileChange(path="existing.py", content="new content", action="update")]
        results = self._service.apply_changes(changes)

        assert results[0]["action"] == "updated"
        assert file_path.read_text() == "new content"


class TestCodeExecutorAutoCommit:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()
        subprocess.run(["git", "init"], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "config", "user.name", "test"], cwd=self._tmpdir, capture_output=True)
        # 初期コミット
        Path(self._tmpdir, "README.md").write_text("init")
        subprocess.run(["git", "add", "."], cwd=self._tmpdir, capture_output=True)
        subprocess.run(["git", "commit", "-m", "init"], cwd=self._tmpdir, capture_output=True)
        self._service = CodeExecutorService(project_root=self._tmpdir)

    def test_given_changes_when_auto_commit_then_returns_message(self):
        Path(self._tmpdir, "new.py").write_text("print(1)")
        result = self._service.auto_commit("テストファイル追加")

        assert result == "voice: テストファイル追加"

    def test_given_no_changes_when_auto_commit_then_returns_none(self):
        result = self._service.auto_commit("何も変更なし")
        assert result is None
