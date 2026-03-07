import os


def get_project_root() -> str:
    path = os.environ.get("VOICE_APP_PROJECT_ROOT")
    if not path:
        raise RuntimeError("VOICE_APP_PROJECT_ROOT is not set")
    return path


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return url
