from fastapi import APIRouter

from app.dependencies import GitServiceDep

router = APIRouter()


@router.get("/check")
def check_gh_command(git_service: GitServiceDep):
    """gh コマンドの実行可能性をチェック"""
    gh_status = git_service.check_gh_command()
    repo_info = git_service.get_repo_info()

    return {"gh_status": gh_status, "repo_info": repo_info}


@router.get("/status")
def get_status(git_service: GitServiceDep):
    """git status を取得"""
    return git_service.get_status()


@router.get("/log")
def get_log(git_service: GitServiceDep):
    """直近のコミットログを取得"""
    return {"log": git_service.get_log()}


@router.post("/branch")
def create_branch(git_service: GitServiceDep, body: dict):
    """ブランチを作成"""
    name = body.get("name", "")
    if not name:
        return {"success": False, "error": "ブランチ名が指定されていません"}
    return git_service.create_branch(name)


@router.post("/push")
def push(git_service: GitServiceDep):
    """現在のブランチをpush"""
    return git_service.push()


@router.post("/pr")
def create_pr(git_service: GitServiceDep, body: dict):
    """PRを作成"""
    title = body.get("title", "")
    pr_body = body.get("body", "")
    if not title:
        return {"success": False, "error": "タイトルが指定されていません"}
    return git_service.create_pr(title, pr_body)
