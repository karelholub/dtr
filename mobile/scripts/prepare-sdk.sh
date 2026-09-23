#!/bin/bash
set -euo pipefail
mobile_root="$(cd "$(dirname "$0")/.." && pwd)"
sdk_revision=e417c45bfdd5c84ce3e09545c8c1536e3b5165da
sdk_path="$mobile_root/.build/MeiroSDK"
mkdir -p "$mobile_root/.build"
if [ ! -d "$sdk_path/.git" ]; then
  git clone --branch pipes https://github.com/meiroio/mobile_sdk_ios.git "$sdk_path"
fi
git -C "$sdk_path" cat-file -e "$sdk_revision^{commit}" 2>/dev/null || git -C "$sdk_path" fetch origin pipes
git -C "$sdk_path" checkout --detach "$sdk_revision"
printf 'Meiro SDK ready at %s\n' "$sdk_path"
for sdk_patch in "$mobile_root"/patches/*.patch; do
  if git -C "$sdk_path" apply --unidiff-zero --reverse --check "$sdk_patch" 2>/dev/null; then
    continue
  fi
  git -C "$sdk_path" apply --unidiff-zero --check "$sdk_patch"
  git -C "$sdk_path" apply --unidiff-zero "$sdk_patch"
done
