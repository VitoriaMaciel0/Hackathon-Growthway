const DIRECT_API_BASE_URL = "https://api.simplificagov.com";
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? "/backend" : DIRECT_API_BASE_URL;

const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const EFFECTIVE_ENV_API_BASE_URL =
  !import.meta.env.DEV && (ENV_API_BASE_URL === "/backend" || ENV_API_BASE_URL === "/api/proxy")
    ? DIRECT_API_BASE_URL
    : ENV_API_BASE_URL;

const RAW_API_BASE_URL = (EFFECTIVE_ENV_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
const API_BASE_URL = RAW_API_BASE_URL.endsWith("/")
  ? RAW_API_BASE_URL.slice(0, -1)
  : RAW_API_BASE_URL;

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

type HttpMethod = "GET" | "POST" | "PUT";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${method} ${path} falhou (${response.status}): ${text || "sem detalhes"}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export type SessionType =
  | "diagnostic"
  | "pronunciation_drill"
  | "vocabulary"
  | "free_conversation";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  last_active_at?: string;
}

export interface UserCreatePayload {
  name: string;
  email: string;
}

export interface UserLanguageProfile {
  user_id: string;
  id?: string;
  native_language: string;
  target_language: string;
  current_level: string;
  goal: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserLanguageProfileCreatePayload {
  user_id: string;
  native_language: string;
  target_language: string;
  current_level: string;
  goal?: string | null;
}

export interface PlanItemDraft {
  order_index: number;
  title: string;
  focus: string;
  session_type: Exclude<SessionType, "diagnostic">;
  duration_minutes: number;
  unlocked: boolean;
}

export interface PlanItemRecord extends PlanItemDraft {
  id: string;
  plan_id: string;
  completed_session_id?: string;
}

export interface RecurringErrorItem {
  error: string;
  weight: number;
  last_seen: string;
}

export interface ConfirmedImprovementItem {
  improvement: string;
  evidence?: string;
  at?: string;
  [key: string]: unknown;
}

export interface CoachMemoryRecord {
  id: string;
  user_language_profile_id?: string;
  memory_md?: string;
  recurring_errors?: RecurringErrorItem[];
  confirmed_improvements?: ConfirmedImprovementItem[];
  next_focus?: string;
  sessions_total?: number;
  last_compression_at?: string;
}

interface CreatedSessionResponse {
  id?: string;
  session_id?: string;
}

interface CreatedProfileResponse {
  id?: string;
  profile_id?: string;
}

interface CreatedPlanResponse {
  id?: string;
  plan_id?: string;
}

interface CreatedPlanItemResponse {
  id?: string;
  item_id?: string;
  plan_id?: string;
  order_index?: number;
  title?: string;
  focus?: string;
  session_type?: Exclude<SessionType, "diagnostic">;
  duration_minutes?: number;
  unlocked?: boolean;
  completed_session_id?: string;
}

interface CreatedCoachMemoryResponse {
  id?: string;
  memory_id?: string;
}

interface CreatedUserResponse {
  id?: string;
}

interface CreatedPlanLikeResponse {
  id?: string;
  created_at?: string;
}

function normalizePlanItem(item: Record<string, unknown>): PlanItemRecord {
  const rawId = item.id ?? item.item_id;
  const rawPlanId = item.plan_id;

  if (typeof rawId !== "string" || !rawId.trim()) {
    throw new Error("plan-item sem id válido retornado pelo backend.");
  }

  if (typeof rawPlanId !== "string" || !rawPlanId.trim()) {
    throw new Error("plan-item sem plan_id válido retornado pelo backend.");
  }

  return {
    id: rawId,
    plan_id: rawPlanId,
    order_index: Number(item.order_index ?? 0),
    title: String(item.title ?? "Sessão"),
    focus: String(item.focus ?? "Foco não informado"),
    session_type: (item.session_type as Exclude<SessionType, "diagnostic">) ?? "free_conversation",
    duration_minutes: Number(item.duration_minutes ?? 8),
    unlocked: Boolean(item.unlocked),
    completed_session_id:
      typeof item.completed_session_id === "string" ? item.completed_session_id : undefined,
  };
}

function normalizeUser(record: Record<string, unknown>): UserRecord {
  if (typeof record.id !== "string" || !record.id.trim()) {
    throw new Error("Usuario sem id valido retornado pelo backend.");
  }

  return {
    id: record.id,
    name: String(record.name ?? "Usuario"),
    email: String(record.email ?? ""),
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
    last_active_at: typeof record.last_active_at === "string" ? record.last_active_at : undefined,
  };
}

function normalizeProfile(record: Record<string, unknown>): UserLanguageProfile {
  if (typeof record.user_id !== "string" || !record.user_id.trim()) {
    throw new Error("Perfil sem user_id valido retornado pelo backend.");
  }

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    user_id: record.user_id,
    native_language: String(record.native_language ?? "Portuguese"),
    target_language: String(record.target_language ?? "English"),
    current_level: String(record.current_level ?? "A2"),
    goal: typeof record.goal === "string" ? record.goal : null,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : undefined,
  };
}

