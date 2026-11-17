# Constellation Guardian

A seated WebXR cybersecurity game set in a fictional satellite network. In the **Broken Relay** mission, you investigate suspicious command traffic, isolate a compromised relay, and restore communications with Earth.

Built for the **Meta VR Start Developer Competition 2026** — Gaming track, New Experience division.

- [Play the hosted build](https://constellation-guardian.pages.dev/)
- [Watch the Broken Relay Mission in XR](https://youtu.be/pePrSeimrMI)

## The mission: Broken Relay

A cyberattack has compromised one of the five satellites, causing it to forward commands that fail verification. Identify and isolate the compromised relay, then activate a backup link so the remaining satellites can route data to the ground station. Send a test packet to confirm that communications have been restored.

## Quick Start

1. Click a satellite body to inspect its evidence. In XR, aim at the satellite and pinch.
2. Find the relay forwarding commands that failed verification. With that relay selected, choose **Isolate**.
3. Choose **Link D–E** to open the backup route.
4. Choose **Verify** and follow the gold test packet to Ground.
5. Choose **Restart** to replay the mission.

<details>
<summary>Judge walkthrough (spoiler)</summary>

1. Inspect **Satellite B**, the primary relay. Its evidence panel shows that command verification failed.
2. With **Satellite B** selected, choose **Isolate** to cut its primary links.
3. Choose **Link D–E** to activate the backup route.
4. Choose **Verify**. The gold test packet travels from **A → D → E → C → Ground**.
5. Choose **Restart** to reset the mission.

</details>

<img width="1428" height="1075" alt="constellation-guardian" src="https://github.com/user-attachments/assets/48e22cab-a5af-4ee4-aea8-9aca91916f6e" />

## Controls

| Mode | How to play |
| --- | --- |
| Desktop browser | Click a satellite body or a mission button. |
| Immersive XR | Aim a hand ray at a satellite or button and pinch to select it. |
| IWER desktop emulator | Open the local development preview, select **Enter XR**, and use the emulated hand controls to aim and pinch. |

The scene supports seated play. Text and visible network changes communicate the mission state, so audio is optional.

## Built with

- **Meta Immersive Web SDK (IWSDK)** for the XR scene and input.
- **Three.js** for the globe, satellite models, links, and packet animation.
- **TypeScript** for evidence, mission actions, and replay state.
- **IWER** for desktop XR emulation.
- **Vite** for development and production builds.
- **Cloudflare Pages** for the hosted build.

The game runs in the browser with a scripted, fictional scenario. It uses no live satellite systems, backend, or external AI service.

## Run locally

Use Node.js 24 and npm. From the repository root:

```powershell
npm.cmd ci
npm.cmd run dev:runtime
```

Open the local URL printed in the terminal. Use **Enter XR** in the development preview to test simulated hand interactions. On macOS or Linux, use `npm` in place of `npm.cmd`.

If IWSDK reports that the workspace already has a runtime, reuse the active preview or stop it with `npm.cmd run dev:down` before starting another.

## Build and preview

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
```

The production build is generated in `dist/`. Deploy that folder to a static HTTPS host to publish the game.

## Testing and build status

The original mission was tested in the desktop browser and in IWER with simulated hand input, including isolation, rerouting, packet delivery, and restarting inside XR. Physical Quest testing has not been verified.

The visual refresh adds a stylised Earth, a starfield, clearer satellite labels, selection highlights, and visible link states. The hosted link may show the earlier tested version until the visual refresh is verified and deployed.

## Credits

Built by Jyothi Srinivasan. The project started from Meta's Immersive Web SDK template. See the repository's `LICENSE` and attribution files for applicable notices.

## Hackathon

Constellation Guardian was built for the [Meta VR Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/) in the **Gaming** track, **New Experience** division.

[Play Constellation Guardian](https://constellation-guardian.pages.dev/)
