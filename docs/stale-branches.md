# Stale branches

The repository keeps only `main`, `changeset-release/main`, `feature/*`, `hotfix/0.N`, the branches of open pull requests and `screenshots` (`CLAUDE.md`). Sessions cannot delete branches, so the owner runs the workflow *Delete stale branches* (Actions tab, *Run workflow*).

- `.github/stale-branches.txt` is the list the workflow deletes. It checks each name again at run time and skips a kept name, a gone branch or one with an open pull request. A failure on one branch is logged and the run goes on; the summary lists deleted, skipped and failed.
- `.github/stale-branches-unmerged.txt` lists branches the owner decides about (no pull request, commits not in `main`, the version lines `0.*`). The workflow never reads it.
- Run it first with `dry_run` on (the default), read the summary, then run it again with `dry_run` off.
- To refresh the lists, ask a developer session to rebuild both from `git ls-remote --heads origin` and all pull requests, by the rules in the header of the first file, in a pull request into `main`.
