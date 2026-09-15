# Borderforge — reinforcement and attack controller preview

## What phones can do

Choose a capital, select a friendly territory and reinforcement amount, choose a legal source/target attack pair, confirm one combat round, choose how many armies advance after capture, finish attacking, and end the turn. All orders are checked again against the game on the host computer. Invalid, stale, duplicate, out-of-turn and truce-protected orders are rejected.

The shared board stays on the computer/TV. One phone and one human commander are assigned automatically. With multiple humans, assign each phone using Phone setup. Confirm hot-seat handoff screens on the computer. Fortification moves, cards, diplomacy and other special dialogs still use the computer. Remote-computer multiplayer and phone rooms remain separate in this preview.

## Start

Open the Render game, select Local / Hot-Seat and your game settings. Use Phone setup > Connect a phone. Join from the displayed link. Start game with current settings is available inside Phone setup. Use the phone's action list when it is your commander's turn. Each order has a confirmation and Cancel button.

The phone accepts formatted room codes and full invitation links. Rooms still disappear when the service restarts. A closed room requires a new code. Host reload/new game requires commander reassignment; durable host recovery is not implemented.

## Publish this preview

Upload all extracted contents to juggler47-hue/borderforge-controller-test. In its existing Render service select Manual Deploy > Deploy latest commit. Keep Build Command npm test, Start Command npm start, Root Directory blank, and health path /health. Refresh both host and phone after deployment. Do not upload this to the original borderforge repository or itch.io yet.

## Verification

Seven automated checks pass: preservation/parsing of original game scripts, room lifecycle and isolation, action-mailbox permissions, input normalization, identity and stale-action guards, reinforcement bounds, adjacency/truce filtering, post-capture advance bounds, and phase progression. Automated turn tests use a simulated game state and stubbed combat routines; they do not replace real-game combat verification.

Real browser testing confirmed capital selection, placement of five reinforcements on Sector Z1, and transition to the attack phase. A legal attack was selected and submitted, but browser-session reset interrupted inspection of its outcome. Full real-game attack/capture/end-turn verification and physical-phone testing of this preview remain outstanding. This preview has not been deployed.

Every original inline game script is preserved; the bridge calls existing game functions. Original game backup: test/fixtures/original-game.html. Run locally with Node 22 or newer and npm start. No external packages required.

Packaging correction: all runtime files and tests now live at the repository root. Upload every file in this package at that level. The server serves only explicitly allowed game assets. Older public and test folders may remain; the new server and explicit test command do not use them. Original backup is original-game.html. All seven automated checks pass with this layout.


## Phone map and advisor update
The phone now displays a simplified node map with real territory positions, connections, ownership colors, army counts, capital stars, zoom controls and scrolling. Tap your territory to select a reinforcement/capital control; for attacks tap your source then a highlighted target. Map selection scrolls to the existing text control and still requires explicit confirmation. Text controls remain available.
The current player's existing getNextMove recommendation is shown with its reason. Review recommended move selects a matching legal phone action and suggested reinforcement amount; unsupported advisor actions explicitly remain on the computer. This is a schematic map, not the desktop's geographic polygon rendering. Original inline game scripts are preserved.


Map/advisor verification: all nine automated checks passed. Real-browser test displayed the map, selected Sector Z1 via the map, confirmed its capital, displayed the real recommendation to reinforce it by three armies, and verified Review recommended move filled the amount as 3. Physical phone layout remains to be verified after deployment. This update has not been published.

