set -e
cd "$(dirname "$0")"
cut -d'|' -f2- en.src > en.txt
cd .. && node work/combine.mjs | tail -2 && node tools/assemble.mjs | tail -3 && node tools/build.mjs 2>&1 | grep -v '^\s*at ' | tail -15
