import os
from unittest.mock import patch

import pytest

from app.config import get_anthropic_api_key, get_project_root


class TestGetProjectRoot:
    def test_given_env_var_set_when_get_project_root_then_returns_path(self):
        with patch.dict(os.environ, {"VOICE_APP_PROJECT_ROOT": "/tmp/test"}):
            assert get_project_root() == "/tmp/test"

    def test_given_env_var_not_set_when_get_project_root_then_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(RuntimeError, match="VOICE_APP_PROJECT_ROOT is not set"):
                get_project_root()

    def test_given_env_var_empty_when_get_project_root_then_raises(self):
        with patch.dict(os.environ, {"VOICE_APP_PROJECT_ROOT": ""}):
            with pytest.raises(RuntimeError, match="VOICE_APP_PROJECT_ROOT is not set"):
                get_project_root()


class TestGetAnthropicApiKey:
    def test_given_env_var_set_when_get_api_key_then_returns_key(self):
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test-123"}):
            assert get_anthropic_api_key() == "sk-test-123"

    def test_given_env_var_not_set_when_get_api_key_then_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY is not set"):
                get_anthropic_api_key()

    def test_given_env_var_empty_when_get_api_key_then_raises(self):
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}):
            with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY is not set"):
                get_anthropic_api_key()
