"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useScroll, useTransform, motion as motion2d } from "framer-motion";
import { Html } from "@react-three/drei";
import { Church, Users, User, ArrowUp } from "lucide-react";
import * as THREE from "three";

// --- SHADER: Curved Horizon ---
// This vertex shader bends the world downwards as it gets further from the camera
const CURVED_GRID_VERTEX = `
  varying vec2 vUv;
  varying float vDistance;
  
  uniform float uTime;
  uniform float uScroll;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Scrolled movement: Move texture/grid coordinates or move mesh?
    // We move the mesh vertex y based on distance from camera view center (0,0 in view space)
    
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vec4 viewPos = viewMatrix * worldPos; // Position relative to camera
    
    float dist = length(viewPos.xz);
    vDistance = dist;
    
    // CURVATURE: y = -dist^2 * factor
    float curvature = 0.0005; // Adjust for "Planet Size"
    worldPos.y -= dist * dist * curvature;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const CURVED_GRID_FRAGMENT = `
  varying vec2 vUv;
  varying float vDistance;
  uniform float uScroll;
  
  void main() {
    // Grid Lines
    // We create a grid pattern procedurally
    float gridScale = 20.0;
    vec2 gridUV = vUv * gridScale;
    
    // Add scroll offset to UVs to simulate infinite movement if using static mesh
    // But we are moving the camera, so the world positions change naturally.
    
    // 0.0 to 1.0 within each cell
    vec2 cell = fract(gridUV); 
    
    // Distance to edge (thin lines)
    float lineWidth = 0.05;
    float lineX = smoothstep(lineWidth, 0.0, abs(cell.x - 0.5)); // Center line? No, let's do simple edges
    float line = step(0.95, cell.x) + step(0.95, cell.y);
    
    // Fade out at distance (Fog)
    float alpha = max(0.0, 1.0 - vDistance * 0.015);
    
    // Color: Amber/Gold
    vec3 color = vec3(0.85, 0.47, 0.02); // Amber 600-ish
    
    if (line < 0.1) discard; // Transparent between lines
    
    gl_FragColor = vec4(color, alpha * 0.4);
  }
`;

// Simplified material since writing custom shader from scratch without preview is risky.
// We will use a standard Plane with a custom "onBeforeCompile" or just utilize standard Three lines.
// Actually, standard mesh movement is safer than UV scrolling for "Camera Movement" request.

const GRID_SIZE = 200;
const FOG_DEPTH = 150;

function CurvedGrid() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: CURVED_GRID_VERTEX,
            fragmentShader: CURVED_GRID_FRAGMENT,
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uScroll: { value: 0 }
            }
        });
    }, []);

    useFrame(() => {
        if (meshRef.current) {
            // Infinite Grid Logic:
            // Move the grid mesh with the camera, but snap it to avoid jitter
            // We only move it in Z increments matching the pattern size if we had a pattern
            meshRef.current.position.z = camera.position.z;
            meshRef.current.position.x = camera.position.x;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
            <planeGeometry args={[GRID_SIZE * 2, GRID_SIZE * 2, 48, 48]} />
            <primitive object={shaderMaterial} />
        </mesh>
    );
}

// --- OBJECTS: Shuls & Members ---
function FloatingIcon({ initialPos, type }: { initialPos: [number, number, number], type: 'shul' | 'member' }) {
    const ref = useRef<THREE.Group>(null);
    const { camera } = useThree();
    const [randomOffset] = useState(() => Math.random() * 100);

    // Use a ref to track current recycled Z position without re-rendering
    const zPos = useRef(initialPos[2]);

    useFrame((state) => {
        if (!ref.current) return;

        // 1. Floating Animation
        ref.current.position.y = initialPos[1] + Math.sin(state.clock.getElapsedTime() + randomOffset) * 0.5;

        // 2. Infinite Recycling Logic
        const camZ = camera.position.z;

        // Check if object is behind camera (camera moving -Z)
        // If object Z > camZ + 10 (it's behind), move it to camZ - 150 (in front)

        if (zPos.current > camZ + 20) {
            zPos.current -= FOG_DEPTH * 1.5; // Recycle to front
        }
        // If object is too far ahead (e.g. if we scroll UP/Backwards)
        else if (zPos.current < camZ - FOG_DEPTH * 1.5) {
            zPos.current += FOG_DEPTH * 1.5;
        }

        ref.current.position.z = zPos.current;
    });

    return (
        <group ref={ref} position={[initialPos[0], initialPos[1], initialPos[2]]}>
            <Html transform center pointerEvents="none" distanceFactor={15} zIndexRange={[100, 0]}>
                {/* OPTIMIZATION: Removed backdrop-blur and complex shadows which cause massive repaint lag on moving standard DOM elements */}
                <div className={`flex flex-col items-center justify-center`}>
                    {type === 'shul' ? (
                        <div className="relative group">
                            <div className="bg-amber-100/30 p-4 rounded-full border border-amber-500/50">
                                <Church className="w-12 h-12 text-amber-600" />
                            </div>
                            <div className="absolute top-full mt-2 w-max left-1/2 -translate-x-1/2 bg-amber-900/80 text-amber-100 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                Active Kehilla
                            </div>
                        </div>
                    ) : (
                        <div className="bg-stone-500/20 p-2 rounded-full border border-stone-500/30">
                            <Users className="w-5 h-5 text-stone-500" />
                        </div>
                    )}
                </div>
            </Html>
            {/* Anchor Line */}
            <mesh position={[0, -10, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 20, 4]} />
                <meshBasicMaterial color={type === 'shul' ? "#d97706" : "#57534e"} opacity={0.2} transparent />
            </mesh>
        </group>
    );
}

function NetworkScene({ scrollY }: { scrollY: any }) {
    const { camera } = useThree();

    // Generate random objects spread across the recycling range
    const objects = useMemo(() => {
        const items: { pos: [number, number, number]; type: 'shul' | 'member' }[] = [];
        // OPTIMIZATION: Reduced count from 60 to 25
        for (let i = 0; i < 25; i++) {
            items.push({
                pos: [
                    (Math.random() - 0.5) * 120, // X: Wide Spread
                    0,                           // Y: Base height
                    -Math.random() * FOG_DEPTH   // Z: Initial depth distribution (0 to -150)
                ] as [number, number, number],
                type: Math.random() > 0.85 ? 'shul' : 'member'
            });
        }
        return items;
    }, []);

    useFrame((state, delta) => {
        // Sync Camera Z with ScrollY
        const scrollVal = scrollY.get();

        // User wants: Scroll Down -> Forward Movement (Decrease Z)
        const targetZ = 20 - (scrollVal * 0.05);

        // "Super Ultra Smooth" Logic:
        // Instead of z = targetZ (rigid), we Lerp (Linear Interpolate) towards it.
        // This adds "weight" and momentum to the movement.
        // using a damp factor of roughly 5 * delta (adjust for feel)

        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08); // 0.08 = very smooth/heavy feel
    });
    return (
        <group>
            <CurvedGrid />
            {objects.map((obj, i) => (
                <FloatingIcon key={i} initialPos={obj.pos} type={obj.type} />
            ))}
        </group>
    );
}

export default function BackgroundGrid() {
    const { scrollY } = useScroll();

    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-stone-50">
            <Canvas
                gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
                // Camera looks down-ish (-Y) and forward (-Z)
                camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 300 }}
                dpr={[1, 1.5]} // Limit pixel ratio for performance
            >
                <fog attach="fog" args={['#fafaf9', 10, 100]} />

                <NetworkScene scrollY={scrollY} />
            </Canvas>
        </div>
    );
}
