const fs = require('fs');
const path = require('path');

// Polyfill browser APIs needed by GLTFExporter
global.FileReader = class { readAsArrayBuffer() {} };
global.Blob = class {};
global.document = { createElement: () => ({ getContext: () => null, toDataURL: () => '' }) };
global.window = global;
global.self = global;
global.URL = { createObjectURL: () => '' };

const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

function addMesh(group, geo, mat, pos, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

// ─── Distillation Column ───
function generateColumn() {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const diameter = 3.5;
  const height = 49;
  const r = diameter / 2;
  const carbonSteel = new THREE.MeshStandardMaterial({ color: 0x5a6b73, metalness: 0.7, roughness: 0.45 });
  const stainless = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.28 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.75, roughness: 0.4 });
  const paintedSteel = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.75 });

  addMesh(group, new THREE.CylinderGeometry(r * 0.85, r * 0.95, 3, 32), darkSteel, [0, 1.5, 0]);
  addMesh(group, new THREE.CylinderGeometry(r, r, height, 48), carbonSteel, [0, height / 2 + 1.5, 0]);
  for (let i = 0; i < 20; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.04, 8, 48), stainless);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3 + (i * (height - 3)) / 20;
    group.add(ring);
  }
  addMesh(group, new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.5), carbonSteel, [0, height + 1.5, 0]);
  addMesh(group, new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5), carbonSteel, [0, 1.5, 0]);
  addMesh(group, new THREE.CylinderGeometry(r + 0.15, r + 0.15, 0.1, 48), stainless, [0, height + 1.3, 0]);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    addMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 0.06, 6), stainless, [Math.cos(a) * (r + 0.12), height + 1.3, Math.sin(a) * (r + 0.12)]);
  }
  addMesh(group, new THREE.CylinderGeometry(0.18, 0.18, 0.5, 16), stainless, [0, height + 2.2, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), stainless, [0, height + 2.5, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16), stainless, [-r - 0.1, height * 0.5 + 1.5, 0], [0, 0, Math.PI / 2]);
  addMesh(group, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), stainless, [-r - 0.25, height * 0.5 + 1.5, 0], [0, 0, Math.PI / 2]);
  addMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16), stainless, [0, 1, r + 0.1], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.BoxGeometry(0.06, height * 0.95, 0.06), paintedSteel, [r + 0.2, height / 2 + 1.5, 0]);
  for (let i = 0; i < Math.floor(height / 0.4); i++) {
    addMesh(group, new THREE.BoxGeometry(0.04, 0.04, 0.15), paintedSteel, [r + 0.2, 2 + i * 0.4, 0.08]);
  }
  addMesh(group, new THREE.BoxGeometry(1.2, 0.05, 1.5), paintedSteel, [r + 0.6, height * 0.5 + 1.5, 0]);
  addMesh(group, new THREE.BoxGeometry(1.2, 0.04, 0.04), paintedSteel, [r + 0.6, height * 0.5 + 2.6, 0.75]);
  addMesh(group, new THREE.BoxGeometry(0.04, 1.1, 0.04), paintedSteel, [r + 0.1, height * 0.5 + 2.05, 0.75]);
  addMesh(group, new THREE.BoxGeometry(0.04, 1.1, 0.04), paintedSteel, [r + 1.1, height * 0.5 + 2.05, 0.75]);
  addMesh(group, new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12), stainless, [r * 0.7, height + 1.5, 0], [0, 0, -Math.PI / 4]);
  [0.3, 0.5, 0.7].forEach(h => {
    addMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), stainless, [r - 0.05, height * h + 1.5, r * 0.6], [Math.PI / 2.5, 0, 0]);
  });

  scene.add(group);
  return { scene, meshCount: group.children.length };
}

