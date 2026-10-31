// The environment for git in a repository a script makes for itself. Git gives its hooks the variables that point a
// command at a repository (GIT_DIR, GIT_INDEX_FILE, GIT_WORK_TREE …; in a worktree always), so a check run from the
// pre-push hook would otherwise init, add and commit in the repository being pushed instead of its own.
import { execFileSync } from 'node:child_process';

// The variables, as this git names them.
const local = execFileSync('git', ['rev-parse', '--local-env-vars'], { encoding: 'utf8' }).split('\n').filter(Boolean);

export const ownRepoEnv = (env = process.env) => Object.fromEntries(Object.entries(env).filter(([name]) => !local.includes(name)));
