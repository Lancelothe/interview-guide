#!/bin/bash

PWD="$( cd "$( dirname "$0"  )" && pwd  )"
DIR=$(dirname "$PWD") 
cd $DIR
git add .
git commit -m "update"
git push -u origin master