export async function listUsers(skip = 0, limit = 100): Promise<UserRecord[]> {
  const data = await request<unknown>("GET", `/api/v1/users/?skip=${skip}&limit=${limit}`);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => normalizeUser(item as Record<string, unknown>));
}

export async function createUser(payload: UserCreatePayload): Promise<UserRecord> {
  const data = await request<CreatedUserResponse & Record<string, unknown>>(
    "POST",
    "/api/v1/users/",
    payload,
  );

  return normalizeUser(data);
}

export async function getOrCreateUserByEmail(payload: UserCreatePayload): Promise<UserRecord> {
  const users = await listUsers(0, 500);
  const existing = users.find((user) => user.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) {
    return existing;
  }

  return createUser(payload);
}

export async function createSession(payload: {
  user_language_profile_id: string;
  session_type: SessionType;
  duration_seconds: number;
}): Promise<string> {
  const data = await request<CreatedSessionResponse>("POST", "/api/v1/sessions/", payload);

  const sessionId = data.session_id ?? data.id;
  if (!sessionId) {
    throw new Error("Backend não retornou session_id ao criar sessão.");
  }

  return sessionId;
}

export async function updateSession(
  sessionId: string,
  payload: {
    ended_at: string;
    feedback_raw: string;
  },
): Promise<void> {
  await request("PUT", `/api/v1/sessions/${sessionId}`, payload);
}

export async function getProfile(profileId: string): Promise<UserLanguageProfile> {
  const data = await request<Record<string, unknown>>("GET", `/api/v1/profiles/${profileId}`);
  return normalizeProfile(data);
}

export async function createProfile(payload: UserLanguageProfileCreatePayload): Promise<UserLanguageProfile> {
  const data = await request<CreatedProfileResponse & Record<string, unknown>>(
    "POST",
    "/api/v1/profiles/",
    payload,
  );
  const profileId = data.profile_id ?? data.id;

  if (!profileId) {
    throw new Error("Backend não retornou profile_id ao criar perfil.");
  }

  return normalizeProfile({
    ...data,
    id: profileId,
    user_id: data.user_id ?? payload.user_id,
    native_language: data.native_language ?? payload.native_language,
    target_language: data.target_language ?? payload.target_language,
    current_level: data.current_level ?? payload.current_level,
    goal: data.goal ?? payload.goal ?? null,
  });
}

export async function getProfilesByUser(userId: string): Promise<UserLanguageProfile[]> {
  const data = await request<unknown>("GET", `/api/v1/profiles/user/${userId}`);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => normalizeProfile(item as Record<string, unknown>));
}

export async function createPlan(payload: {
  user_language_profile_id: string;
  diagnostic_session_id: string;
  plan_json: PlanItemDraft[];
}): Promise<string> {
  const data = await request<CreatedPlanResponse>("POST", "/api/v1/plans/", payload);
  const planId = data.plan_id ?? data.id;

  if (!planId) {
    throw new Error("Backend não retornou plan_id ao criar plano.");
  }

  return planId;
}

export async function getPlansByProfile(profileId: string): Promise<Array<{ id: string; created_at?: string }>> {
  const data = await request<unknown>("GET", `/api/v1/plans/profile/${profileId}`);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => {
      const raw = item as CreatedPlanLikeResponse;
      if (!raw.id) {
        throw new Error("Plano sem id valido retornado pelo backend.");
      }
      return { id: raw.id, created_at: raw.created_at };
    })
    .sort((a, b) => {
      const left = a.created_at ? new Date(a.created_at).getTime() : 0;
      const right = b.created_at ? new Date(b.created_at).getTime() : 0;
      return right - left;
    });
}

