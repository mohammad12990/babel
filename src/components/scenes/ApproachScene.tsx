"use client";
import { AtmosphericDust, InstancedPalms, Water } from "@/components/world/WorldKit";
export function ApproachScene({progress}:{progress:number}){return <group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-22,-.25,-35]}><planeGeometry args={[44,190]}/><meshStandardMaterial color="#9b7547" roughness={1}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[22,-.25,-35]}><planeGeometry args={[44,190]}/><meshStandardMaterial color="#a98050" roughness={1}/></mesh>
 <Water position={[0,-.15,-35]} size={[22,190]}/><InstancedPalms count={30} area={[68,130]} center={[0,0,-35]}/><AtmosphericDust count={170}/>
 <group position={[0,0,-62]}>{Array.from({length:9},(_,i)=><mesh key={i} position={[(i-4)*10,5.5,i%2?0:-1]}><boxGeometry args={[8,11,5]}/><meshStandardMaterial color="#9b5737" roughness={.95}/></mesh>)}<mesh position={[0,3,1]}><boxGeometry args={[90,6,4]}/><meshStandardMaterial color="#a85c32" roughness={.95}/></mesh></group>
 <mesh position={[-5,.2,-12]} rotation={[0,.2,0]}><boxGeometry args={[3,.35,7]}/><meshStandardMaterial color="#5a3824"/></mesh>
 </group>}