// ─── Reactor (Fixed-bed) ───
function generateReactor() {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const diameter = 4;
  const height = 18;
  const r = diameter / 2;
  const carbonSteel = new THREE.MeshStandardMaterial({ color: 0x4a5a62, metalness: 0.7, roughness: 0.45 });
  const stainless = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.28 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.75, roughness: 0.4 });

  addMesh(group, new THREE.CylinderGeometry(r * 0.8, r * 0.9, 2, 32), darkSteel, [0, 1, 0]);
  addMesh(group, new THREE.CylinderGeometry(r, r, height, 40), carbonSteel, [0, height / 2 + 1, 0]);
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r - 0.05, 0.03, 6, 32), stainless);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2 + i * (height - 4) / 8;
    group.add(ring);
  }
  addMesh(group, new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2.5), carbonSteel, [0, height + 1, 0]);
  addMesh(group, new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5), carbonSteel, [0, 1, 0]);
  addMesh(group, new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.08, 40), stainless, [0, height + 0.85, 0]);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    addMesh(group, new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6), stainless, [Math.cos(a) * (r + 0.1), height + 0.85, Math.sin(a) * (r + 0.1)]);
  }
  addMesh(group, new THREE.CylinderGeometry(0.15, 0.15, 0.4, 14), stainless, [0, height + 1.3, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14), stainless, [0, height + 1.55, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.3, 14), stainless, [r + 0.1, 0.5, 0], [0, 0, Math.PI / 2]);
  addMesh(group, new THREE.CylinderGeometry(0.18, 0.18, 0.05, 14), stainless, [r + 0.2, 0.5, 0], [0, 0, Math.PI / 2]);
  [0.3, 0.5, 0.7].forEach(h => {
    addMesh(group, new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8), stainless, [r - 0.1, height * h + 1, r * 0.6], [Math.PI / 2.5, 0, 0]);
  });

  scene.add(group);
  return { scene, meshCount: group.children.length };
}

// ─── Heat Exchanger ───
function generateHeatExchanger() {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const shellDiameter = 1.5;
  const length = 7.5;
  const r = shellDiameter / 2;
  const carbonSteel = new THREE.MeshStandardMaterial({ color: 0x5a6b73, metalness: 0.7, roughness: 0.45 });
  const stainless = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.28 });
  const paintedSteel = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.75 });

  // Shell (horizontal)
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, length, 32), carbonSteel);
  shell.rotation.z = Math.PI / 2;
  shell.position.y = 1.5;
  shell.castShadow = true;
  group.add(shell);

  // Front head
  const frontHead = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.1, 32), stainless);
  frontHead.rotation.z = Math.PI / 2;
  frontHead.position.set(length / 2 + 0.05, 1.5, 0);
  group.add(frontHead);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 6), stainless);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(length / 2 + 0.05, 1.5 + Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
    group.add(bolt);
  }

  // Rear head
  const rearHead = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.1, 32), stainless);
  rearHead.rotation.z = Math.PI / 2;
  rearHead.position.set(-length / 2 - 0.05, 1.5, 0);
  group.add(rearHead);

  // Shell-side nozzles
  const topNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 14), stainless);
  topNozzle.position.set(length * 0.25, 1.5 + r + 0.1, 0);
  group.add(topNozzle);
  const topFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 14), stainless);
  topFlange.position.set(length * 0.25, 1.5 + r + 0.28, 0);
  group.add(topFlange);

  const botNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 14), stainless);
  botNozzle.position.set(-length * 0.25, 1.5 - r - 0.1, 0);
  group.add(botNozzle);

  // Baffle rings
  for (let i = 0; i < 5; i++) {
    const baffle = new THREE.Mesh(new THREE.TorusGeometry(r + 0.005, 0.02, 6, 24), stainless);
    baffle.rotation.y = Math.PI / 2;
    baffle.position.set(-length / 2 + 0.5 + i * (length - 1) / 4, 1.5, 0);
    group.add(baffle);
  }

  // Saddle supports
  addMesh(group, new THREE.BoxGeometry(0.15, 1.2, r * 2), paintedSteel, [length * 0.3, 0.6, 0]);
  addMesh(group, new THREE.BoxGeometry(0.15, 1.2, r * 2), paintedSteel, [-length * 0.3, 0.6, 0]);

  scene.add(group);
  return { scene, meshCount: group.children.length };
}

