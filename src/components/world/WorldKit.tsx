"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function AtmosphericDust({ count=180, spread:[sx,sy,sz]=[70,24,90], position=[0,10,-35] as [number,number,number] }) {
  const ref=useRef<THREE.Points>(null);
  const positions=useMemo(()=>{ const a=new Float32Array(count*3); for(let i=0;i<count;i++){a[i*3]=(Math.random()-.5)*sx;a[i*3+1]=Math.random()*sy;a[i*3+2]=(Math.random()-.5)*sz;} return a;},[count,sx,sy,sz]);
  useFrame((_,dt)=>{if(ref.current) ref.current.rotation.y+=dt*.006;});
  return <points ref={ref} position={position}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#E8DFC8" size={.07} transparent opacity={.24} depthWrite={false}/></points>;
}

export function Water({ position=[0,0,0] as [number,number,number], size=[26,180] as [number,number], rotation=0 }){
 const ref=useRef<THREE.MeshStandardMaterial>(null);
 useFrame(({clock})=>{if(ref.current){ref.current.emissiveIntensity=.05+Math.sin(clock.elapsedTime*.6)*.015;}});
 return <mesh rotation={[-Math.PI/2,0,rotation]} position={position}><planeGeometry args={size}/><meshStandardMaterial ref={ref} color="#173c55" emissive="#16294D" roughness={.3} metalness={.08}/></mesh>;
}

export function InstancedPalms({ count=24, area=[60,90] as [number,number], center=[0,0,-25] as [number,number,number] }){
 const trunks=useRef<THREE.InstancedMesh>(null), crowns=useRef<THREE.InstancedMesh>(null);
 const transforms=useMemo(()=>Array.from({length:count},(_,i)=>{const side=i%2?-1:1; return {x:center[0]+side*(area[0]*.22+Math.random()*area[0]*.28),z:center[2]+(Math.random()-.5)*area[1],s:.7+Math.random()*.7};}),[count,area,center]);
 useMemo(()=>{const d=new THREE.Object3D(); queueMicrotask(()=>{transforms.forEach((t,i)=>{if(trunks.current){d.position.set(t.x,3*t.s,t.z);d.scale.set(t.s,t.s,t.s);d.updateMatrix();trunks.current.setMatrixAt(i,d.matrix)} if(crowns.current){d.position.set(t.x,6.2*t.s,t.z);d.scale.set(2.4*t.s,.8*t.s,2.4*t.s);d.updateMatrix();crowns.current.setMatrixAt(i,d.matrix)}}); trunks.current&&(trunks.current.instanceMatrix.needsUpdate=true);crowns.current&&(crowns.current.instanceMatrix.needsUpdate=true);});},[transforms]);
 return <group><instancedMesh ref={trunks} args={[undefined,undefined,count]}><cylinderGeometry args={[.16,.28,6,6]}/><meshStandardMaterial color="#5a3824" roughness={1}/></instancedMesh><instancedMesh ref={crowns} args={[undefined,undefined,count]}><coneGeometry args={[1,1.4,7]}/><meshStandardMaterial color="#385238" roughness={.9}/></instancedMesh></group>;
}

export function LightweightCrowd({count=28,length=85}:{count?:number;length?:number}){
 const ref=useRef<THREE.InstancedMesh>(null); const transforms=useMemo(()=>Array.from({length:count},(_,i)=>({x:(i%2?-1:1)*(1.6+Math.random()*2.5),z:-5-Math.random()*length,s:.75+Math.random()*.45})),[count,length]);
 useMemo(()=>{const d=new THREE.Object3D();queueMicrotask(()=>{transforms.forEach((t,i)=>{if(!ref.current)return;d.position.set(t.x,1.05*t.s,t.z);d.scale.set(t.s,t.s,t.s);d.updateMatrix();ref.current.setMatrixAt(i,d.matrix)});if(ref.current)ref.current.instanceMatrix.needsUpdate=true;});},[transforms]);
 return <instancedMesh ref={ref} args={[undefined,undefined,count]}><capsuleGeometry args={[.22,1.15,3,6]}/><meshStandardMaterial color="#c8ad82" roughness={1}/></instancedMesh>;
}

export function Crenellations({width=16,y=14,z=0,color="#173f78"}:{width?:number;y?:number;z?:number;color?:string}){const n=Math.floor(width/1.5);return <group>{Array.from({length:n},(_,i)=><mesh key={i} position={[-width/2+.75+i*1.5,y,z]}><boxGeometry args={[.8,1.1,3.8]}/><meshStandardMaterial color={color} roughness={.48}/></mesh>)}</group>}

export function ReliefMotifs({width=10,y=5,z=2.08}:{width?:number;y?:number;z?:number}){return <group>{Array.from({length:5},(_,i)=><mesh key={i} position={[-width/2+1+i*(width/5),y+(i%2)*1.6,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.35,.1,5,8]}/><meshStandardMaterial color="#C9A227" roughness={.55}/></mesh>)}</group>}
