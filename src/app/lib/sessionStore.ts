import type { SessionType } from "./flueetApi";

const LATEST_SESSION_KEY = "flueet-latest-session";
const OPENAI_KEY_STORAGE_KEY = "flueet-openai-key";
const USER_ID_STORAGE_KEY = "flueet-user-id";
const USER_NAME_STORAGE_KEY = "flueet-user-name";
const USER_EMAIL_STORAGE_KEY = "flueet-user-email";
const PROFILE_ID_STORAGE_KEY = "flueet-profile-id";
const PLAN_ID_STORAGE_KEY = "flueet-plan-id";
const PLAN_ITEM_ID_STORAGE_KEY = "flueet-plan-item-id";
const NEXT_PLAN_ITEM_ID_STORAGE_KEY = "flueet-next-plan-item-id";
const COACH_MEMORY_ID_STORAGE_KEY = "flueet-coach-memory-id";

export interface SessionTranscriptEntry {
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface LatestSessionData {
  sessionId: string;
  profileId: string;
  sessionType: SessionType;
  sessionTitle?: string;
  sessionFocus?: string;
  planId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  transcript: SessionTranscriptEntry[];
  planItemId?: string;
  nextPlanItemId?: string;
  feedbackRaw?: string;
  postSessionSyncDone?: boolean;
  planGenerated?: boolean;
}

export function loadLatestSession(): LatestSessionData | null {
  const raw = localStorage.getItem(LATEST_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LatestSessionData;
  } catch {
    localStorage.removeItem(LATEST_SESSION_KEY);
    return null;
  }
}

export function saveLatestSession(data: LatestSessionData): void {
  localStorage.setItem(LATEST_SESSION_KEY, JSON.stringify(data));
}

export function loadOpenAiKey(): string {
  return localStorage.getItem(OPENAI_KEY_STORAGE_KEY) ?? "";
}

export function saveOpenAiKey(key: string): void {
  localStorage.setItem(OPENAI_KEY_STORAGE_KEY, key.trim());
}

export function loadUserId(): string {
  return localStorage.getItem(USER_ID_STORAGE_KEY) ?? "";
}

export function saveUserId(userId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, userId.trim());
}

export function loadUserName(): string {
  return localStorage.getItem(USER_NAME_STORAGE_KEY) ?? "";
}

export function saveUserName(name: string): void {
  localStorage.setItem(USER_NAME_STORAGE_KEY, name.trim());
}

export function loadUserEmail(): string {
  return localStorage.getItem(USER_EMAIL_STORAGE_KEY) ?? "";
}

export function saveUserEmail(email: string): void {
  localStorage.setItem(USER_EMAIL_STORAGE_KEY, email.trim());
}

export function loadProfileId(): string {
  return localStorage.getItem(PROFILE_ID_STORAGE_KEY) ?? "";
}

export function saveProfileId(profileId: string): void {
  localStorage.setItem(PROFILE_ID_STORAGE_KEY, profileId.trim());
}

export function loadPlanItemId(): string {
  return localStorage.getItem(PLAN_ITEM_ID_STORAGE_KEY) ?? "";
}

export function savePlanItemId(itemId: string): void {
  localStorage.setItem(PLAN_ITEM_ID_STORAGE_KEY, itemId.trim());
}

export function loadNextPlanItemId(): string {
  return localStorage.getItem(NEXT_PLAN_ITEM_ID_STORAGE_KEY) ?? "";
}

export function saveNextPlanItemId(itemId: string): void {
  localStorage.setItem(NEXT_PLAN_ITEM_ID_STORAGE_KEY, itemId.trim());
}

export function loadPlanId(): string {
  return localStorage.getItem(PLAN_ID_STORAGE_KEY) ?? "";
}

export function savePlanId(planId: string): void {
  localStorage.setItem(PLAN_ID_STORAGE_KEY, planId.trim());
}

export function loadCoachMemoryId(): string {
  return localStorage.getItem(COACH_MEMORY_ID_STORAGE_KEY) ?? "";
}

export function saveCoachMemoryId(memoryId: string): void {
  localStorage.setItem(COACH_MEMORY_ID_STORAGE_KEY, memoryId.trim());
}
