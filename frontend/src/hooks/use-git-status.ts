import { useCallback, useState } from "react";
import type { GitBadgeStatus } from "../components/molecules/git-status-badge/git-status-badge";
import type { GitCheckResult } from "../types/messages";

export function useGitStatus() {
  const [gitStatus, setGitStatus] = useState<GitBadgeStatus>("checking");
  const [gitBranch, setGitBranch] = useState("");

  const checkGitStatus = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/git/check");
      const data: GitCheckResult = await response.json();
      const { gh_status: gh, repo_info: repo } = data;

      if (gh.gh_installed && gh.gh_authenticated && gh.git_repo) {
        setGitStatus("ok");
        setGitBranch(repo?.current_branch || "?");
      } else if (gh.gh_installed) {
        setGitStatus("warn");
      } else {
        setGitStatus("error");
      }

      // Return detail text for chat display
      const lines: string[] = [];
      lines.push(`gh installed: ${gh.gh_installed ? "OK" : "NG"}`);
      lines.push(`gh authenticated: ${gh.gh_authenticated ? "OK" : "NG"}`);
      lines.push(`git repo: ${gh.git_repo ? "OK" : "NG"}`);
      if (gh.errors.length > 0) {
        lines.push(`errors: ${gh.errors.join(", ")}`);
      }
      if (repo) {
        lines.push(`remote: ${repo.remote_url}`);
        lines.push(`branch: ${repo.current_branch}`);
      }
      return lines.join("\n");
    } catch {
      setGitStatus("error");
      return null;
    }
  }, []);

  return { gitStatus, gitBranch, checkGitStatus };
}
