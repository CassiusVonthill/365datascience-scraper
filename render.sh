#!/bin/bash

# This is a sample file for running youtube-dl to download the videos
# while also properly naming everything
COURSES_DIR=courses

for file in course_urls/*
do
    F="${file##*/}"
    NAME="${F%.*}"

    MODULE="Module-$(cut -d '-' -f 1 <<< $NAME)"
    COURSE="$(cut -d '-' -f 2- <<< $NAME)"
    MODULE_DIR=$COURSES_DIR/$MODULE

    ./youtube-dl -ic -o "${MODULE_DIR}/${COURSE}/%(autonumber)s-%(title)s" -a $file
done
