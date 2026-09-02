"use client";
import { Hotspot } from "@/components/Hotspot";import { AtmosphericDust,Crenellations,ReliefMotifs } from "@/components/world/WorldKit";
export function IshtarGateScene({progress}:{progress:number}){return <group position={[0,0,-20]}><AtmosphericDust count={120} spread={[35,22,35]} position={[0,4,0]}/>
 {[-7,7].map(x=><group key={x}><mesh position={[x,8,0]}><boxGeometry args={[7,16,5]}/><meshStandardMaterial color="#17447f" roughness={.42} metalness={.05}/></mesh><Crenellations width={7} y={16.5} z={0}/><ReliefMotifs width={5} y={5} z={2.55}/></group>)}
 <mesh position={[0,13,0]}><boxGeometry args={[8,6,5]}/><meshStandardMaterial color="#173f78" roughness={.42}/></mesh><Crenellations width={9} y={16.5}/>
 <mesh position={[0,5.4,2.1]}><boxGeometry args={[6.3,10.8,.7]}/><meshStandardMaterial color="#0e0d0b" roughness={1}/></mesh>
 {[-14,14].map(x=><mesh key={x} position={[x,5,-1]}><boxGeometry args={[8,10,4]}/><meshStandardMaterial color="#a85c32" roughness={.9}/></mesh>)}
 <Hotspot id="glazed-bricks" position={[-7,5,2.8]}/><Hotspot id="gate-lions" position={[7,4,2.8]}/><Hotspot id="gate-bulls" position={[-7,9,2.8]}/><Hotspot id="gate-dragons" position={[7,9,2.8]}/></group>}
