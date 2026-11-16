# Constellation Guardian

A seated WebXR cybersecurity game set in a fictional satellite network. In the **Broken Relay** mission, you investigate suspicious command traffic, isolate a compromised relay, and restore communications with Earth.

**[Play the hosted build](https://constellation-guardian.pages.dev/)**

Built for the **Meta VR Start Developer Competition 2026** — Gaming track, New Experience division.

## The mission: Broken Relay

The research satellite sends data to Earth through a chain of relays. One relay is forwarding commands that fail verification. Inspect the satellites, identify the source of the suspicious traffic, and contain it while keeping the ground station reachable.

1. **Inspect.** Select a satellite to read its command verification and traffic evidence.
2. **Contain.** Select the suspect relay and activate **Isolate** to cut its primary links.
3. **Restore.** Activate **Link D–E** to open the backup path. You can also activate this link before isolating the relay.
4. **Verify.** Send a gold test packet along the restored route and watch it reach the ground station.
5. **Restart.** Reset the mission and replay without leaving the scene.

The mission illustrates how incident containment and service recovery work together. Isolating the relay cuts the original route, so the backup link must be available for the test packet to reach Ground.

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
