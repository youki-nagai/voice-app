from fastapi import APIRouter
from pydantic import BaseModel

from app.dependencies import GitServiceDep

router = APIRouter()


class BranchRequest(BaseModel):
    name: str


class PrRequest(BaseModel):
    title: str
    body: str = ""


@router.get("/check")
def check_gh_command(git_service: GitServiceDep):
    gh_status = git_service.check_gh_command()
    repo_info = git_service.get_repo_info()
    return {"gh_status": gh_status, "repo_info": repo_info}


@router.get("/status")
def get_status(git_service: GitServiceDep):
    return git_service.get_status()


@router.get("/log")
def get_log(git_service: GitServiceDep):
    return {"log": git_service.get_log()}


@router.post("/branch")
def create_branch(git_service: GitServiceDep, req: BranchRequest):
    if not req.name:
        return {"success": False, "error": "ブランチ名が指定されていません"}
    return git_service.create_branch(req.name)


@router.post("/push")
def push(git_service: GitServiceDep):
    return git_service.push()


@router.post("/pr")
def create_pr(git_service: GitServiceDep, req: PrRequest):
    if not req.title:
        return {"success": False, "error": "タイトルが指定されていません"}
    return git_service.create_pr(req.title, req.body)
