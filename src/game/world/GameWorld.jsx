// Placeholder 3D world contents. During Phase 1 this renders an empty,
// well-lit scene so the R3F pipeline is proven end-to-end. The recycled
// endless highway, traffic, day/night cycle, and scenery are added in
// later phases.
export function GameWorld() {
  return (
    <group>
      {/* Ambient + key light so later meshes are visible immediately */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />

      {/* Ground plane placeholder (replaced by the endless highway later) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[200, 400]} />
        <meshStandardMaterial color="#10151f" />
      </mesh>

      {/* Reference marker for camera framing validation */}
      <mesh position={[0, 0.5, -20]}>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>
    </group>
  )
}

export default GameWorld
