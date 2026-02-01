import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Points, PointMaterial, Float, MeshDistortMaterial, GradientTexture, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

// Animated Particle Field
function ParticleField() {
    const ref = useRef();
    const particlesCount = 3000;

    const [positions, colors] = useMemo(() => {
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 25;

            // Purple to pink gradient
            const t = Math.random();
            colors[i * 3] = 0.55 + t * 0.37;     // R: 0.55-0.92
            colors[i * 3 + 1] = 0.36 - t * 0.08; // G: 0.36-0.28
            colors[i * 3 + 2] = 0.96 - t * 0.23; // B: 0.96-0.73
        }
        return [positions, colors];
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta * 0.02;
            ref.current.rotation.y -= delta * 0.03;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.03}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    opacity={0.8}
                />
            </Points>
        </group>
    );
}

// Morphing Blob
function MorphingBlob({ position, color, speed = 1 }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
            ref.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
            <mesh ref={ref} position={position} scale={1.5}>
                <icosahedronGeometry args={[1, 4]} />
                <MeshDistortMaterial
                    color={color}
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={color}
                    emissiveIntensity={0.3}
                />
            </mesh>
        </Float>
    );
}

// Animated Ring
function AnimatedRing({ position, color }) {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x += delta * 0.3;
            ref.current.rotation.z += delta * 0.2;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <torusGeometry args={[2, 0.05, 16, 100]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.6}
            />
        </mesh>
    );
}

// Glowing Orbs with trails
function GlowingOrb({ position, color, size = 0.3, speed = 1 }) {
    const ref = useRef();
    const initialPos = useMemo(() => [...position], []);

    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.elapsedTime * speed;
            ref.current.position.x = initialPos[0] + Math.sin(t) * 0.5;
            ref.current.position.y = initialPos[1] + Math.cos(t * 0.7) * 0.5;
            ref.current.position.z = initialPos[2] + Math.sin(t * 0.5) * 0.3;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2}
                roughness={0}
                metalness={1}
            />
        </mesh>
    );
}

// Wireframe Icosahedron
function WireframeShape() {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x += delta * 0.1;
            ref.current.rotation.y += delta * 0.15;
        }
    });

    return (
        <mesh ref={ref} position={[4, 0, -3]} scale={2}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                color="#8b5cf6"
                emissive="#4c1d95"
                emissiveIntensity={0.3}
                wireframe
                transparent
                opacity={0.4}
            />
        </mesh>
    );
}

// Main Scene
function Scene() {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.15} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" />
            <pointLight position={[-10, -10, -5]} intensity={1} color="#ec4899" />
            <pointLight position={[0, 10, -10]} intensity={0.8} color="#06b6d4" />

            {/* Particles */}
            <ParticleField />

            {/* Drei Sparkles for extra magic */}
            <Sparkles
                count={100}
                scale={15}
                size={3}
                speed={0.5}
                opacity={0.5}
                color="#a855f7"
            />

            {/* Morphing Blobs */}
            <MorphingBlob position={[-4, 2, -2]} color="#8b5cf6" speed={0.8} />
            <MorphingBlob position={[5, -1, -4]} color="#ec4899" speed={1.2} />

            {/* Glowing Orbs */}
            <GlowingOrb position={[-3, -2, 0]} color="#8b5cf6" size={0.2} speed={1.5} />
            <GlowingOrb position={[4, 3, -1]} color="#ec4899" size={0.25} speed={1.2} />
            <GlowingOrb position={[0, -3, -2]} color="#06b6d4" size={0.15} speed={1.8} />

            {/* Shapes */}
            <WireframeShape />
            <AnimatedRing position={[-3, 0, -5]} color="#8b5cf6" />

            {/* Post Processing */}
            <EffectComposer>
                <Bloom
                    intensity={0.5}
                    luminanceThreshold={0.2}
                    luminanceSmoothing={0.9}
                    height={300}
                />
                <ChromaticAberration
                    blendFunction={BlendFunction.NORMAL}
                    offset={[0.0005, 0.0005]}
                />
                <Vignette
                    offset={0.3}
                    darkness={0.7}
                    blendFunction={BlendFunction.NORMAL}
                />
            </EffectComposer>
        </>
    );
}

export default function Background3D() {
    return (
        <div className="fixed inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance"
                }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}
