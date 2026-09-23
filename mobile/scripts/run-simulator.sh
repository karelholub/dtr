#!/bin/bash
set -euo pipefail
mobile_root="$(cd "$(dirname "$0")/.." && pwd)"
"$mobile_root/scripts/prepare-sdk.sh"
simulator_id="${DTR_SIMULATOR_ID:-B6D4BB94-26A1-4677-A060-1F873094B759}"
derived_path="$mobile_root/.build/DerivedData"
xcrun simctl boot "$simulator_id" 2>/dev/null || true
xcrun simctl bootstatus "$simulator_id" -b
xcodebuild -project "$mobile_root/DERTOURDemo.xcodeproj" -scheme DERTOURDemo -configuration Debug -destination "platform=iOS Simulator,id=$simulator_id" -derivedDataPath "$derived_path" CODE_SIGNING_ALLOWED=NO build
xcrun simctl install "$simulator_id" "$derived_path/Build/Products/Debug-iphonesimulator/DERTOURDemo.app"
xcrun simctl launch "$simulator_id" de.dertour.demo
# Xcode 27 uses DeviceHub; older Xcode versions provide Simulator.app.
if [ -d /Applications/Xcode.app/Contents/Applications/DeviceHub.app ]; then
  open /Applications/Xcode.app/Contents/Applications/DeviceHub.app
else
  open "$(xcode-select -p)/Applications/Simulator.app"
fi
