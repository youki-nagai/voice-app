from typing import Annotated

from fastapi import Depends

from app.claude_code.service import ClaudeCodeService
from app.config import get_project_root
from app.git.service import GitService


def get_claude_code_service() -> ClaudeCodeService:
    return ClaudeCodeService(project_root=get_project_root())


def get_git_service() -> GitService:
    return GitService(project_root=get_project_root())


ClaudeCodeDep = Annotated[ClaudeCodeService, Depends(get_claude_code_service)]
GitServiceDep = Annotated[GitService, Depends(get_git_service)]
