#!/bin/bash
bare=$(pwd)
dest=$2
sha=$1

if [ -d $dest ]
then
	if [ ! -d $dest/.git ]
	then
		rm -rf $dest
		git clone $bare $dest
	fi
else
	git clone $bare $dest
fi
cd $dest
git fetch
git checkout --force $sha
git reset --hard $sha
git submodule update --init