// ─── Storage Tank ───
function generateStorageTank() {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const diameter = 14;
  const height = 12;
  const r = diameter / 2;
  const carbonSteel = new THREE.MeshStandardMaterial({ color: 0x5a7a8c, metalness: 0.6, roughness: 0.5 });
  const stainless = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.28 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.75, roughness: 0.4 });
  const paintedSteel = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.75 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.1, roughness: 0.12, transparent: true, opacity: 0.4 });

  addMesh(group, new THREE.CylinderGeometry(r * 0.7, r * 0.8, 1.5, 32), darkSteel, [0, 0.75, 0]);
  addMesh(group, new THREE.CylinderGeometry(r, r, height, 48), carbonSteel, [0, height / 2 + 0.75, 0]);
  // Flat-ish domed roof
  addMesh(group, new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 4), carbonSteel, [0, height + 0.75, 0]);
  // Bottom
  addMesh(group, new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, Math.PI - Math.PI / 4, Math.PI / 4), carbonSteel, [0, 0.75, 0]);
  // Reinforcing bands
  addMesh(group, new THREE.TorusGeometry(r + 0.01, 0.05, 8, 48), stainless, [0, height * 0.3 + 0.75, 0], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.TorusGeometry(r + 0.01, 0.05, 8, 48), stainless, [0, height * 0.7 + 0.75, 0], [Math.PI / 2, 0, 0]);
  // Level gauge
  addMesh(group, new THREE.BoxGeometry(0.08, height * 0.7, 0.06), glass, [r + 0.02, height * 0.5 + 0.75, 0]);
  // Vent
  addMesh(group, new THREE.CylinderGeometry(0.15, 0.18, 0.5, 14), stainless, [0, height + 1.5, 0]);
  // Inlet
  addMesh(group, new THREE.CylinderGeometry(0.15, 0.15, 0.5, 14), stainless, [r * 0.6, height + 1.2, 0], [0, 0, -Math.PI / 4]);
  // Outlet
  addMesh(group, new THREE.CylinderGeometry(0.15, 0.15, 0.5, 14), stainless, [r + 0.15, 0.5, 0], [0, 0, Math.PI / 2]);
  addMesh(group, new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14), stainless, [r + 0.3, 0.5, 0], [0, 0, Math.PI / 2]);
  // Spiral stair (simplified as straight ladder)
  addMesh(group, new THREE.BoxGeometry(0.06, height * 0.9, 0.06), paintedSteel, [r + 0.15, height * 0.5 + 0.75, 0]);
  for (let i = 0; i < Math.floor(height / 0.3); i++) {
    addMesh(group, new THREE.BoxGeometry(0.04, 0.04, 0.15), paintedSteel, [r + 0.15, 1 + i * 0.3, 0.08]);
  }

  scene.add(group);
  return { scene, meshCount: group.children.length };
}

// ─── Export all models ───
function exportGLB(scene, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      function(result) {
        const buffer = Buffer.from(result);
        const outPath = path.join('public', 'models', filename);
        fs.writeFileSync(outPath, buffer);
        console.log('  ✓ ' + filename + ' (' + (buffer.length / 1024).toFixed(1) + ' KB)');
        resolve();
      },
      function(error) {
        console.error('  ✗ ' + filename + ': ' + (error.message || error));
        reject(error);
      },
      { binary: true }
    );
  });
}

async function main() {
  console.log('Generating 3D equipment models...\n');

  const models = [
    { name: 'Distillation Column', gen: generateColumn, file: 'equipment-column.glb' },
    { name: 'Fixed-bed Reactor', gen: generateReactor, file: 'equipment-reactor.glb' },
    { name: 'Shell-tube Heat Exchanger', gen: generateHeatExchanger, file: 'equipment-heatexchanger.glb' },
    { name: 'Storage Tank', gen: generateStorageTank, file: 'equipment-tank.glb' },
  ];

  for (const model of models) {
    console.log('Generating: ' + model.name);
    const { scene, meshCount } = model.gen();
    console.log('  Meshes: ' + meshCount);
    try {
      await exportGLB(scene, model.file);
    } catch (e) {
      console.log('  (export failed, skipping)');
    }
  }

  console.log('\nDone! Models saved to public/models/');
  process.exit(0);
}

main();
