import os
from unittest.mock import patch

import pytest

from app.claude_code.service import ClaudeCodeService
from app.dependencies import get_claude_code_service, get_git_service
from app.git.service import GitService


class TestGetClaudeCodeService:
    def test_given_project_root_set_when_get_service_then_returns_instance(self):
        with patch.dict(os.environ, {"VOICE_APP_PROJECT_ROOT": "/tmp/test"}):
            service = get_claude_code_service()
            assert isinstance(service, ClaudeCodeService)

    def test_given_project_root_not_set_when_get_service_then_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(RuntimeError):
                get_claude_code_service()


class TestGetGitService:
    def test_given_project_root_set_when_get_service_then_returns_instance(self):
        with patch.dict(os.environ, {"VOICE_APP_PROJECT_ROOT": "/tmp/test"}):
            service = get_git_service()
            assert isinstance(service, GitService)

    def test_given_project_root_not_set_when_get_service_then_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(RuntimeError):
                get_git_service()
