/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  World,
  createSystem,
  Hovered,
  Pressed,
  RayInteractable,
} from '@iwsdk/core';

import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  CanvasTexture,
  CylinderGeometry,
  Group,
  Points,
  PointsMaterial,
  TorusGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';

import projectOptions from 'virtual:iwsdk-project';

// A shared callback lets the interaction system update our scene panel.
let inspectSatellite: (id: string) => void = () => {};
let updatePacket: () => void = () => {};
class SatelliteSelectionSystem extends createSystem({
  hovered: { required: [RayInteractable, Hovered] },
  selected: { required: [RayInteractable, Pressed] },
}) {
  update(): void {
    updatePacket();
  }
  init(): void {
    const setHoverColor = (object: unknown, color: number) => {
      if (
        object instanceof Mesh &&
        object.material instanceof MeshStandardMaterial &&
        typeof object.userData.satelliteId === 'string'
      ) {
        object.material.color.setHex(color);
      }
    };

    this.queries.hovered.subscribe('qualify', (entity) => {
      entity.object3D?.userData.setHover?.(true);
      setHoverColor(entity.object3D, 0xffbf47);
    });

    this.queries.hovered.subscribe('disqualify', (entity) => {
      entity.object3D?.userData.setHover?.(false);
      setHoverColor(entity.object3D, 0xdce6ed);
    });

    this.queries.selected.subscribe('qualify', (entity) => {
      const action = entity.object3D?.userData.action;
      if (typeof action === 'function') {
        action();
        return;
      }
      const id = entity.object3D?.userData.satelliteId;
      if (typeof id === 'string') {
        inspectSatellite(id);
      }
    });
  }
}

// Text is drawn onto a texture so it remains part of the 3D scene in XR.
function makePanel(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = Math.round(1536 * height / width);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create panel canvas');
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;

  const mesh = new Mesh(
    new PlaneGeometry(width, height),
    new MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    }),
  );

  const ctx = context;
  function write(title: string, lines: string[], accent = '#6ff5db', highlighted = false) {
    const w = canvas.width;
    const h = canvas.height;
    const background = ctx.createLinearGradient(0, 0, w, h);
    background.addColorStop(0, highlighted ? '#314f55' : '#192e3a');
    background.addColorStop(1, '#0c161f');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = highlighted ? 14 : 5;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 12);

    const compact = height / width > 0.22 && lines.length <= 1 && width < 0.7;
    ctx.textBaseline = 'middle';
    if (compact) {
      ctx.textAlign = 'center';
      ctx.font = '700 170px Arial';
      ctx.fillText(title, w / 2, h * (lines.length ? 0.34 : 0.50), w - 100);
      ctx.font = '700 100px Arial';
      ctx.fillStyle = '#eff8ff';
      if (lines[0]) ctx.fillText(lines[0], w / 2, h * 0.72, w - 100);
    } else {
      ctx.textAlign = 'left';
      ctx.font = '700 75px Arial';
      ctx.fillText(title, 48, 68, w - 96);
      ctx.font = '54px Arial';
      ctx.fillStyle = '#eff8ff';
      lines.forEach((line, index) => {
        ctx.fillText(line, 48, 149 + index * 74, w - 96);
      });
    }
    texture.needsUpdate = true;
  }

  return { mesh, write };
}

