import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ActiveMatch, GameState, Screen } from '../types/game'

interface BrazukaSceneProps {
  screen: Screen
  state: GameState
  ovr: number
}

export function BrazukaScene({ screen, state, ovr }: BrazukaSceneProps) {
  const quality = state.settings.graphics
  const pixelRatio: [number, number] = quality === 'Alta' ? [1, 1.8] : quality === 'Média' ? [1, 1.4] : [1, 1]

  return (
    <div className="scene-stage" aria-label="Cena 3D do jogador Brazuka">
      <Canvas
        camera={{ position: [0, 4.2, 7.2], fov: 42 }}
        dpr={pixelRatio}
        shadows={quality !== 'Baixa'}
        gl={{ antialias: quality !== 'Baixa', powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#8bd8ff']} />
        <fog attach="fog" args={['#bdf3ff', 13, 25]} />
        <ambientLight intensity={0.86} />
        <directionalLight
          position={[4, 8, 3]}
          intensity={1.5}
          castShadow={quality !== 'Baixa'}
          shadow-mapSize={[1024, 1024]}
        />
        <SceneContent screen={screen} state={state} ovr={ovr} />
      </Canvas>
      <div className="scene-caption">
        <span>{sceneTitle(screen, state.activeMatch)}</span>
        <strong>OVR {ovr}</strong>
      </div>
    </div>
  )
}

function SceneContent({ screen, state, ovr }: BrazukaSceneProps) {
  const action = getAction(screen, state.activeMatch)
  const crowdCount = state.settings.graphics === 'Baixa' ? 12 : state.settings.graphics === 'Média' ? 20 : 30

  return (
    <group>
      <TropicalSky />
      <Pitch screen={screen} />
      <Crowd count={crowdCount} />
      <Flags />
      <PlayerFigure action={action} jerseyNumber={state.player.number} />
      {screen === 'match' ? <MatchActors match={state.activeMatch} /> : <TrainingProps screen={screen} />}
      <Float speed={2} rotationIntensity={0.18} floatIntensity={0.35}>
        <Ball position={screen === 'match' ? [1.55, 0.18, -1.2] : [-1.1, 0.18, 0.4]} />
      </Float>
      <Confetti enabled={state.settings.graphics !== 'Baixa'} />
      <Text
        position={[0, 0.04, -3.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.38}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {screen === 'career' ? 'JORNADA BRAZUKA' : `OVR ${ovr}`}
      </Text>
    </group>
  )
}

function TropicalSky() {
  return (
    <group>
      <mesh position={[-5.2, 3.9, -5.8]}>
        <sphereGeometry args={[0.62, 24, 24]} />
        <meshStandardMaterial color="#ffe36e" emissive="#ffce45" emissiveIntensity={0.24} />
      </mesh>
      {[-4.5, 4.8].map((x) => (
        <group key={x} position={[x, 0, -4.7]}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.08, 0.13, 2.4, 10]} />
            <meshStandardMaterial color="#7f4f24" />
          </mesh>
          <mesh position={[0, 2.56, 0]} rotation={[0.3, 0.2, 0.1]}>
            <coneGeometry args={[0.7, 1.45, 7]} />
            <meshStandardMaterial color="#168a4a" />
          </mesh>
        </group>
      ))}
      <group position={[3.4, 0.15, -5.2]}>
        {[0, 0.72, 1.45].map((x, index) => (
          <mesh key={x} position={[x, 0.52 + index * 0.2, 0]}>
            <boxGeometry args={[0.54, 1.05 + index * 0.38, 0.46]} />
            <meshStandardMaterial color={['#f7ca46', '#3bb273', '#4d96ff'][index]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Pitch({ screen }: { screen: Screen }) {
  const grass = screen === 'career' ? '#42b883' : screen === 'training' ? '#47b36d' : '#2ea44f'

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.5, 7.2]} />
        <meshStandardMaterial color={grass} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.04, 1.08, 56]} />
        <meshBasicMaterial color="#f9fff6" />
      </mesh>
      <Line position={[0, 0.02, 0]} scale={[0.045, 1, 7.1]} />
      <Line position={[0, 0.025, -3.08]} scale={[6.2, 1, 0.045]} />
      <Line position={[0, 0.025, 3.08]} scale={[6.2, 1, 0.045]} />
      <Goal position={[0, 0.1, -3.48]} />
      <Goal position={[0, 0.1, 3.48]} rotationY={Math.PI} />
    </group>
  )
}

function Line({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 0.03, 1]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  )
}

function Goal({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[1.7, 0.08, 0.08]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[-0.82, 0.82].map((x) => (
        <mesh key={x} position={[x, 0.16, 0]}>
          <boxGeometry args={[0.08, 0.58, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}

function Crowd({ count }: { count: number }) {
  const fans = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: -4.2 + (index % 10) * 0.92,
        y: 0.46 + Math.floor(index / 10) * 0.3,
        z: -4.05 - Math.floor(index / 10) * 0.22,
        color: ['#ffcf33', '#10a357', '#1b63d3', '#ffffff', '#ff6b6b'][index % 5],
      })),
    [count],
  )

  return (
    <group>
      <mesh position={[0, 0.18, -4.18]}>
        <boxGeometry args={[9.2, 0.36, 0.42]} />
        <meshStandardMaterial color="#2364aa" />
      </mesh>
      {fans.map((fan, index) => (
        <group key={`${fan.x}-${fan.z}-${index}`} position={[fan.x, fan.y, fan.z]}>
          <mesh>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color="#7b4f31" />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <boxGeometry args={[0.24, 0.26, 0.08]} />
            <meshStandardMaterial color={fan.color} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Flags() {
  return (
    <group position={[0, 1.28, -4.38]}>
      {Array.from({ length: 13 }, (_, index) => {
        const x = -4.4 + index * 0.74
        return (
          <mesh key={x} position={[x, Math.sin(index) * 0.04, 0]} rotation={[0, 0, index % 2 ? 0.18 : -0.18]}>
            <coneGeometry args={[0.18, 0.28, 3]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#ffdd38' : index % 3 === 1 ? '#159447' : '#1d5fd1'} />
          </mesh>
        )
      })}
    </group>
  )
}

function PlayerFigure({ action, jerseyNumber }: { action: string; jerseyNumber: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    const group = ref.current
    if (!group) return
    const t = state.clock.elapsedTime
    group.position.y = Math.sin(t * (action === 'run' ? 7 : 2.2)) * 0.045
    group.rotation.y = Math.sin(t * 0.8) * 0.13
    if (action === 'kick') group.rotation.z = Math.sin(t * 5) * 0.06
  })

  return (
    <group ref={ref} position={[0, 0.1, 0.55]} castShadow>
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#9d6b42" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.91, -0.02]} scale={[1, 0.55, 0.75]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#1f1f1f" />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <capsuleGeometry args={[0.3, 0.62, 8, 16]} />
        <meshStandardMaterial color="#ffdd38" roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.08, -0.32]}>
        <boxGeometry args={[0.52, 0.26, 0.035]} />
        <meshStandardMaterial color="#1d5fd1" />
      </mesh>
      <Text position={[0, 1.11, -0.36]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle">
        {jerseyNumber}
      </Text>
      <Limb side={-1} action={action} />
      <Limb side={1} action={action} />
      <Leg side={-1} action={action} />
      <Leg side={1} action={action} />
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[0.55, 0.3, 0.34]} />
        <meshStandardMaterial color="#1d5fd1" />
      </mesh>
    </group>
  )
}

function Limb({ side, action }: { side: -1 | 1; action: string }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * (action === 'run' ? 7 : 3) + side) * 0.55
  })

  return (
    <group ref={ref} position={[side * 0.34, 1.16, 0]}>
      <mesh rotation={[0, 0, side * 0.28]} position={[side * 0.08, -0.2, 0]}>
        <cylinderGeometry args={[0.055, 0.06, 0.48, 12]} />
        <meshStandardMaterial color="#9d6b42" />
      </mesh>
    </group>
  )
}

function Leg({ side, action }: { side: -1 | 1; action: string }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    const kick = action === 'kick' && side === 1 ? 0.9 : 0
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * (action === 'run' ? 7 : 2.8) + side * 2) * 0.48 - kick
  })

  return (
    <group ref={ref} position={[side * 0.16, 0.49, 0]}>
      <mesh position={[0, -0.26, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.56, 12]} />
        <meshStandardMaterial color="#224baf" />
      </mesh>
      <mesh position={[0, -0.6, 0.08]} scale={[1.35, 0.5, 1.7]}>
        <boxGeometry args={[0.17, 0.12, 0.25]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
    </group>
  )
}

