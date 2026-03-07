import os


def get_project_root() -> str:
    path = os.environ.get("VOICE_APP_PROJECT_ROOT")
    if not path:
        raise RuntimeError("VOICE_APP_PROJECT_ROOT is not set")
    return path
