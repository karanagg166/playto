import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
    const ref = useRef();

    const particlesCount = 5000;

    const positions = useMemo(() => {
        const positions = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return positions;
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta * 0.05;
            ref.current.rotation.y -= delta * 0.08;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#8b5cf6"
                    size={0.02}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

function FloatingOrb({ position, color, speed }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
            ref.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * speed * 0.5) * 0.3;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.8}
            />
        </mesh>
    );
}

function AnimatedTorus() {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x += delta * 0.2;
            ref.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <mesh ref={ref} position={[3, 0, -2]}>
            <torusGeometry args={[1.5, 0.4, 16, 100]} />
            <meshStandardMaterial
                color="#6366f1"
                emissive="#4338ca"
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.9}
                wireframe
            />
        </mesh>
    );
}

function Scene() {
    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ec4899" />

            <ParticleField />
            <AnimatedTorus />

            <FloatingOrb position={[-3, 2, -1]} color="#8b5cf6" speed={1.2} />
            <FloatingOrb position={[4, -1, -2]} color="#ec4899" speed={0.8} />
            <FloatingOrb position={[-2, -2, 0]} color="#06b6d4" speed={1.5} />
        </>
    );
}

export default function Background3D() {
    return (
        <div className="fixed inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 75 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}
