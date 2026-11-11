// Campo da padel 3D (Three.js via React Three Fiber): erba blu, righe, vetri,
// rete metallica e una pallina che palleggia da una metà campo all'altra.
// Misure reali in metri: 10 × 20, vetri alti 3 m, rete 0,88 m.
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const W = 10; // larghezza
const L = 20; // lunghezza
const H = 3; // altezza vetri e rete metallica
const BALL_R = 0.16; // pallina ingrandita (quella vera è 3,3 cm) per leggerla da lontano
const TRAIL = 7;

// --- geometrie a linee costruite una volta sola ---

// Griglia della rete metallica laterale: quadrati da 0,5 m
function fenceGeometry() {
  const pts: number[] = [];
  const zFrom = -L / 2 + 2;
  const zTo = L / 2 - 2;
  for (const x of [-W / 2, W / 2]) {
    for (let z = zFrom; z <= zTo + 0.001; z += 0.5) pts.push(x, 0, z, x, H, z);
    for (let y = 0.5; y <= H + 0.001; y += 0.5) pts.push(x, y, zFrom, x, y, zTo);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

// Contorni dei pannelli di vetro (fondo + primi 2 m dei lati)
function glassEdgesGeometry() {
  const pts: number[] = [];
  const seg = (a: number[], b: number[]) => pts.push(...a, ...b);
  for (const s of [-1, 1]) {
    const z = (s * L) / 2;
    const zi = s * (L / 2 - 2);
    // parete di fondo: 4 pannelli da 2,5 m
    for (let i = 0; i <= 4; i++) seg([-W / 2 + i * 2.5, 0, z], [-W / 2 + i * 2.5, H, z]);
    seg([-W / 2, H, z], [W / 2, H, z]);
    // laterali
    for (const x of [-W / 2, W / 2]) {
      seg([x, H, z], [x, H, zi]);
      seg([x, 0, zi], [x, H, zi]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

// Maglie della rete centrale
function netGeometry() {
  const pts: number[] = [];
  const h = 0.88;
  for (let x = -W / 2; x <= W / 2 + 0.001; x += 0.12) pts.push(x, 0, 0, x, h, 0);
  for (let y = 0.11; y < h; y += 0.11) pts.push(-W / 2, y, 0, W / 2, y, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

// --- traiettoria della pallina ---

// Un colpo: dal giocatore (y≈1) al rimbalzo nell'altra metà, poi su fino al colpo successivo.
// Le x cambiano a ogni scambio per non sembrare un loop meccanico.
const XS = [-2.6, 1.8, -0.6, 3.1, -3.3, 0.9, 2.2, -1.7];
const SHOT = 1.25; // secondi per colpo

function ballAt(time: number, out: THREE.Vector3) {
  const n = Math.floor(time / SHOT);
  const t = (time % SHOT) / SHOT;
  const dir = n % 2 === 0 ? 1 : -1;
  const x0 = XS[n % XS.length];
  const x1 = XS[(n + 1) % XS.length];
  const z0 = -dir * 8.2;
  const zB = dir * 4.6; // punto di rimbalzo
  const z1 = dir * 8.2;
  const xB = x0 + (x1 - x0) * 0.72;
  if (t < 0.72) {
    // volo sopra la rete: parabola da y=1 a y=raggio, apice 2.7
    const k = t / 0.72;
    const y = THREE.MathUtils.lerp(1, BALL_R, k) + 4 * 2.1 * k * (1 - k);
    out.set(THREE.MathUtils.lerp(x0, xB, k), y, THREE.MathUtils.lerp(z0, zB, k));
  } else {
    // dopo il rimbalzo risale verso il colpo successivo
    const k = (t - 0.72) / 0.28;
    const y = THREE.MathUtils.lerp(BALL_R, 1, k) + 4 * 0.9 * k * (1 - k);
    out.set(THREE.MathUtils.lerp(xB, x1, k), y, THREE.MathUtils.lerp(zB, z1, k));
  }
  return out;
}

function Ball({ still }: { still: boolean }) {
  const ball = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const trail = useRef<(THREE.Mesh | null)[]>([]);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const time = still ? 0.6 : clock.elapsedTime;
    ballAt(time, pos);
    ball.current?.position.copy(pos);
    if (shadow.current) {
      shadow.current.position.set(pos.x, 0.012, pos.z);
      const s = 1 - Math.min(pos.y / 3.5, 0.75);
      shadow.current.scale.setScalar(s);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * s;
    }
    // scia: posizioni di qualche centesimo di secondo prima
    trail.current.forEach((m, i) => {
      if (!m) return;
      m.visible = !still;
      m.position.copy(ballAt(Math.max(0, time - (i + 1) * 0.022), tmp));
    });
  });

  return (
    <group>
      {Array.from({ length: TRAIL }, (_, i) => (
        <mesh key={i} ref={(m) => (trail.current[i] = m)} scale={1 - (i + 1) / (TRAIL + 2)}>
          <sphereGeometry args={[BALL_R, 16, 16]} />
          <meshBasicMaterial color="#d7ff3a" transparent opacity={0.28 - i * 0.035} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL_R, 32, 32]} />
        <meshStandardMaterial color="#d7ff3a" emissive="#b8e600" emissiveIntensity={0.55} roughness={0.55} />
      </mesh>
      <mesh ref={shadow} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[BALL_R * 1.6, 24]} />
        <meshBasicMaterial color="#000814" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Court() {
  const fence = useMemo(() => fenceGeometry(), []);
  const glass = useMemo(() => glassEdgesGeometry(), []);
  const net = useMemo(() => netGeometry(), []);
  const line = '#f4f7ff';
  const lineW = 0.06;

  return (
    <group>
      {/* terreno attorno al campo */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0a1222" roughness={1} />
      </mesh>
      {/* erba sintetica */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#1d4fe0" roughness={0.9} />
      </mesh>
      {/* righe: linee di servizio a 6,95 m dalla rete e linea centrale */}
      {[-6.95, 6.95].map((z) => (
        <mesh key={z} position={[0, 0.006, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[W, lineW]} />
          <meshBasicMaterial color={line} />
        </mesh>
      ))}
      <mesh position={[0, 0.006, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[lineW, 13.9]} />
        <meshBasicMaterial color={line} />
      </mesh>

      {/* vetri: superfici appena visibili + contorni */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, H / 2, (s * L) / 2]}>
            <planeGeometry args={[W, H]} />
            <meshStandardMaterial color="#bfe0ff" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[(sx * W) / 2, H / 2, s * (L / 2 - 1)]} rotation-y={Math.PI / 2}>
              <planeGeometry args={[2, H]} />
              <meshStandardMaterial color="#bfe0ff" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
      <lineSegments geometry={glass}>
        <lineBasicMaterial color="#cfe3ff" transparent opacity={0.55} />
      </lineSegments>
      <lineSegments geometry={fence}>
        <lineBasicMaterial color="#9fb6db" transparent opacity={0.16} />
      </lineSegments>

      {/* rete */}
      <lineSegments geometry={net}>
        <lineBasicMaterial color="#e8eefc" transparent opacity={0.28} />
      </lineSegments>
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[W, 0.05, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.08), 0.5, 0]}>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color="#c8d2e4" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* torri faro agli angoli */}
      {/* (la torre più vicina alla camera non c'è: coprirebbe il campo) */}
      {[[-1, -1], [1, -1], [-1, 1]].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[sx * (W / 2 + 1.2), 0, sz * (L / 2 - 3)]}>
            <mesh position-y={3.4}>
              <cylinderGeometry args={[0.05, 0.07, 6.8, 8]} />
              <meshStandardMaterial color="#2a3854" />
            </mesh>
            <mesh position={[-sx * 0.3, 6.8, 0]} rotation-z={sx * 0.5}>
              <boxGeometry args={[0.7, 0.14, 0.4]} />
              <meshStandardMaterial color="#ffffff" emissive="#fff6d8" emissiveIntensity={2.2} />
            </mesh>
          </group>
      ))}
    </group>
  );
}

// La camera gira piano attorno al campo e segue un po' il puntatore
function Rig({ still }: { still: boolean }) {
  const target = useMemo(() => new THREE.Vector3(0, 0.6, 0), []);
  useFrame(({ camera, clock, pointer }) => {
    const t = still ? 0 : clock.elapsedTime * 0.08;
    const angle = 0.72 + Math.sin(t) * 0.22 + (still ? 0 : pointer.x * 0.12);
    const r = 22.5;
    const desired = new THREE.Vector3(Math.sin(angle) * r, 12.5 + (still ? 0 : pointer.y * 1.2), Math.cos(angle) * r);
    camera.position.lerp(desired, still ? 1 : 0.05);
    camera.lookAt(target);
  });
  return null;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export default function CourtScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const reduced = usePrefersReducedMotion();

  // Fuori dallo schermo o in un'altra scheda il campo smette di disegnare
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="court-scene">
      <Canvas
        frameloop={visible && !reduced ? 'always' : 'demand'}
        dpr={[1, 1.75]}
        camera={{ fov: 32, position: [15, 12.5, 16], near: 0.5, far: 120 }}
        gl={{ antialias: true, alpha: true }}
        aria-label="Campo da padel in 3D con una pallina in gioco"
        role="img"
      >
        <fog attach="fog" args={['#060a13', 26, 52]} />
        <hemisphereLight args={['#cfe0ff', '#0a1222', 0.65]} />
        <directionalLight position={[6, 14, 8]} intensity={1.6} color="#fff8e6" />
        <directionalLight position={[-8, 10, -10]} intensity={0.5} color="#9fc0ff" />
        <Court />
        <Ball still={reduced} />
        <Rig still={reduced} />
      </Canvas>
    </div>
  );
}
