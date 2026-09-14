# Borderforge stage 2 — phone capital selection

The host can now assign each joined phone to a human commander. The phone shows only that commander's owned territories during capital selection. Choosing one updates the real game on the host. Other moves remain on the computer.

## Test steps

1. On the computer choose Local / Hot-Seat, Frontier Command, Quick Deploy, 1 human and at least 1 AI. Keep Scientific Breakthrough enabled (this enables capitals).
2. Create a room in the gold controller panel; join it on your phone.
3. Select Begin Deployment on the computer. Leave the map alone when it asks for a capital.
4. In the gold panel assign COMMANDER using the dropdown beside your phone name.
5. On the phone choose a capital territory. The phone confirms Capital established; the host map and game log update.
6. Continue other moves on the computer. With multiple humans, assign distinct commanders and confirm the game's existing handoff screens on the computer.

## Scope

Every original inline game script remains unchanged. The original is in test/fixtures/original-game.html. The bridge checks identity, ownership, phase, handoff and current-game tickets before calling the existing game action. The host retains control from the computer. Phones receive only their available capital choices.

Controller rooms remain separate from existing remote-computer rooms. Mixed remote computers and phones are not implemented yet. Online mode disables controller game actions; existing computer multiplayer remains available.

Assignments require renewal after host reload, game load/new game, or room closure. Phone refresh normally restores its identity through session storage. Rooms are in memory, expire after 30 minutes without host polling and disappear on server restart. Durable recovery is a later stage.

## Deploy and verification

Node 22 or newer. No external packages required. Build: npm test. Start: npm start. Health path: /health. Root Directory blank. Upload this package to the separate borderforge-controller-test repository.

Five automated checks pass, covering game-script preservation, room isolation and expiry, mailbox permissions, invalid territories, duplicate actions, stale games and handoff checks. Browser verification confirmed commander assignment, selection of Sector Z1 from the controller, confirmation in the host game log, and continued AI turns. Stage 2 still needs deployment and a physical phone test. Stage 1 was verified publicly across networks by the user.

## Setup recovery update
Phone setup opens visibly and has a header button. One phone plus one human commander is assigned automatically. Expired rooms clear the phone code and show recovery instructions while keeping the entered name. Use a different room lets the phone leave stale credentials. Temporary connection failures disable capital buttons while retrying. Rooms still do not survive server restarts. This update is locally tested, not yet published.

