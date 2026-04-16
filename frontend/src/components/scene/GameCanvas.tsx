import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, SoftShadows } from "@react-three/drei";
import type { ElementRef, RefObject } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import { cellToWorld, traySlotWorld } from "@/lib/boardCoords";
import { PieceMesh } from "@/components/scene/PieceMesh";
import type { BoardGrid } from "@/logic/quartoTypes";
import { canUserActFromSnapshot, useGameStore } from "@/store/gameStore";

function findCellOfPiece(board: BoardGrid, pieceId: string): { row: number; col: number } | null {
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (board[r][c] === pieceId) return { row: r, col: c };
    }
  }
  return null;
}

function BoardCells({
  onPlace,
  legalMask,
  hovered,
  setHovered,
  winning,
}: {
  onPlace: (r: number, c: number) => void;
  legalMask: boolean[][];
  hovered: { r: number; c: number } | null;
  setHovered: (v: { r: number; c: number } | null) => void;
  winning: { row: number; col: number }[];
}) {
  const winSet = useMemo(() => new Set(winning.map((w) => `${w.row},${w.col}`)), [winning]);
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const [x, , z] = cellToWorld(r, c);
      const isLegal = legalMask[r][c];
      const isWin = winSet.has(`${r},${c}`);
      const isHover = hovered?.r === r && hovered?.c === c;
      cells.push(
        <group key={`${r}-${c}`} position={[x, 0, z]}>
          <mesh
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.01, 0]}
            onPointerOver={() => setHovered({ r, c })}
            onPointerOut={() => setHovered(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (isLegal) onPlace(r, c);
            }}
          >
            <planeGeometry args={[0.96, 0.96]} />
            <meshStandardMaterial
              color={isWin ? "#f0d9a8" : "#efe6d8"}
              emissive={isWin ? "#c9a46b" : isLegal ? "#bfe0cf" : "#000000"}
              emissiveIntensity={isWin ? 0.35 : isLegal ? (isHover ? 0.22 : 0.12) : 0}
              roughness={0.9}
              metalness={0.02}
            />
          </mesh>
        </group>,
      );
    }
  }
  return <group>{cells}</group>;
}

function SceneContent({
  cameraReset,
  orbitRef,
}: {
  cameraReset: number;
  orbitRef: RefObject<ElementRef<typeof OrbitControls> | null>;
}) {
  const board = useGameStore((s) => s.board);
  const pieces = useGameStore((s) => s.pieces);
  const phase = useGameStore((s) => s.currentPhase);
  const selected = useGameStore((s) => s.selectedPieceId);
  const winner = useGameStore((s) => s.winner);
  const winningCells = useGameStore((s) => s.winningCells);
  const selectPiece = useGameStore((s) => s.selectPiece);
  const placePiece = useGameStore((s) => s.placePiece);
  const snapshot = useGameStore();

  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  const canAct = canUserActFromSnapshot(snapshot);
  const canSelectTray = canAct && phase === "select_piece";
  const canPlace = canAct && phase === "place_piece";

  const legalMask = useMemo(() => {
    const m = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => false));
    if (!canPlace) return m;
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (board[r][c] === null) m[r][c] = true;
      }
    }
    return m;
  }, [board, canPlace]);

  const trayIndexById = useMemo(() => {
    const unused = pieces
      .filter((p) => !p.used)
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id));
    const map = new Map<string, number>();
    unused.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [pieces]);

  useEffect(() => {
    const ctrl = orbitRef.current;
    if (!ctrl) return;
    ctrl.target.set(0.2, 0, 0.2);
    ctrl.object.position.set(0.2, 6.4, 7.2);
    ctrl.update();
  }, [cameraReset, orbitRef]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[4, 10, 2]}
        intensity={1.05}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <hemisphereLight args={["#f7f1e6", "#6b7c86", 0.35]} />
      <SoftShadows size={12} samples={12} focus={0.4} />
      <group>
        <mesh receiveShadow position={[0.8, -0.08, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial color="#e8dfd2" roughness={0.95} metalness={0.02} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.8, -0.04, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.2, 5.2]} />
          <meshStandardMaterial color="#d8c7ae" roughness={0.82} metalness={0.04} />
        </mesh>
        <BoardCells
          onPlace={(r, c) => placePiece(r, c)}
          legalMask={legalMask}
          hovered={hoveredCell}
          setHovered={setHoveredCell}
          winning={winningCells}
        />
        {pieces.map((piece) => {
          const onBoard = findCellOfPiece(board, piece.id);
          let pos: [number, number, number];
          if (onBoard) {
            const [x, , z] = cellToWorld(onBoard.row, onBoard.col);
            const h = piece.height === "tall" ? 0.42 : 0.28;
            pos = [x, h, z];
          } else if (piece.used) {
            return null;
          } else {
            const idx = trayIndexById.get(piece.id) ?? 0;
            const [x, y, z] = traySlotWorld(idx);
            pos = [x, y + (piece.height === "tall" ? 0.12 : 0.06), z];
          }
          const isSelected = selected === piece.id;
          const interactive = canSelectTray && !piece.used && !onBoard;
          return (
            <PieceMesh
              key={piece.id}
              piece={piece}
              position={pos}
              selected={isSelected}
              dimmed={Boolean(winner || snapshot.draw) && !onBoard && !piece.used}
              interactive={interactive}
              onSelect={(id) => selectPiece(id)}
            />
          );
        })}
      </group>
      <ContactShadows opacity={0.35} scale={12} blur={2.4} far={4} position={[0.8, -0.03, 0.4]} />
      <Environment preset="city" />
      <OrbitControls
        // drei ref typing allows null; runtime ref is valid
        ref={orbitRef as never}
        makeDefault
        enablePan={false}
        minPolarAngle={0.45}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={5}
        maxDistance={14}
        target={new Vector3(0.2, 0, 0.2)}
      />
    </>
  );
}

export function GameCanvas({ cameraReset }: { cameraReset: number }) {
  const orbitRef = useRef<ElementRef<typeof OrbitControls> | null>(null);
  return (
    <div className="canvas-shell h-full w-full min-h-[240px] overflow-hidden rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200 shadow-inner">
      <Canvas
        className="h-full w-full"
        shadows
        camera={{ position: [0.2, 6.4, 7.2], fov: 42 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneContent cameraReset={cameraReset} orbitRef={orbitRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
