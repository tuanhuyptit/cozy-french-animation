set -e
node work/combine.mjs && node tools/assemble.mjs | tail -3 && node tools/build.mjs 2>&1 | tail -30
