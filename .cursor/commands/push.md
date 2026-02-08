Push all previous work from the previous commit to Github in one command. Make sure that the commit message is detailed, but not too long. And the title is scannable.

IMPORTANT: Use `/usr/bin/git` instead of `git` to bypass Cursor's automatic co-author trailer injection. Cursor intercepts `git` commands and adds `--trailer "Co-authored-by: Cursor"` which causes git to error out since that flag doesn't exist.
