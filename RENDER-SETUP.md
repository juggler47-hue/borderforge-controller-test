# Publish the separate controller test

## First: GitHub

1. Sign in to GitHub and create a new repository named `borderforge-controller-test` under `juggler47-hue`.
2. Set it to Public. Leave the README, license and .gitignore additions off, then create it.
3. Extract the supplied ZIP on your computer. Open the extracted folder until you see `package.json`, `server.js`, `public` and `test` together.
4. On the new empty repository page, choose “uploading an existing file”. Drag the extracted files AND folders into the upload area. Upload the contents, not the ZIP or an enclosing folder.
5. Select “Commit changes”. Confirm the repository's first page shows `package.json`, `server.js`, `public` and `test`.
6. Send the repository link back for verification before proceeding to Render.

Your existing borderforge repository is not changed by these steps.

## Next: Render (after repository verification)

Choose New Web Service. Choose the public Git repository option and enter:
https://github.com/juggler47-hue/borderforge-controller-test

Use these settings:

| Setting | Value |
|---|---|
| Name | borderforge-controller-test (or another available name) |
| Language/runtime | Node |
| Branch | main |
| Root Directory | Leave blank |
| Build Command | npm test |
| Start Command | npm start |
| Instance Type | Free, if available |
| Health Check Path (advanced) | /health |

No database, secrets or environment variables are needed. This package has no external dependencies. If the screen differs or requests a paid plan, share a screenshot before continuing. Render's service name determines the actual public address; use the address Render gives you.

Reference: https://render.com/docs/web-services

## Test after deployment

1. Open the Render HTTPS address on the host computer.
2. Expand “Phone controller · connection test” and create a test room.
3. Open the displayed controller link on your phone and enter your name.
4. Press Send test signal. Confirm the host count increases.
5. Repeat with the phone temporarily on cellular data to verify the service works across networks. The phone is still physically with the host, watching its screen.

This is a connection test, not phone-controlled gameplay yet. Existing desktop multiplayer rooms and controller test rooms remain separate. Server restarts clear test rooms; simply create a new one.
