"use client";import { useScrollState } from "@/components/ScrollController";
export function TransitionOverlay(){const{sceneProgress,activeSceneIndex}=useScrollState();const edge=Math.max(0,(sceneProgress-.94)/.06);if(edge<=0||activeSceneIndex===8)return null;return <div className="transition-overlay" style={{opacity:edge*.42}}/>}
