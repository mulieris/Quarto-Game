import { useMemo, useRef, useState } from "react";
import { DoubleSide, Group } from "three";
import { useFrame } from "@react-three/fiber";
import type { PieceDefinition } from "@/logic/quartoTypes";

interface PieceMeshProps {
  piece: PieceDefinition;
  position: [number, number, number];
  selected?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  onSelect?: (id: string) => void;
}

export function PieceMesh({
  piece,
  position,
  selected,
  dimmed,
  interactive,
  onSelect,
}: PieceMeshProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const color = piece.color === "light" ? "#d7b58c" : "#3b2a1f";
  const accent = piece.color === "light" ? "#8f6a45" : "#1a120d";

  const heightScale = piece.height === "tall" ? 1.05 : 0.62;
  const baseRadius = piece.shape === "round" ? 0.34 : 0.0;

  const pulse = useRef(0);
  useFrame((_, dt) => {
    if (!group.current) return;
    const targetY = position[1] + (hovered || selected ? 0.08 : 0);
    group.current.position.y += (targetY - group.current.position.y) * Math.min(1, dt * 10);
    pulse.current += dt;
    const s = 1 + (selected ? 0.04 : 0) * Math.sin(pulse.current * 3);
    group.current.scale.setScalar(s);
  });

  const body = useMemo(() => {
    if (piece.shape === "round") {
      return (
        <mesh castShadow receiveShadow position={[0, heightScale * 0.35, 0]}>
          <cylinderGeometry args={[baseRadius, baseRadius, heightScale * 0.7, 40]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
            metalness={0.08}
            emissive={selected ? "#6d5f4b" : "#000000"}
            emissiveIntensity={selected ? 0.25 : 0}
          />
        </mesh>
      );
    }
    return (
      <mesh castShadow receiveShadow position={[0, heightScale * 0.35, 0]}>
        <boxGeometry args={[0.62, heightScale * 0.7, 0.62]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
          metalness={0.06}
          emissive={selected ? "#6d5f4b" : "#000000"}
          emissiveIntensity={selected ? 0.22 : 0}
        />
      </mesh>
    );
  }, [piece.shape, baseRadius, color, heightScale, selected]);

  const topCap = useMemo(() => {
    if (piece.top === "solid") {
      const y = heightScale * 0.7 + 0.04;
      if (piece.shape === "round") {
        return (
          <mesh castShadow position={[0, y, 0]}>
            <cylinderGeometry args={[baseRadius * 0.92, baseRadius * 0.92, 0.08, 32]} />
            <meshStandardMaterial color={accent} roughness={0.45} metalness={0.12} />
          </mesh>
        );
      }
      return (
        <mesh castShadow position={[0, y, 0]}>
          <boxGeometry args={[0.58, 0.08, 0.58]} />
          <meshStandardMaterial color={accent} roughness={0.45} metalness={0.12} />
        </mesh>
      );
    }
    const y = heightScale * 0.7 + 0.02;
    if (piece.shape === "round") {
      return (
        <group position={[0, y, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseRadius * 0.25, baseRadius * 0.55, 32]} />
            <meshStandardMaterial color={accent} roughness={0.35} metalness={0.2} side={DoubleSide} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[baseRadius * 0.25, baseRadius * 0.25, 0.08, 24]} />
            <meshStandardMaterial color="#0b0b0b" roughness={0.9} metalness={0.05} />
          </mesh>
        </group>
      );
    }
    return (
      <group position={[0, y, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.28, 4]} />
          <meshStandardMaterial color={accent} roughness={0.35} metalness={0.15} side={DoubleSide} />
        </mesh>
      </group>
    );
  }, [piece, baseRadius, heightScale, accent]);

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (interactive) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (interactive) onSelect?.(piece.id);
      }}
    >
      <group visible={!dimmed}>
        {body}
        {topCap}
      </group>
      {dimmed ? (
        <mesh position={[0, heightScale * 0.35, 0]}>
          {piece.shape === "round" ? (
            <cylinderGeometry args={[baseRadius, baseRadius, heightScale * 0.7, 24]} />
          ) : (
            <boxGeometry args={[0.62, heightScale * 0.7, 0.62]} />
          )}
          <meshStandardMaterial color="#a8a29e" roughness={0.8} metalness={0.02} transparent opacity={0.35} />
        </mesh>
      ) : null}
    </group>
  );
}
