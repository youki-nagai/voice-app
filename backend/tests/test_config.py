import os
from unittest.mock import patch

import pytest

from app.config import get_project_root


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
