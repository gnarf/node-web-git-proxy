#!/bin/bash
git archive $1 | tar -x -C $2
