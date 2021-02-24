#!/usr/bin/env bash
set -e # halt script on error

FINAL_PATH=public

prepare_content() {
  echo "Preparing site content at: ${FINAL_PATH}"
  rm -rf e
  mkdir $FINAL_PATH
#  cp -a translations $FINAL_PATH
  cp -a site/* $FINAL_PATH
  cp -a dist $FINAL_PATH
}


# If this is the deploy branch, push it up to gh-pages
#echo "${DEPLOY_BRANCH}"
#echo "${GH_REF}"
#if [ $TRAVIS_PULL_REQUEST == "false" ] && [ $TRAVIS_BRANCH == ${DEPLOY_BRANCH} ]; then
  prepare_content
  #echo "Deploy to gh-pages"
  #cd $FINAL_PATH
  #git init
  #git config user.name "Github-CI"
  #git config user.email "actions@github.com"
  #git add .
  #git commit -m "CI deploy to gh-pages"
  #git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages
#else
#  echo "Not a publishable branch so we're all done here"
#fi
