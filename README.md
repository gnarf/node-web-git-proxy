Node Web Git Proxy
==================

This is a tool written with node.js to keep a directory up to date and checked out with the current versions on the remote server.

You must create a `config.json` with at least a `repo` which points to a git repo, and a `title` which is used in the display.  You may also change the output directory with `output` and the repo working area with `working`. The deleteTags option decides wether to delete missing or currupted tags or to leave them.

At that point, if you `grunt` it should clone the remote repo and start setting up a folder for each brach and tag.

If you create a file called `build-command.sh` it will be executed in the directory for each branch and tag after it is updated.

A `cron.sh` is provided to run `grunt cron` and surround it in a `.lock` check.
