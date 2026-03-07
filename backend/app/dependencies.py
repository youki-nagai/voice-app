from typing import Annotated

from fastapi import Depends

from app.claude_code.service import ClaudeCodeService
from app.config import get_project_root


def get_claude_code_service() -> ClaudeCodeService:
    return ClaudeCodeService(project_root=get_project_root())


ClaudeCodeDep = Annotated[ClaudeCodeService, Depends(get_claude_code_service)]
