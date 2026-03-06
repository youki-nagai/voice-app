import os


def get_anthropic_api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return key


def get_project_root() -> str:
    path = os.environ.get("VOICE_APP_PROJECT_ROOT")
    if not path:
        raise RuntimeError("VOICE_APP_PROJECT_ROOT is not set")
    return path
