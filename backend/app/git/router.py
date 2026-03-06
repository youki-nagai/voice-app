from fastapi import APIRouter

from app.dependencies import GitServiceDep

router = APIRouter()


@router.get("/check")
def check_gh_command(git_service: GitServiceDep):
    """gh コマンドの実行可能性をチェック"""
    gh_status = git_service.check_gh_command()
    repo_info = git_service.get_repo_info()

    return {"gh_status": gh_status, "repo_info": repo_info}
