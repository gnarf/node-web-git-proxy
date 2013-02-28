#!/bin/bash
if [ -f .lock ] 
then
        echo "Lock file in place, refusing to do anything"
        exit
fi
touch .lock
grunt cron
rm .lock
