// Geometry invariants for the two supported camera formats. No browser required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const THREE = require('three');
const source = fs.readFileSync('src/lib/journeyLayout.ts', 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const compiledModule = {exports: {}};
new Function('require', 'exports', 'module', compiled)(require, compiledModule.exports, compiledModule);
const {sampleJourney, accessCurve, bankHeightAt, riverCenterAt, riverHalfWidthAt, ROAD_X, GATE_Z} = compiledModule.exports;
const roadSamples = accessCurve.getSpacedPoints(800);
const palaceFootprints = [
  [-30, 8, -90, -14], // Main citadel
  [-29, 7, -14, -7], // Front wall
  ...[-29,-19,-9,1].map(x => [x-3.25,x+3.25,-15,-6]),
];
for (const portrait of [false, true]) {
  let previous = null, previousDirection = null;
  let minEyeHeight = Infinity, maxRoadOffset = 0, maxAngle = 0;
  for (let i=0; i<=1000; i++) {
    const position = new THREE.Vector3(), lookAt = new THREE.Vector3();
    sampleJourney(i/1000, position, lookAt, portrait);
    assert([...position.toArray(), ...lookAt.toArray()].every(Number.isFinite));
    if (previous) assert(position.z <= previous.z + 1e-5, 'Camera reverses direction');
    const direction = lookAt.clone().sub(position).normalize();
    assert(direction.z < 0, 'Camera looks back along its route');
    if (previousDirection) maxAngle = Math.max(maxAngle, direction.angleTo(previousDirection));
    for (const [x0,x1,z0,z1] of palaceFootprints) {
      assert(!(position.x > x0-0.5 && position.x < x1+0.5 && position.z > z0-0.5 && position.z < z1+0.5), 'Camera intersects palace');
    }
    const edgeDistance = Math.abs(position.x-riverCenterAt(position.z))-riverHalfWidthAt(position.z);
    const floor = edgeDistance < 0 ? 0.16 : bankHeightAt(edgeDistance, position.z);
    minEyeHeight = Math.min(minEyeHeight, position.y-floor);
    if (position.z<42 && position.z>-40) {
      const offset = Math.min(...roadSamples.map(p => Math.hypot(p.x-position.x, p.z-position.z)));
      maxRoadOffset = Math.max(maxRoadOffset, offset);
    }
    if (position.z < -45) assert(Math.abs(position.x-ROAD_X)<0.3, 'Camera is not centered on the final avenue');
    previous = position; previousDirection = direction;
  }
  assert(minEyeHeight > 1.75, 'Camera approaches the terrain too closely');
  assert(maxRoadOffset < 1.5, 'Camera leaves the access path');
  assert(maxAngle < 0.025, 'Look direction jumps');
  const camera = new THREE.PerspectiveCamera(portrait ? 64 : 49, portrait ? 390/844 : 16/9, .1, 720);
  const lookAt = new THREE.Vector3();
  sampleJourney(1, camera.position, lookAt, portrait); camera.lookAt(lookAt); camera.updateMatrixWorld(true);
  const towerCorners = [-18.85,18.85].flatMap(x => [1.4,28.61].map(y => new THREE.Vector3(ROAD_X+x,y,GATE_Z).project(camera)));
  const frame = {x:Math.max(...towerCorners.map(p => Math.abs(p.x))),y:Math.max(...towerCorners.map(p => Math.abs(p.y)))};
  assert(frame.y<1, 'Gate top or floor is cropped');
  assert(frame.x<1, 'Gate towers are cropped');
  console.log(JSON.stringify({format:portrait?'portrait':'landscape',minEyeHeight,maxRoadOffset,maxAngleDegrees:THREE.MathUtils.radToDeg(maxAngle),gateFrame:frame}));
}
