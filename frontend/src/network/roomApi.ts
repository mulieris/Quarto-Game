const API_BASE = "/api";

export interface CreateRoomResponse {
  room_id: string;
  player_secret: string;
  seat: 1 | 2;
}

export interface JoinRoomResponse {
  room_id: string;
  player_secret: string;
  seat: 1 | 2;
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
  } catch {
    /* ignore */
  }
  return "error_unknown";
}

export async function createRoom(): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_BASE}/rooms`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as CreateRoomResponse;
}

export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}/join`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as JoinRoomResponse;
}

export async function getRoom(roomId: string, playerSecret: string): Promise<unknown> {
  const res = await fetch(
    `${API_BASE}/rooms/${encodeURIComponent(roomId)}?player_secret=${encodeURIComponent(playerSecret)}`,
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
