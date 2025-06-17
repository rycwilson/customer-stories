#!/bin/sh

FLAGS="
  --load-path=node_modules
  --load-path=app/assets/stylesheets
  --load-path=vendor/assets/stylesheets
  --style=compressed
  --silence-deprecation=import
  --silence-deprecation=global-builtin
  --silence-deprecation=color-functions
  --silence-deprecation=slash-div
  --silence-deprecation=mixed-decls
"

if [ "$1" = "--custom" ]; then
  shift
  for f in app/assets/stylesheets/custom/*/*main*.scss; do
    subd=$(basename "$(dirname "$f")")
    outname=$(basename "${f%.scss}" | sed 's/_main//')
    sass $FLAGS "$f" "app/assets/builds/custom/$subd/${outname}.css" "$@"
  done
else
  sass $FLAGS "$@"
fi