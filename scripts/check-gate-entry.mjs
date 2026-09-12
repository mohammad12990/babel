// Test the authored GLB as well as the animation: a camera path which is
// mathematically smooth can still pass through a wall or a closed door.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const require = createRequire(import.meta.url);
const modules = new Map();
function loadTypeScript(path) {
  if (modules.has(path)) return modules.get(path);
  const exports = {};
  modules.set(path, exports);
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function("require", "exports", source)((name) => name.startsWith("@/") ? loadTypeScript(`src/${name.slice(2)}.ts`) : require(name), exports);
  return exports;
}

const layout = loadTypeScript("src/lib/journeyLayout.ts");
const timeline = loadTypeScript("src/lib/journeyTimeline.ts");
const { sampleJourney, sampleGateEntry, gateOpeningAt, GATE_ENTER_START, GATE_OPEN_END, GATE_DOOR_Z, GATE_DOOR_HALF_WIDTH, GATE_Z, ROAD_X, ROAD_Y } = layout;
assert(GATE_OPEN_END < GATE_ENTER_START, "The camera must wait for the doors");
assert.equal(timeline.resolveJourneyProgress(timeline.ARRIVAL_PROGRESS).activeSceneIndex, 3);
assert.equal(timeline.resolveJourneyProgress(1).sceneProgress, 1);
assert.equal(timeline.HOLD_DURATION_SECONDS * timeline.ARRIVAL_PROGRESS, 20);

// Decode the exact production geometry without loading its image textures.
// Texture fidelity is covered separately; this check only measures clearance.
globalThis.ProgressEvent ??= class { constructor(type, fields) { this.type = type; Object.assign(this, fields); } };
const bytes = fs.readFileSync("public/models/ishtar-gate.glb");
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength));
gltf.buffers[0].uri = `data:application/octet-stream;base64,${bytes.subarray(28 + jsonLength).toString("base64")}`;
gltf.materials = gltf.materials.map(() => ({ doubleSided: true }));
gltf.images = [];
gltf.textures = [];
const { scene } = await new GLTFLoader().parseAsync(JSON.stringify(gltf), "");
scene.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(scene);
const scale = 27.2 / (bounds.max.y - bounds.min.y);
const gate = new THREE.Group();
gate.add(scene);
gate.scale.setScalar(scale);
gate.position.set(ROAD_X - (bounds.min.x + bounds.max.x) / 2 * scale, ROAD_Y - 0.05 - bounds.min.y * scale, GATE_Z - bounds.max.z * scale);
gate.updateMatrixWorld(true);
const gateBounds = new THREE.Box3().setFromObject(gate);

const leaves = [-1, 1].map((side) => {
  const pivot = new THREE.Group();
  pivot.position.set(ROAD_X + side * GATE_DOOR_HALF_WIDTH, ROAD_Y - 0.05, GATE_DOOR_Z);
  // A conservative full-height envelope contains wood and both-face fittings.
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(GATE_DOOR_HALF_WIDTH, 15, 0.6), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  mesh.position.set(-side * GATE_DOOR_HALF_WIDTH / 2, 7.5, 0);
  pivot.add(mesh);
  return { side, pivot };
});
const ray = new THREE.Raycaster();
for (const portrait of [false, true]) {
  const arrival = new THREE.Vector3(), arrivalLook = new THREE.Vector3();
  sampleJourney(1, arrival, arrivalLook, portrait);
  const start = new THREE.Vector3(), startLook = new THREE.Vector3();
  sampleGateEntry(0, start, startLook, portrait);
  assert(start.distanceTo(arrival) < 1e-8 && startLook.distanceTo(arrivalLook) < 1e-8, "Chapter transition jumps");
  let previous = start.clone(), previousDirection = startLook.clone().sub(start).normalize();
  let maxTurn = 0;
  const records = [];
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000;
    const position = new THREE.Vector3(), lookAt = new THREE.Vector3();
    sampleGateEntry(progress, position, lookAt, portrait);
    const opening = gateOpeningAt(progress);
    assert([...position.toArray(), ...lookAt.toArray(), opening].every(Number.isFinite));
    assert.equal(position.x, ROAD_X, "Camera leaves the center of the arch");
    assert(position.y - ROAD_Y >= 2.1, "Camera is too near the paving");
    assert(position.z <= previous.z + 1e-8, "Camera reverses unexpectedly");
    assert(lookAt.z < position.z - 20, "Camera turns back toward the gate");
    if (progress <= GATE_ENTER_START) assert(position.distanceTo(arrival) < 1e-8, "Camera advances before the doors open");
    if (position.z < GATE_Z + 5) assert.equal(opening, 1, "Camera crosses while the gate is closing");
    const direction = lookAt.clone().sub(position).normalize();
    maxTurn = Math.max(maxTurn, direction.angleTo(previousDirection));
    const movement = position.clone().sub(previous);
    const distance = movement.length();
    if (distance > 0) {
      for (const { side, pivot } of leaves) { pivot.rotation.y = side * Math.PI / 2 * opening; pivot.updateMatrixWorld(true); }
      // Nine rays test a 1.2-unit-wide corridor around the moving camera.
      for (const dx of [-0.6, 0, 0.6]) for (const dy of [-0.6, 0, 0.6]) {
        ray.set(previous.clone().add(new THREE.Vector3(dx, dy, 0)), movement.clone().normalize());
        ray.far = distance + 0.12;
        assert.equal(ray.intersectObjects([gate, ...leaves.map((leaf) => leaf.pivot)], true).length, 0, `Camera intersects the gate at ${progress}`);
      }
    }
    records.push({ progress, position: position.toArray(), opening });
    previous.copy(position);
    previousDirection.copy(direction);
  }
  assert(previous.z < gateBounds.min.z - 12, "Camera has not exited the full gate depth");
  assert(maxTurn < 0.004, "Look direction changes abruptly");
  // Scrub back through the same timeline: the same input must restore exactly
  // the same pose, with no independent door timer or delayed closing state.
  for (const record of records.reverse()) {
    const p = new THREE.Vector3(), look = new THREE.Vector3();
    sampleGateEntry(record.progress, p, look, portrait);
    assert.deepEqual(p.toArray(), record.position);
    assert.equal(gateOpeningAt(record.progress), record.opening);
  }
  console.log(JSON.stringify({ format: portrait ? "portrait" : "landscape", samples: 1001, clearance: "passed against production GLB and door envelopes", maxTurnDegrees: THREE.MathUtils.radToDeg(maxTurn), endpoint: previous.toArray() }));
}
