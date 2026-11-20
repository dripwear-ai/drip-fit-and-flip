import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Body } from "@/lib/fit";

export type Outfit = {
  top?: string | null | undefined;
  bottom?: string | null | undefined;
  dress?: string | null | undefined;
  shoes?: string | null | undefined;
  longSleeve?: boolean | undefined;
};

const cm = (v: number) => v / 100;
/** Circumference (cm) -> lathe radius (m), corrected for the oval x-scale below. */
const circR = (c: number) => cm(c) / (2 * Math.PI);
const X_SCALE = 1.18;
const Z_SCALE = 0.78;

function lathe(points: [number, number][], segments = 40) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y)),
    segments,
  );
}

function Twin({ body, outfit }: { body: Body; outfit: Outfit }) {
  const scan = useRef<THREE.Mesh>(null);
  const g = useMemo(() => {
    const H = cm(body.height);
    const leg = cm(body.inseam);
    const T = Math.max(0.45, H * 0.82 - leg); // crotch -> base of neck
    const hipR = circR(body.hips);
    const waistR = circR(body.waist);
    const chestR = circR(body.chest);
    const shoulderR = cm(body.shoulder) / 2 / X_SCALE;
    const neckR = H * 0.034;
    const bmi = body.weight / (H * H);
    const limb = THREE.MathUtils.clamp(bmi / 22, 0.82, 1.35);
    const headR = H * 0.064;

    const torsoPts: [number, number][] = [
      [hipR * 0.7, 0],
      [hipR, T * 0.1],
      [hipR * 0.98, T * 0.22],
      [waistR, T * 0.46],
      [chestR * 0.97, T * 0.66],
      [chestR, T * 0.76],
      [shoulderR * 0.98, T * 0.9],
      [shoulderR * 0.7, T * 0.97],
      [neckR, T],
    ];
    const shirtPts: [number, number][] = torsoPts
      .filter(([, y]) => y >= T * 0.1)
      .map(([r, y]) => [r * 1.04 + 0.004, y] as [number, number]);
    const pantsTop: [number, number][] = [
      [hipR * 0.74, -0.01],
      [hipR * 1.03, T * 0.1],
      [hipR * 1.01, T * 0.22],
      [waistR * 1.03, T * 0.4],
    ];
    const dressPts: [number, number][] = [
      [hipR * 1.45, -leg * 0.5],
      [hipR * 1.2, -leg * 0.15],
      [hipR * 1.06, T * 0.12],
      [waistR * 1.04, T * 0.46],
      [chestR * 1.03, T * 0.72],
      [chestR * 0.9, T * 0.86],
      [chestR * 0.5, T * 0.9],
    ];

    return {
      H,
      leg,
      T,
      hipR,
      limb,
      headR,
      neckR,
      shoulderR,
      torso: lathe(torsoPts),
      shirt: lathe(shirtPts),
      pantsTop: lathe(pantsTop),
      dress: lathe(dressPts),
      thighR: hipR * 0.52 * limb,
      armLen: H * 0.34,
    };
  }, [body]);

  useFrame(({ clock }) => {
    if (!scan.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.9) + 1) / 2;
    scan.current.position.y = 0.04 + t * (g.H - 0.04);
  });

  const skin = <meshStandardMaterial color={body.skin} roughness={0.55} />;
  const cloth = (c: string) => <meshStandardMaterial color={c} roughness={0.85} />;
  const legX = g.hipR * 0.5 * X_SCALE;
  const hipY = g.leg;
  const shoulderY = hipY + g.T * 0.9;
  const armX = g.shoulderR * X_SCALE * 0.98;
  const bottom = outfit.dress ? null : outfit.bottom;

  return (
    <group>
      {/* torso */}
      <mesh geometry={g.torso} position={[0, hipY, 0]} scale={[X_SCALE, 1, Z_SCALE]} castShadow>
        {skin}
      </mesh>
      {outfit.top && !outfit.dress && (
        <mesh geometry={g.shirt} position={[0, hipY, 0]} scale={[X_SCALE, 1, Z_SCALE]} castShadow>
          {cloth(outfit.top)}
        </mesh>
      )}
      {bottom && (
        <mesh geometry={g.pantsTop} position={[0, hipY, 0]} scale={[X_SCALE, 1, Z_SCALE]}>
          {cloth(bottom)}
        </mesh>
      )}
      {outfit.dress && (
        <mesh geometry={g.dress} position={[0, hipY, 0]} scale={[X_SCALE, 1, Z_SCALE]} castShadow>
          {cloth(outfit.dress)}
        </mesh>
      )}

      {/* neck + head */}
      <mesh position={[0, hipY + g.T + 0.03, 0]}>
        <cylinderGeometry args={[g.neckR, g.neckR * 1.1, 0.08, 20]} />
        {skin}
      </mesh>
      <mesh position={[0, hipY + g.T + 0.07 + g.headR, 0.005]} scale={[0.9, 1.08, 0.95]} castShadow>
        <sphereGeometry args={[g.headR, 32, 32]} />
        {skin}
      </mesh>
      <mesh position={[0, hipY + g.T + 0.08 + g.headR * 1.25, -0.01]} scale={[0.95, 0.7, 1]}>
        <sphereGeometry args={[g.headR * 1.02, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1f1613" roughness={0.9} />
      </mesh>

      {/* legs */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * legX, 0, 0]}>
          <mesh position={[0, g.leg / 2 + 0.03, 0]} castShadow>
            <cylinderGeometry args={[g.thighR, g.thighR * 0.42, g.leg - 0.02, 24]} />
            {bottom ? cloth(bottom) : skin}
          </mesh>
          <mesh position={[0, 0.03, 0.04]}>
            <boxGeometry args={[0.09, 0.06, 0.24]} />
            <meshStandardMaterial color={outfit.shoes ?? "#efe9df"} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* arms */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * armX, shoulderY, 0]} rotation={[0, 0, s * 0.11]}>
          <mesh position={[0, -g.armLen / 2, 0]} castShadow>
            <cylinderGeometry args={[0.042 * g.limb, 0.028 * g.limb, g.armLen, 18]} />
            {skin}
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.046 * g.limb, 18, 18]} />
            {outfit.top && !outfit.dress ? cloth(outfit.top) : skin}
          </mesh>
          {outfit.top && !outfit.dress && (
            <mesh position={[0, -(outfit.longSleeve ? g.armLen * 0.47 : g.armLen * 0.17), 0]}>
              <cylinderGeometry
                args={[
                  0.05 * g.limb,
                  (outfit.longSleeve ? 0.034 : 0.046) * g.limb,
                  outfit.longSleeve ? g.armLen * 0.94 : g.armLen * 0.34,
                  18,
                ]}
              />
              {cloth(outfit.top)}
            </mesh>
          )}
        </group>
      ))}

      {/* scanning ring — the "digital print" sweep */}
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.0025, 8, 80]} />
        <meshBasicMaterial color="#c8f24a" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

export default function BodyTwin3D({ body, outfit }: { body: Body; outfit: Outfit }) {
  const H = cm(body.height);
  return (
    <div className="size-full" data-scene-ready>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, H * 0.6, 3.1], fov: 34 }}>
        <color attach="background" args={["#211915"]} />
        <fog attach="fog" args={["#211915", 4, 9]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.6} color="#ffe2c8" castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={1.1} color="#c8f24a" />
        <Environment resolution={64}>
          <Lightformer intensity={1.4} position={[0, 4, 2]} scale={[6, 6, 1]} />
          <Lightformer intensity={0.8} color="#d9774a" position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>
        <Twin body={body} outfit={outfit} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[0.42, 0.45, 64]} />
          <meshBasicMaterial color="#c8f24a" transparent opacity={0.55} />
        </mesh>
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={3} blur={2.4} far={2} />
        <OrbitControls
          target={[0, H * 0.52, 0]}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.2}
          minDistance={1.6}
          maxDistance={4.5}
          minPolarAngle={0.9}
          maxPolarAngle={1.75}
        />
      </Canvas>
    </div>
  );
}
