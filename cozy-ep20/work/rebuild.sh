set -e
cd "$(dirname "$0")/.."
node work/extras.mjs | tail -1 && node work/combine.mjs | tail -1 && node tools/assemble.mjs 2>&1 | tail -1 && node tools/build.mjs 2>&1 | grep -v '^\s*at ' | tail -30
