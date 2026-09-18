# Border Forge — visual phone controller and blitz

This preview keeps the full game on the computer/TV. Phones control local human commanders. Remote computer multiplayer is still separate.

## Install
Extract this ZIP. Upload all enclosed files to the root of your existing borderforge-controller-test GitHub repository. Commit, then deploy the latest commit in its existing Render service. Keep the current settings (build: npm test; start: npm start). Refresh both computer and phone after deployment.

## Solo test
1. Computer: Local / Hot-Seat, one human, one AI, Frontier Command, Quick Deploy. Disable Guided first-game tutorial for this controller test.
2. Phone setup > Connect a phone. Join the room on your phone, then start the game on the computer.
3. The phone should show the actual battlefield. Tap a friendly territory to choose your capital or place armies. Use Zoom in if needed; landscape gives more room.
4. During attacks, tap your territory and then a highlighted enemy. Choose Attack one round or Blitz until exhausted, then confirm.
5. Blitz uses the same routine as the desktop button: it stops at capture, attacker exhaustion, or the existing safety limit. It can consume your attacking force.
6. After a single round, the same legal attack remains selected. After capture, choose the number of armies to advance.
7. Finish attacking and end your turn. Fortification, handoff screens and special dialogs still require the computer.

The original game rules and inline scripts are unchanged. This is a controller preview, not a finished phone-only game. Rooms do not survive service restarts.

## Checks
Automated checks cover existing game-script preservation, room permissions, legal actions, stale commands, map selection, advisor matching, and the original desktop blitz loop under controlled capture/exhaustion scenarios. Real-device phone testing remains necessary.

Browser verification: actual board rendered; map capital selection, seven reinforcements, phase transition, five-round blitz capture, and retained single-round attack selection succeeded. Blitz retains the desktop game's automatic movement behavior when it resolves capture without a separate advance prompt. Physical-phone testing remains.

Also verified: finish attacking, end turn, AI turn, and return to human reinforcements. All 12 automated checks pass.

Version identification: phone page and computer Phone setup show MAP + BLITZ — v2. If that label is missing, the old files are still being served. Upload all 18 files from this package to the repository root, not the older Borderforge-upload-fix package.

