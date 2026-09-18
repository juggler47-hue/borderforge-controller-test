# Border Forge: MAP + BLITZ + FORTIFY — v3

Upload ALL 19 files inside this package to the root of your existing borderforge-controller-test repository, commit, and deploy the latest commit in Render. Keep the existing settings. Refresh both computer and phone. Check that the phone displays MAP + BLITZ + FORTIFY — v3 before joining a new room.

Keep your v2 ZIP as the previous working checkpoint.

## Fortify from your phone
1. Finish attacking to enter the Fortify phase.
2. Tap one of your territories with at least two armies.
3. Tap a highlighted friendly destination. Destinations may be reached through a continuous chain of your territories.
4. Enter how many armies to move. At least one army must remain at the source.
5. Choose Move armies & end turn, then confirm. Cancel lets you reconsider.

Review recommended move selects the advisor's source, destination, and suggested army count; you may change the count before confirming.

The game allows ONE fortification per turn. A successful move automatically ends your turn, just as on the computer. End turn without fortifying remains available if you prefer to skip movement.

The host uses the game's existing movement routine, including proportional specialist movement, legality checks, and turn handling. Core game scripts are unchanged. Special dialogs still require the computer. Phones remain same-room controllers in Local / Hot-Seat mode; remote computer multiplayer remains separate.

## Verification
All 14 automated checks pass. New checks use the actual game's pathfinding and fortification routine, covering connected paths, disconnected/enemy destinations, army bounds, stale/duplicate orders, advisor quantities and one move per turn.
Browser testing verified friendly destination highlighting, advisor prefill of nine armies, changing that to four, actual movement from Sector A1 to Province G1, and automatic transition to the AI turn. Physical-phone testing remains.