export async function createPlanItem(payload: {
  plan_id: string;
  order_index: number;
  title: string;
  focus: string;
  session_type: Exclude<SessionType, "diagnostic">;
  duration_minutes: number;
  unlocked: boolean;
}): Promise<PlanItemRecord> {
  const data = await request<CreatedPlanItemResponse>("POST", "/api/v1/plan-items/", payload);

  return normalizePlanItem({
    id: data.id ?? data.item_id,
    plan_id: data.plan_id ?? payload.plan_id,
    order_index: data.order_index ?? payload.order_index,
    title: data.title ?? payload.title,
    focus: data.focus ?? payload.focus,
    session_type: data.session_type ?? payload.session_type,
    duration_minutes: data.duration_minutes ?? payload.duration_minutes,
    unlocked: data.unlocked ?? payload.unlocked,
    completed_session_id: data.completed_session_id,
  });
}

export async function getPlanItems(planId: string): Promise<PlanItemRecord[]> {
  const data = await request<unknown>("GET", `/api/v1/plan-items/plan/${planId}`);

  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray((data as { items?: unknown[] })?.items)
      ? ((data as { items: unknown[] }).items as unknown[])
      : [];

  const items = rawItems
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => normalizePlanItem(item as Record<string, unknown>))
    .sort((a, b) => a.order_index - b.order_index);

  return items;
}

export async function completePlanItem(itemId: string, completedSessionId: string): Promise<void> {
  await request("PUT", `/api/v1/plan-items/${itemId}`, {
    completed_session_id: completedSessionId,
  });
}

export async function unlockPlanItem(itemId: string): Promise<void> {
  await request("PUT", `/api/v1/plan-items/${itemId}`, {
    unlocked: true,
  });
}

export async function createCoachMemory(payload: {
  user_language_profile_id: string;
  memory_md: string;
}): Promise<string> {
  const data = await request<CreatedCoachMemoryResponse>("POST", "/api/v1/coach-memory/", payload);
  const memoryId = data.memory_id ?? data.id;

  if (!memoryId) {
    throw new Error("Backend não retornou memory_id ao criar coach-memory.");
  }

  return memoryId;
}

export async function getCoachMemoryByProfile(profileId: string): Promise<CoachMemoryRecord | null> {
  const response = await fetch(buildApiUrl(`/api/v1/coach-memory/profile/${profileId}`));

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API GET /api/v1/coach-memory/profile/${profileId} falhou (${response.status}): ${text || "sem detalhes"}`,
    );
  }

  const data = (await response.json()) as unknown;
  const memoryRaw = Array.isArray(data)
    ? data[0]
    : Array.isArray((data as { items?: unknown[] })?.items)
      ? (data as { items: unknown[] }).items[0]
      : data;

  if (!memoryRaw || typeof memoryRaw !== "object") {
    return null;
  }

  const raw = memoryRaw as Record<string, unknown>;
  const memoryId = raw.id ?? raw.memory_id;
  if (typeof memoryId !== "string" || !memoryId.trim()) {
    return null;
  }

  return {
    id: memoryId,
    user_language_profile_id:
      typeof raw.user_language_profile_id === "string" ? raw.user_language_profile_id : undefined,
    memory_md: typeof raw.memory_md === "string" ? raw.memory_md : undefined,
    recurring_errors: Array.isArray(raw.recurring_errors)
      ? (raw.recurring_errors as RecurringErrorItem[])
      : undefined,
    confirmed_improvements: Array.isArray(raw.confirmed_improvements)
      ? raw.confirmed_improvements
          .map((item) => {
            if (item && typeof item === "object") {
              return item as ConfirmedImprovementItem;
            }
            if (typeof item === "string" && item.trim()) {
              return { improvement: item.trim() };
            }
            return null;
          })
          .filter((item): item is ConfirmedImprovementItem => Boolean(item))
      : undefined,
    next_focus: typeof raw.next_focus === "string" ? raw.next_focus : undefined,
    sessions_total: typeof raw.sessions_total === "number" ? raw.sessions_total : undefined,
    last_compression_at:
      typeof raw.last_compression_at === "string" ? raw.last_compression_at : undefined,
  };
}

export async function updateCoachMemory(
  memoryId: string,
  payload: {
    memory_md?: string;
    recurring_errors: RecurringErrorItem[];
    confirmed_improvements: ConfirmedImprovementItem[];
    next_focus: string;
    sessions_total: number;
    last_compression_at: string;
  },
): Promise<void> {
  await request("PUT", `/api/v1/coach-memory/${memoryId}`, payload);
}
