/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_DEFAULT_USER_ID?: string;
  readonly VITE_DEFAULT_PROFILE_ID?: string;
  readonly VITE_DEFAULT_PLAN_ID?: string;
  readonly VITE_DEFAULT_PLAN_ITEM_ID?: string;
  readonly VITE_DEFAULT_NEXT_PLAN_ITEM_ID?: string;
  readonly VITE_DEFAULT_SESSION_TYPE?:
    | "diagnostic"
    | "pronunciation_drill"
    | "vocabulary"
    | "free_conversation";
  readonly VITE_DEFAULT_INPUT_LANGUAGE?: string;
  readonly VITE_OPENAI_REALTIME_VOICE?: string;
  readonly VITE_DEFAULT_NATIVE_LANGUAGE?: string;
  readonly VITE_DEFAULT_TARGET_LANGUAGE?: string;
  readonly VITE_DEFAULT_LEVEL?: string;
  readonly VITE_DEFAULT_GOAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}