function Ball({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.18, 24, 24]} />
      <meshStandardMaterial color="#ffffff" roughness={0.32} />
      <mesh scale={[1.03, 1.03, 1.03]}>
        <sphereGeometry args={[0.181, 12, 12]} />
        <meshBasicMaterial color="#1d5fd1" wireframe />
      </mesh>
    </mesh>
  )
}

function MatchActors({ match }: { match?: ActiveMatch }) {
  const minute = match?.minute ?? 0
  const x = Math.sin(minute / 9) * 2.6
  const z = Math.cos(minute / 11) * 1.6

  return (
    <group>
      {[[-2.2, -0.8], [-1.25, 1.15], [2.45, -0.4]].map(([px, pz], index) => (
        <MiniPlayer key={`${px}-${pz}`} position={[px + x * 0.08, 0.08, pz + z * 0.08]} color={index === 2 ? '#f25c54' : '#ffdd38'} />
      ))}
      {[1.55, 2.35, -1.75].map((px, index) => (
        <MiniPlayer key={px} position={[px - x * 0.09, 0.08, -1.1 + index * 1.18]} color="#f25c54" />
      ))}
    </group>
  )
}

function MiniPlayer({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#8f5b38" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.14, 0.35, 6, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function TrainingProps({ screen }: { screen: Screen }) {
  if (screen !== 'training') return null

  return (
    <group>
      {[-1.8, -1.25, -0.7].map((x) => (
        <mesh key={x} position={[x, 0.16, -0.72]}>
          <coneGeometry args={[0.16, 0.32, 16]} />
          <meshStandardMaterial color="#ff6b35" />
        </mesh>
      ))}
      <mesh position={[1.75, 0.22, -0.65]}>
        <boxGeometry args={[0.7, 0.15, 0.28]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function Confetti({ enabled }: { enabled: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: enabled ? 36 : 0 }, (_, index) => ({
        x: -4.4 + Math.random() * 8.8,
        y: 1.6 + Math.random() * 2.2,
        z: -2.9 + Math.random() * 5.8,
        color: ['#ffdd38', '#12a454', '#1d5fd1', '#ffffff', '#f25c54'][index % 5],
      })),
    [enabled],
  )

  return (
    <group>
      {pieces.map((piece, index) => (
        <FloatingConfetti key={`${piece.x}-${index}`} piece={piece} index={index} />
      ))}
    </group>
  )
}

function FloatingConfetti({
  piece,
  index,
}: {
  piece: { x: number; y: number; z: number; color: string }
  index: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = piece.y + Math.sin(state.clock.elapsedTime * 1.4 + index) * 0.12
    ref.current.rotation.x += 0.014
    ref.current.rotation.z += 0.02
  })

  return (
    <mesh ref={ref} position={[piece.x, piece.y, piece.z]}>
      <boxGeometry args={[0.06, 0.012, 0.12]} />
      <meshStandardMaterial color={piece.color} />
    </mesh>
  )
}

function getAction(screen: Screen, match?: ActiveMatch) {
  if (screen === 'training') return 'kick'
  if (screen === 'match' && match?.status === 'running') return 'run'
  if (screen === 'career') return 'celebrate'
  return 'idle'
}

function sceneTitle(screen: Screen, match?: ActiveMatch) {
  if (screen === 'training') return 'Centro de Treino Tropical'
  if (screen === 'match' && match?.status === 'running') return `Partida ao vivo ${match.minute}'`
  if (screen === 'career') return 'Mapa da Carreira'
  if (screen === 'shop') return 'Loja Brazuka'
  if (screen === 'player') return 'Perfil do Craque'
  return 'Concentração Brazuka'
}