const satelliteDefinitions = [
  {
    id: 'A',
    name: 'Research satellite',
    position: [-0.86, 1.55, -2.05],
    evidence: [
      'Collects research data for the ground station.',
      'Command verification: passed.',
      'Outbound traffic follows the mission schedule.',
    ],
  },
  {
    id: 'B',
    name: 'Primary relay',
    position: [0, 1.95, -2.15],
    evidence: [
      'Forwards commands along the primary route.',
      'Latest command verification: FAILED.',
      'Unexpected forwarding burst detected.',
    ],
  },
  {
    id: 'C',
    name: 'Downlink satellite',
    position: [0.86, 1.55, -2.05],
    evidence: [
      'Delivers mission data to the ground station.',
      'Local command verification: passed.',
      'Received unusual traffic from relay B.',
    ],
  },
  {
    id: 'D',
    name: 'Backup relay west',
    position: [-0.65, 0.85, -1.8],
    evidence: [
      'Available for an alternative communication route.',
      'Command verification: passed.',
      'Connection to backup relay E is not established.',
    ],
  },
  {
    id: 'E',
    name: 'Backup relay east',
    position: [0.65, 0.85, -1.8],
    evidence: [
      'Available for an alternative communication route.',
      'Command verification: passed.',
      'Standing by to forward data to satellite C.',
    ],
  },
];

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  world.registerSystem(SatelliteSelectionSystem);

  const markers = new Map<string, Mesh>();
  const labels = new Map<string, ReturnType<typeof makePanel>>();
  const positions = new Map<string, Vector3>();

  // A procedural mission globe keeps the build self-contained.
  const atlas = document.createElement('canvas');
  atlas.width = 1024;
  atlas.height = 512;
  const paint = atlas.getContext('2d')!;
  const ocean = paint.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, '#3c9abc');
  ocean.addColorStop(0.5, '#123f6a');
  ocean.addColorStop(1, '#31758d');
  paint.fillStyle = ocean;
  paint.fillRect(0, 0, 1024, 512);
  paint.fillStyle = '#3ba99a';
  paint.strokeStyle = '#89e9c9';
  paint.lineWidth = 2;
  const land = [
    [[78,96],[145,55],[245,67],[290,105],[262,144],[216,158],[202,197],[168,221],[156,184],[114,162]],
    [[196,216],[251,229],[291,271],[267,321],[245,363],[207,421],[189,363],[175,299],[180,254]],
    [[417,114],[454,76],[549,64],[648,88],[735,65],[844,86],[897,115],[832,155],[794,188],[738,191],[704,234],[659,224],[634,184],[576,162],[538,177],[509,149],[452,156]],
    [[443,174],[509,171],[565,219],[547,277],[511,343],[468,354],[440,298],[416,228]],
    [[742,321],[791,285],[860,296],[893,337],[870,377],[799,394],[751,358]],
    [[272,58],[323,31],[368,47],[354,91],[311,117],[281,99]],
    [[628,271],[660,269],[692,285],[724,280],[750,300],[711,309],[662,297]],
  ];
  for (const outline of land) {
    paint.beginPath();
    outline.forEach(([x, y], i) => i === 0 ? paint.moveTo(x, y) : paint.lineTo(x, y));
    paint.closePath();
    paint.fill();
    paint.stroke();
  }
  paint.strokeStyle = '#acecff44';
  for (let x = 0; x < 1024; x += 64) {
    paint.beginPath(); paint.moveTo(x, 0); paint.lineTo(x, 512); paint.stroke();
  }
  for (let y = 32; y < 512; y += 64) {
    paint.beginPath(); paint.moveTo(0, y); paint.lineTo(1024, y); paint.stroke();
  }
  const globeTexture = new CanvasTexture(atlas);
  globeTexture.colorSpace = SRGBColorSpace;
  const globe = new Mesh(
    new SphereGeometry(0.39, 48, 32),
    new MeshStandardMaterial({ map: globeTexture, roughness: 0.85, emissive: 0x243b51 }),
  );
  globe.position.set(0, 1.31, -2.24);
  world.createTransformEntity(globe, { persistent: true });

  const rim = new Mesh(
    new TorusGeometry(0.405, 0.008, 8, 72),
    new MeshBasicMaterial({ color: 0x51cfe4, transparent: true, opacity: 0.55 }),
  );
  rim.position.copy(globe.position);
  world.createTransformEntity(rim, { persistent: true });

  const starPositions: number[] = [];
  for (let i = 1; i <= 330; i++) {
    starPositions.push(
      22 * (Math.sin(i * 17.13) * 0.5),
      14 * (Math.cos(i * 5.17) * 0.5) + 1.5,
      -9 - (i % 13),
    );
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new Float32BufferAttribute(starPositions, 3));
  world.createTransformEntity(
    new Points(starGeometry, new PointsMaterial({ color: 0x8aaec9, size: 0.032, transparent: true, opacity: 0.65 })),
    { persistent: true },
  );

  // A low mission platform provides visual depth.
  const platform = new Mesh(
    new CylinderGeometry(1.12, 1.2, 0.06, 64),
    new MeshStandardMaterial({
      color: 0x202b35,
      metalness: 0.5,
      roughness: 0.55,
    }),
  );
  platform.position.set(0, 0.10, -2.1);
  world.createTransformEntity(platform, { persistent: true });

  const inspection = makePanel(1.65, 0.47);
  inspection.mesh.position.set(0, 0.60, -1.38);
  inspection.mesh.rotation.x = -0.25;
  const showBriefing = () => inspection.write('MISSION / BROKEN RELAY', [
    'Find the relay forwarding suspicious commands.',
    'Contain it and restore a safe route to Ground.',
    'Desktop: click   /   XR: aim and pinch',
  ]);
  showBriefing();
  world.createTransformEntity(inspection.mesh, { persistent: true });

  const title = makePanel(1.8, 0.3);
  title.mesh.position.set(0, 2.48, -2.35);
  title.write('CONSTELLATION GUARDIAN', ['INSPECT  >  CONTAIN  >  RESTORE']);
  world.createTransformEntity(title.mesh, { persistent: true });

  let relayIsolated = false;

  satelliteDefinitions.forEach((satellite) => {
    const position = new Vector3(...satellite.position);
    positions.set(satellite.id, position);

    const bodyMaterial = new MeshStandardMaterial({
      color: 0xdce6ed,
      roughness: 0.4,
      metalness: 0.55,
      emissive: 0x000000,
    });


    // The body is the selectable entity. Its wings are children.
    const body = new Mesh(
      new BoxGeometry(0.19, 0.19, 0.17),
      bodyMaterial,
    );
    body.position.copy(position);
    body.userData.satelliteId = satellite.id;

    const wingMaterial = new MeshStandardMaterial({
      color: 0x186a86,
      metalness: 0.4,
      roughness: 0.45,
    });

    for (const side of [-1, 1]) {
      const wing = new Mesh(
        new BoxGeometry(0.2, 0.12, 0.025),
        wingMaterial,
      );
      wing.position.x = side * 0.21;
      body.add(wing);
      const cellMaterial = new MeshBasicMaterial({ color: 0x5296df, toneMapped: false });
      const cellGeometry = new PlaneGeometry(0.038, 0.04);
      for (let column = 0; column < 4; column++) {
        for (const y of [-0.026, 0.026]) {
          const cell = new Mesh(cellGeometry, cellMaterial);
          cell.position.set((column - 1.5) * 0.046, y, 0.013);
          wing.add(cell);
        }
      }
    }

    world.createTransformEntity(body, { persistent: true }).addComponent(RayInteractable);

    const label = makePanel(0.48, 0.15);
    label.write(`SAT ${satellite.id}`, [satellite.name.toUpperCase()]);
    label.mesh.position.copy(position);
    label.mesh.position.y += 0.21;
    label.mesh.userData.satelliteId = satellite.id;
    label.mesh.userData.setHover = (hovered: boolean) => {
      const isolated = satellite.id === 'B' && relayIsolated;
      label.write(`SAT ${satellite.id}`, [isolated ? 'ISOLATED' : satellite.name.toUpperCase()],
        hovered || isolated ? '#ffd166' : '#6ff5db', hovered);
    };
    world.createTransformEntity(label.mesh, { persistent: true }).addComponent(RayInteractable);
    labels.set(satellite.id, label);

    const marker = new Mesh(
      new TorusGeometry(0.138, 0.008, 8, 40),
      new MeshBasicMaterial({ color: 0x6ff5db, toneMapped: false }),
    );
    marker.position.copy(position).add(new Vector3(0, 0, 0.10));
    marker.visible = false;
    markers.set(satellite.id, marker);
    world.createTransformEntity(marker, { persistent: true });

    const beacon = new Mesh(new SphereGeometry(0.019, 10, 8),
      new MeshBasicMaterial({ color: 0x7feaff, toneMapped: false }));
    beacon.position.set(0, 0.06, 0.09);
    body.add(beacon);
  });

  function addLink(from: Vector3, to: Vector3, color: number, dashed = false) {
    const group = new Group();
    const direction = to.clone().sub(from);
    const length = direction.length();
    const segments = dashed ? 10 : 1;
    const material = new MeshBasicMaterial({
      color,
      toneMapped: false,
      transparent: dashed,
      opacity: dashed ? 0.6 : 1,
    });
    for (let i = 0; i < segments; i++) {
      const segment = new Mesh(
        new CylinderGeometry(dashed ? 0.004 : 0.007, dashed ? 0.004 : 0.007,
          length / segments * (dashed ? 0.52 : 1), 8),
        material,
      );
      segment.position.lerpVectors(from, to, (i + 0.5) / segments);
      segment.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
      group.add(segment);
    }
    world.createTransformEntity(group, { persistent: true });
    return group;
  }

  // Primary route and incomplete backup route.
  const links = [
    ['A', 'B'],
    ['B', 'C'],
    ['A', 'D'],
    ['E', 'C'],
  ];

  const linkMeshes = new Map<string, Group>();

  links.forEach(([from, to]) => {
    linkMeshes.set(
      `${from}-${to}`,
      addLink(positions.get(from)!, positions.get(to)!, 0x51dec9),
    );
  });

  // Ground station sits to the right of the constellation.
  const groundPosition = new Vector3(1.18, 0.77, -1.85);
  const station = new Group();
  station.position.copy(groundPosition);

  const base = new Mesh(
    new BoxGeometry(0.18, 0.12, 0.18),
    new MeshStandardMaterial({ color: 0xe1aa63 }),
  );
  station.add(base);

  const antenna = new Mesh(
    new CylinderGeometry(0.012, 0.012, 0.2, 12),
    new MeshStandardMaterial({ color: 0xdce6ed }),
  );
  antenna.position.y = 0.14;
  station.add(antenna);
  world.createTransformEntity(station, { persistent: true });

  addLink(positions.get('C')!, groundPosition, 0xe1aa63);

  const dish = new Mesh(
    new SphereGeometry(0.078, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new MeshStandardMaterial({ color: 0xcddfed, roughness: 0.55 }),
  );
  dish.scale.y = 0.4;
  dish.rotation.z = Math.PI + 0.35;
  dish.position.set(0, 0.24, 0);
  station.add(dish);

  const groundLabel = makePanel(0.50, 0.16);
  groundLabel.write('GROUND', ['AWAITING TEST']);
  groundLabel.mesh.position.set(1.18, 1.08, -1.85);
  world.createTransformEntity(groundLabel.mesh, { persistent: true });

  const backupLink = addLink(positions.get('D')!, positions.get('E')!, 0x51dec9);
  const dormantLink = addLink(positions.get('D')!, positions.get('E')!, 0x89a9c4, true);
  backupLink.visible = false;

  let selectedId = '';
  const packet = new Mesh(
    new SphereGeometry(0.035, 16, 12),
    new MeshBasicMaterial({ color: 0xffd166, toneMapped: false }),
  );
  packet.visible = false;
  world.createTransformEntity(packet, { persistent: true });

  const packetRoute = [
    positions.get('A')!,
    positions.get('D')!,
    positions.get('E')!,
    positions.get('C')!,
    groundPosition,
  ];
  const hopDurationMs = 650;
  let packetStartedAt: number | null = null;

  updatePacket = () => {
    if (packetStartedAt === null) return;

    const progress = (performance.now() - packetStartedAt) / hopDurationMs;
    const hop = Math.floor(progress);

    if (hop >= packetRoute.length - 1) {
      packetStartedAt = null;
      packet.visible = false;
      groundLabel.write('GROUND', ['PACKET RECEIVED']);
      base.material.emissive.setHex(0x1c725d);
      inspection.write('COMMUNICATIONS RESTORED', [
        'Relay B is isolated.',
        'Test packet arrived: A > D > E > C > Ground',
      ]);
      return;
    }

    packet.position.lerpVectors(packetRoute[hop], packetRoute[hop + 1], progress - hop);
  };

  function addAction(label: string, x: number, action: () => void) {
    const button = makePanel(0.36, 0.14);
    button.write(label, []);
    button.mesh.position.set(x, 0.30, -1.30);
    button.mesh.userData.action = action;
    button.mesh.userData.setHover = (hovered: boolean) => {
      button.write(label, [], hovered ? '#ffd166' : '#6ff5db', hovered);
    };
    world.createTransformEntity(button.mesh, { persistent: true })
      .addComponent(RayInteractable);
  }

  addAction('Isolate', -0.60, () => {
    if (selectedId !== 'B') {
      inspection.write('SELECT RELAY B', ['Inspect B, then choose Isolate.']);
      return;
    }

    relayIsolated = true;
    labels.get('B')!.write('SAT B', ['ISOLATED'], '#ffc36e');
    linkMeshes.get('A-B')!.visible = false;
    linkMeshes.get('B-C')!.visible = false;
    inspection.write('RELAY B ISOLATED', [
      backupLink.visible ? 'Backup link ready. Verify the route.' : 'Activate the D-E backup link.',
    ]);
  });

  addAction('Link D-E', -0.20, () => {
    backupLink.visible = true;
    dormantLink.visible = false;
    inspection.write('BACKUP LINK ACTIVE', [
      relayIsolated ? 'Verify the route to Ground.' : 'Inspect and isolate relay B.',
    ]);
  });

  addAction('Verify', 0.20, () => {
    if (!relayIsolated) {
      inspection.write('CONTAINMENT REQUIRED', ['Relay B still has active links.']);
      return;
    }

    if (!backupLink.visible) {
      inspection.write('GROUND UNREACHABLE', ['Activate the D-E backup link.']);
      return;
    }

    if (packetStartedAt !== null) return;

    packet.position.copy(packetRoute[0]);
    packet.visible = true;
    packetStartedAt = performance.now();
    groundLabel.write('GROUND', ['AWAITING TEST']);
    base.material.emissive.setHex(0x000000);

    inspection.write('TEST PACKET IN TRANSIT', [
      'Follow the gold packet to the ground station.',
    ], '#ffd166');
  });

  addAction('Restart', 0.60, () => {
    packetStartedAt = null;
    packet.visible = false;
    selectedId = '';
    relayIsolated = false;

    linkMeshes.get('A-B')!.visible = true;
    linkMeshes.get('B-C')!.visible = true;
    backupLink.visible = false;

    dormantLink.visible = true;
    markers.forEach((marker) => { marker.visible = false; });
    labels.get('B')!.write('SAT B', ['PRIMARY RELAY']);
    groundLabel.write('GROUND', ['AWAITING TEST']);
    base.material.emissive.setHex(0x000000);
    showBriefing();
  });

  inspectSatellite = (id) => {
    const satellite = satelliteDefinitions.find((item) => item.id === id);
    if (!satellite) return;
    selectedId = id;

    markers.forEach((marker, satelliteId) => {
      marker.visible = satelliteId === id;
    });
    const evidence = id === 'B' && relayIsolated
      ? [...satellite.evidence.slice(0, 2), 'Status: isolated from the network.']
      : id === 'D' && backupLink.visible
        ? [...satellite.evidence.slice(0, 2), 'Backup link D-E is active.']
        : satellite.evidence;

    inspection.write(`${satellite.id} / ${satellite.name}`, evidence,
      id === 'B' && !relayIsolated ? '#ffd166' : '#6ff5db');
  };
}).catch((error: unknown) => {
  console.error('Constellation Guardian failed to start:', error);
});
