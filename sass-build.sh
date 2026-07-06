#!/bin/sh
set -e  # Exit on error

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
# --no-source-map

# Remove --custom from arguments, rebuild $@
CUSTOM_FLAG=0
CUSTOM_SUBDOMAIN=""
ARGS=
for arg in "$@"; do
  if [ "$arg" = "--custom" ]; then
    CUSTOM_FLAG=1
  elif [ "${arg#--subdomain=}" != "$arg" ]; then
    CUSTOM_SUBDOMAIN="${arg#--subdomain=}"
  else
    ARGS="$ARGS \"$(printf '%s' "$arg" | sed 's/"/\\"/g')\""
  fi
done

# Reset positional parameters to ARGS (without --custom)
# shellcheck disable=SC2086
eval set -- $ARGS

if [ "$CUSTOM_FLAG" -eq 1 ]; then
  PAIRS=
  SEARCH_ROOT="app/assets/stylesheets/custom"
  if [ -n "$CUSTOM_SUBDOMAIN" ]; then
    SEARCH_ROOT="$SEARCH_ROOT/$CUSTOM_SUBDOMAIN"
  fi

  for f in "$SEARCH_ROOT"/*main*.scss; do
    [ -f "$f" ] || continue
    subd=$(basename "$(dirname "$f")")
    outdir="app/assets/builds/custom/$subd"
    outname=$(basename "${f%.scss}" | sed 's/_main//')
    mkdir -p "$outdir"
    PAIRS="$PAIRS \"$f\":\"$outdir/${outname}.css\""
  done

  if [ -z "$PAIRS" ]; then
    if [ -n "$CUSTOM_SUBDOMAIN" ]; then
      echo "No custom stylesheets found for subdomain: $CUSTOM_SUBDOMAIN" >&2
    else
      echo "No custom stylesheets found under app/assets/stylesheets/custom" >&2
    fi
    exit 0
  fi

  # shellcheck disable=SC2086
  eval sass $FLAGS $PAIRS "$@"
else
  # shellcheck disable=SC2086
  sass $FLAGS "$@"
fi