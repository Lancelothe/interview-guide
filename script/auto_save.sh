#!/bin/bash
PWD=`pwd`
DIR_NAME=$(dirname "$PWD") 
cd $DIR_NAME
git add .
git commit -m "update"
git push -u origin master

