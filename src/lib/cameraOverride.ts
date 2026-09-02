import type { Vec3 } from "@/data/scenes";
export interface CameraOverrideDetail { position: Vec3; lookAt: Vec3; duration?: number }
export const CAMERA_OVERRIDE_EVENT="babylon:camera-override";
export const MAP_CAMERA_TARGETS:Record<string,CameraOverrideDetail>={
 "map-ishtar-gate":{position:[-8,13,-18],lookAt:[-8,4,-30]},"map-processional-way":{position:[-8,12,-38],lookAt:[-8,1,-55]},"map-etemenanki":{position:[34,28,-48],lookAt:[18,10,-62]},"map-esagila":{position:[28,18,-42],lookAt:[10,2,-48]},"map-royal-palace":{position:[-42,18,-56],lookAt:[-24,2,-74]},"map-euphrates":{position:[20,24,-70],lookAt:[0,0,-105]}
};
export function requestCameraOverride(id:string){const detail=MAP_CAMERA_TARGETS[id];if(detail&&typeof window!=="undefined")window.dispatchEvent(new CustomEvent<CameraOverrideDetail>(CAMERA_OVERRIDE_EVENT,{detail}));}
