#!/bin/bash
set -e
set -x
bare=$(pwd)
sha=$1
dest=$2
ref=$3

if [ -d $dest ]
then
	if [ ! -d $dest/.git ]
	then
		rm -rf $dest
		git clone $bare $dest
		# trim extra refs
		git for-each-ref --format="%(refname) %(objectname)" refs/heads | { while read entry ; do git update-ref -d $entry ; done }
	fi
else
	git clone $bare $dest
	# trim extra refs
	git for-each-ref --format="%(refname) %(objectname)" refs/heads | { while read entry ; do git update-ref -d $entry ; done }
fi
cd $dest
git fetch -fup origin $ref:$ref
git checkout --force $sha
git reset --hard $sha
git submodule update --init || echo "Problem updating submodules, ignoring..."
