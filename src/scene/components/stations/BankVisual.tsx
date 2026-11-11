import { Html, Edges } from '@react-three/drei';
export function BankVisual({ position, hideLabel }: { position: [number, number, number]; hideLabel: boolean }) {
  return <group position={position}>
    <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[7, 7, 7]} /><meshStandardMaterial color="#14232a" metalness={.85} roughness={.25} /><Edges color="#e4bd6c" /></mesh>
    {[0, Math.PI / 2].map(angle => <mesh key={angle} rotation={[angle, 0, Math.PI / 4]}><torusGeometry args={[9, .35, 8, 40]} /><meshStandardMaterial color="#d4aa56" emissive="#c99c43" emissiveIntensity={.35} metalness={.8} roughness={.2} /></mesh>)}
    {[-1, 1].map(sign => <mesh key={sign} position={[0, sign * 5, 0]}><octahedronGeometry args={[2]} /><meshStandardMaterial color="#f6dfa0" emissive="#dfb752" emissiveIntensity={.4} /></mesh>)}
    {!hideLabel && <Html position={[0, 12, 0]} center distanceFactor={50} zIndexRange={[5, 0]} style={{ pointerEvents: 'none', color: '#f6dfa0', whiteSpace: 'nowrap' }}>◈ Meridian Reserve Bank</Html>}
  </group>;
}
