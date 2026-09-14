# Borderforge — controller connection milestone

The original game is preserved in test/fixtures/original-game.html and at its original OneDrive location. public/index.html is the working game. All original inline game scripts remain unchanged, including desktop multiplayer, saves, AI and rules. Only the phone-specific setup style was removed; a separate controller test panel was added.

## Try the working copy

Run `npm start` with Node.js 22 or newer, then open http://localhost:3000 on the host computer. Open “Phone controller · connection test” at the bottom right and select “Create test room”. Open the displayed controller link on the second device, enter a name and press “Send test signal”. The host counter updates within about one second and flashes green. Close the room when finished. The host can keep playing the existing game during this test.

For local browser testing, open the controller link in another browser context. A localhost link works only on the computer running the server. For actual internet use, deploy this entire working folder as a Node web service; use its public HTTPS address on both devices. Opening index.html as a file still allows the original game, but cannot create an internet test room.

## Hosting handoff

No live service has been created or updated. No account credentials are included. If using the existing Render account, deploy the contents of this working folder to a Web Service: build command `npm install`, start command `npm start`, health path `/health`. The server listens on Render's PORT and 0.0.0.0. See https://render.com/docs/web-services . A static-only host such as GitHub Pages cannot run this room server.

## Scope and limits

- Remote players use computers with the full game. In-room phones use controller.html while watching the TV.
- This milestone's test rooms are separate from the existing desktop multiplayer rooms. Phones are not assigned game seats yet. Combining the room systems and connecting validated game actions are later milestones.
- The original PeerJS desktop multiplayer remains available. It is not yet migrated to the new room service and may still encounter restrictive network issues.
- The new test transport uses normal HTTP requests to a central service; no direct device-to-device connection or same-Wi-Fi requirement. Polling updates the host roughly once per second.
- Rooms live in memory on one server instance, expire after 30 minutes without a host poll, and disappear when the service restarts. Keep the host tab open. Refreshing a tab restores its room credentials from session storage when available.
- This is a bounded family prototype (500 rooms, 12 controllers per room), not a production public matchmaking service. Real phone, cross-network and public HTTPS checks remain required after deployment.
- No recent change history or previous Render configuration was supplied, so removal decisions were based only on this file. Broad screen-size rules and touch/map controls were preserved because their purpose and history cannot safely be inferred.

## Verification

`npm test` checks room creation, joining, host receipt, room isolation, permission boundaries, duplicate actions, closing, expiry, and preservation/parsing of every original inline game script.

Browser verification: host created a room, separate controller page joined as Family test and sent a signal, and host visibly displayed Signals received: 1. The existing game then started and rendered its map while the room stayed open. This was a local browser test, not a physical phone or public internet test.

