import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AlertCircle,
  Mic,
  RefreshCw,
  Sparkles,
  StopCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  createProfile,
  createSession,
  getProfile,
  type SessionType,
} from "../lib/flueetApi";
import {
  loadNextPlanItemId,
  loadOpenAiKey,
  loadPlanId,
  loadPlanItemId,
  loadProfileId,
  loadUserId,
  savePlanId,
  saveLatestSession,
  saveNextPlanItemId,
  savePlanItemId,
  saveProfileId,
  type LatestSessionData,
  type SessionTranscriptEntry,
} from "../lib/sessionStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioTranscript?: boolean;
}

interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface ConversationRouteState {
  sessionType?: SessionType;
  title?: string;
  focus?: string;
  inputLanguage?: string;
  itemId?: string;
  nextItemId?: string;
  planId?: string;
  profileId?: string;
}

interface PromptProfileContext {
  native_language: string;
  target_language: string;
  current_level: string;
  goal: string | null;
}

const OUTPUT_SAMPLE_RATE = 24_000;

const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en",
  english: "en",
  "en-us": "en",
  "en-gb": "en",
  pt: "pt",
  portuguese: "pt",
  portugues: "pt",
  "pt-br": "pt",
  "pt-pt": "pt",
  es: "es",
  spanish: "es",
  espanol: "es",
  fr: "fr",
  french: "fr",
  francais: "fr",
  de: "de",
  german: "de",
  it: "it",
  italian: "it",
  zh: "zh",
  mandarin: "zh",
  chinese: "zh",
  "zh-cn": "zh",
  "zh-tw": "zh",
  ja: "ja",
  japanese: "ja",
  ko: "ko",
  korean: "ko",
};

function normalizeLanguageKey(rawValue: string | null | undefined): string {
  return (rawValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolveTranscriptionLanguageCode(candidates: Array<string | null | undefined>): string | undefined {
  for (const candidate of candidates) {
    const normalized = normalizeLanguageKey(candidate);
    if (!normalized) {
      continue;
    }

    const mapped = LANGUAGE_CODE_MAP[normalized];
    if (mapped) {
      return mapped;
    }

    // Accept plain language code like "en" or locale like "en-US".
    if (/^[a-z]{2}(-[a-z]{2})?$/i.test(normalized)) {
      return normalized.slice(0, 2);
    }
  }

  return undefined;
}

function resolveSessionType(rawSessionType: string | undefined): SessionType {
  if (rawSessionType === "diagnostic") {
    return "diagnostic";
  }
  if (rawSessionType === "pronunciation_drill") {
    return "pronunciation_drill";
  }
  if (rawSessionType === "vocabulary") {
    return "vocabulary";
  }
  return "free_conversation";
}

function pcm16ToBase64(float32Samples: Float32Array): string {
  const pcm16 = new Int16Array(float32Samples.length);
  for (let i = 0; i < float32Samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Samples[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToPcm16(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    float32[i] = int16[i] / 0x8000;
  }

  return float32;
}

function buildSystemPrompt(
  profile: PromptProfileContext,
  sessionType: SessionType,
  focus?: string,
  title?: string,
): string {
  const promptLines = [
    `You are a language coach for a student learning ${profile.target_language}.`,
    `Their native language is ${profile.native_language}, current level is ${profile.current_level},`,
    `and their goal is ${profile.goal || "improve speaking confidence"}.`,
    "",
    `Speak naturally in ${profile.target_language} at a pace appropriate for ${profile.current_level}.`,
    "Correct pronunciation errors inline without interrupting - fold the correction",
    "naturally into your response.",
    "If the student is stuck, simplify the question or offer an anchor. Never give",
    "the full answer directly.",
    `Session type: ${sessionType}.`,
  ];

  if (sessionType === "diagnostic") {
    promptLines.push(
      "This is a diagnostic session. Encourage free speaking, sample pronunciation, vocabulary and fluency.",
    );
  }

  if (title) {
    promptLines.push(`Session title: ${title}.`);
  }

  if (focus) {
    promptLines.push(
      `This session focuses on: ${focus}. Prioritize correcting this specific issue throughout the conversation.`,
    );
  }

  return promptLines.join("\n");
}

function buildFallbackProfile(): PromptProfileContext {
  return {
    native_language: import.meta.env.VITE_DEFAULT_NATIVE_LANGUAGE || "Portuguese",
    target_language: import.meta.env.VITE_DEFAULT_TARGET_LANGUAGE || "English",
    current_level: import.meta.env.VITE_DEFAULT_LEVEL || "A2",
    goal: import.meta.env.VITE_DEFAULT_GOAL || "Improve spoken communication for work",
  };
}

export function ConversationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state ?? {}) as ConversationRouteState;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Toque no círculo para iniciar sua sessão em tempo real. Eu vou te responder por voz automaticamente.",
      timestamp: new Date(),
    },
  ]);
  const [status, setStatus] = useState("Toque no círculo para iniciar a sessão.");
  const [isSessionStarting, setIsSessionStarting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [activeSession, setActiveSession] = useState<LatestSessionData | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  const messagesRef = useRef<Message[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackCursorRef = useRef(0);
  const transcriptRef = useRef<SessionTranscriptEntry[]>([]);
  const pendingAssistantMessageIdRef = useRef<string | null>(null);
  const isMicEnabledRef = useRef(false);
  const activeSessionRef = useRef<LatestSessionData | null>(null);

  const profileId = (
    routeState.profileId ||
    import.meta.env.VITE_DEFAULT_PROFILE_ID ||
    loadProfileId() ||
    ""
  ).trim();
  const planId = (routeState.planId || import.meta.env.VITE_DEFAULT_PLAN_ID || loadPlanId() || "").trim();
  const planItemId = (routeState.itemId || import.meta.env.VITE_DEFAULT_PLAN_ITEM_ID || loadPlanItemId() || "").trim();
  const nextPlanItemId = (
    routeState.nextItemId ||
    import.meta.env.VITE_DEFAULT_NEXT_PLAN_ITEM_ID ||
    loadNextPlanItemId() ||
    ""
  ).trim();
  const sessionType = routeState.sessionType ?? resolveSessionType(import.meta.env.VITE_DEFAULT_SESSION_TYPE);
  const sessionTitle = routeState.title?.trim() || "";
  const sessionFocus = routeState.focus?.trim() || "";
  const routeInputLanguage = routeState.inputLanguage?.trim() || "";
  const realtimeVoice = (import.meta.env.VITE_OPENAI_REALTIME_VOICE || "alloy").trim();
  const userId = (import.meta.env.VITE_DEFAULT_USER_ID || loadUserId() || "").trim();
  const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY || loadOpenAiKey() || "").trim();

  const missingConfigs: string[] = [];
  if (!openAiApiKey) {
    missingConfigs.push("VITE_OPENAI_API_KEY");
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (profileId) {
      saveProfileId(profileId);
    }
    if (planId) {
      savePlanId(planId);
    }
    if (planItemId) {
      savePlanItemId(planItemId);
    }
    if (nextPlanItemId) {
      saveNextPlanItemId(nextPlanItemId);
    }
  }, [nextPlanItemId, planId, planItemId, profileId]);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    return () => {
      cleanupAudio();
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!isSessionActive || !activeSession?.startedAt) {
      return;
    }

    const updateElapsed = () => {
      const elapsed = Math.max(
        0,
        Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000),
      );
      setSessionElapsedSeconds(elapsed);
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSession?.startedAt, isSessionActive]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const transcriptCards = messages.filter((message) => message.audioTranscript || message.role === "assistant");

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const appendTranscript = (entry: SessionTranscriptEntry) => {
    transcriptRef.current = [...transcriptRef.current, entry];
  };

  const appendAssistantDelta = (delta: string) => {
    if (!delta) {
      return;
    }

    const existingId = pendingAssistantMessageIdRef.current;
    if (!existingId) {
      const messageId = `assistant-${Date.now()}`;
      pendingAssistantMessageIdRef.current = messageId;
      addMessage({
        id: messageId,
        role: "assistant",
        content: delta,
        timestamp: new Date(),
      });
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === existingId
          ? {
              ...msg,
              content: `${msg.content}${delta}`,
            }
          : msg,
      ),
    );
  };

  const finalizeAssistantMessage = () => {
    const pendingId = pendingAssistantMessageIdRef.current;
    if (!pendingId) {
      return;
    }

    const completedMessage = messagesRef.current.find((msg) => msg.id === pendingId);
    if (completedMessage?.content.trim()) {
      appendTranscript({
        role: "assistant",
        text: completedMessage.content,
        at: new Date().toISOString(),
      });
    }

    pendingAssistantMessageIdRef.current = null;
  };

  const enqueueAssistantAudio = (base64Delta: string) => {
    const context = audioContextRef.current;
    if (!context || !base64Delta) {
      return;
    }

    if (context.state !== "running") {
      context.resume().catch(() => {
        // Ignora falhas de resume; proxima interação do usuário deve destravar áudio.
      });
    }

    const samples = base64ToPcm16(base64Delta);
    const audioBuffer = context.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    const channelData = audioBuffer.getChannelData(0);
    channelData.set(samples);

    const sourceNode = context.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(context.destination);

    const now = context.currentTime;
    const startAt = Math.max(now, playbackCursorRef.current);
    sourceNode.start(startAt);
    playbackCursorRef.current = startAt + audioBuffer.duration;
  };

  const handleRealtimeEvent = (event: RealtimeEvent) => {
    if (event.type === "error") {
      const errorMessage = String((event.error as { message?: string })?.message || "Erro desconhecido");
      setStatus(`Erro na sessão: ${errorMessage}`);
      return;
    }

    if (event.type === "response.output_audio.delta" || event.type === "response.audio.delta") {
      enqueueAssistantAudio(String(event.delta || ""));
      return;
    }

    if (
      event.type === "response.output_text.delta" ||
      event.type === "response.text.delta" ||
      event.type === "response.output_audio_transcript.delta" ||
      event.type === "response.audio_transcript.delta"
    ) {
      appendAssistantDelta(String(event.delta || ""));
      return;
    }

    if (event.type === "response.done") {
      finalizeAssistantMessage();
      return;
    }

    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcript = String(event.transcript || "").trim();
      if (!transcript) {
        return;
      }

      addMessage({
        id: `user-audio-${Date.now()}`,
        role: "user",
        content: transcript,
        timestamp: new Date(),
        audioTranscript: true,
      });
      appendTranscript({
        role: "user",
        text: transcript,
        at: new Date().toISOString(),
      });
      return;
    }

    if (event.type === "input_audio_buffer.speech_started") {
      setStatus("Detectamos sua fala. Continue...");
      return;
    }

    if (event.type === "input_audio_buffer.speech_stopped") {
      setStatus("Processando resposta da IA...");
    }
  };

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    gainRef.current?.disconnect();
    gainRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const context = audioContextRef.current;
    audioContextRef.current = null;
    playbackCursorRef.current = 0;

    if (context) {
      context.close().catch(() => {
        // Ignora falhas de fechamento do contexto de áudio.
      });
    }
  };

  const startMicrophoneStreaming = async (ws: WebSocket) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    mediaStreamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    await audioContext.resume();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const muteGain = audioContext.createGain();
    muteGain.gain.value = 0;

    source.connect(processor);
    processor.connect(muteGain);
    muteGain.connect(audioContext.destination);

    processor.onaudioprocess = (audioEvent) => {
      if (ws.readyState !== WebSocket.OPEN || !isMicEnabledRef.current) {
        return;
      }

      const channelData = audioEvent.inputBuffer.getChannelData(0);
      const base64Audio = pcm16ToBase64(channelData);
      ws.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        }),
      );
    };

    sourceRef.current = source;
    processorRef.current = processor;
    gainRef.current = muteGain;
  };

  const startSession = async () => {
    if (isSessionStarting || isSessionActive) {
      return;
    }

    if (missingConfigs.length > 0) {
      alert(`Variáveis ausentes no .env: ${missingConfigs.join(", ")}`);
      return;
    }

    setIsSessionStarting(true);
    setStatus("Preparando sessao...");

    try {
      let resolvedProfileId = profileId;
      let sessionId = `local-${crypto.randomUUID()}`;
      let backendSessionAvailable = false;

      if (!resolvedProfileId) {
        if (userId) {
          try {
            setStatus("Criando perfil no backend...");
            const createdProfile = await createProfile({
              ...buildFallbackProfile(),
              user_id: userId,
            });
            resolvedProfileId = createdProfile.id || "";
            if (resolvedProfileId) {
              saveProfileId(resolvedProfileId);
            }
          } catch {
            setStatus("Nao foi possivel criar perfil no backend. Sessao em modo local.");
          }
        } else {
          setStatus("Usuario nao encontrado para criar perfil. Sessao em modo local.");
        }
      }

      if (resolvedProfileId) {
        try {
          setStatus("Criando sessao no backend...");
          sessionId = await createSession({
            user_language_profile_id: resolvedProfileId,
            session_type: sessionType,
            duration_seconds: 0,
          });
          backendSessionAvailable = true;
        } catch {
          setStatus("Backend indisponivel/CORS. Sessao iniciada em modo local.");
        }
      } else {
        setStatus("Sem profile_id no backend. Sessao iniciada em modo local.");
      }

      let profile = buildFallbackProfile();
      if (resolvedProfileId) {
        saveProfileId(resolvedProfileId);
      }

      if (resolvedProfileId) {
        try {
          setStatus("Carregando perfil de idioma...");
          profile = await getProfile(resolvedProfileId);
        } catch {
          setStatus(
            backendSessionAvailable
              ? "Nao foi possivel ler perfil no backend. Usando perfil local padrao."
              : "Sessao local ativa com perfil padrao.",
          );
        }
      }

      const instructions = buildSystemPrompt(profile, sessionType, sessionFocus, sessionTitle);
      const transcriptionLanguage = resolveTranscriptionLanguageCode([
        routeInputLanguage,
        profile.target_language,
        profile.native_language,
        import.meta.env.VITE_DEFAULT_INPUT_LANGUAGE,
      ]);

      transcriptRef.current = [];
      pendingAssistantMessageIdRef.current = null;

      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        ["realtime", `openai-insecure-api-key.${openAiApiKey}`, "openai-beta.realtime-v1"],
      );
      wsRef.current = ws;

      ws.onmessage = (msgEvent) => {
        try {
          const realtimeEvent = JSON.parse(msgEvent.data) as RealtimeEvent;
          handleRealtimeEvent(realtimeEvent);
        } catch {
          // Ignora payloads inesperados.
        }
      };

      ws.onerror = () => {
        setStatus("Falha ao conectar na Realtime API.");
        setIsSessionStarting(false);
      };

      ws.onclose = () => {
        setIsSessionActive(false);
        setIsMicEnabled(false);
      };

      ws.onopen = async () => {
        try {
          ws.send(
            JSON.stringify({
              type: "session.update",
              session: {
                voice: realtimeVoice,
                modalities: ["audio", "text"],
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                  model: "gpt-4o-mini-transcribe",
                  ...(transcriptionLanguage ? { language: transcriptionLanguage } : {}),
                },
                turn_detection: {
                  type: "server_vad",
                  silence_duration_ms: 800,
                  threshold: 0.5,
                },
                instructions,
              },
            }),
          );

          await startMicrophoneStreaming(ws);

          const startedAt = new Date().toISOString();
          const sessionData: LatestSessionData = {
            sessionId,
            profileId: resolvedProfileId || "local-profile",
            sessionType,
            sessionTitle: sessionTitle || undefined,
            sessionFocus: sessionFocus || undefined,
            planId: planId || undefined,
            startedAt,
            durationSeconds: 0,
            transcript: [],
            planItemId: planItemId || undefined,
            nextPlanItemId: nextPlanItemId || undefined,
          };

          setActiveSession(sessionData);
          saveLatestSession(sessionData);

          setIsSessionActive(true);
          setIsMicEnabled(true);
          setStatus(
            transcriptionLanguage
              ? `Sessão ativa. Reconhecimento de voz em ${transcriptionLanguage.toUpperCase()}.`
              : "Sessão ativa. Fale naturalmente.",
          );
          setIsSessionStarting(false);

          addMessage({
            id: `assistant-ready-${Date.now()}`,
            role: "assistant",
            content:
              "Sessão iniciada. Pode falar no idioma alvo que vou responder em tempo real.",
            timestamp: new Date(),
          });
        } catch (error) {
          setIsSessionStarting(false);
          setStatus("Falha ao iniciar microfone/sessão.");
          ws.close();
          cleanupAudio();
          alert((error as Error).message);
        }
      };
    } catch (error) {
      setIsSessionStarting(false);
      setStatus("Erro ao preparar sessão.");
      alert((error as Error).message);
    }
  };

  const stopSessionAndFinish = () => {
    if (isEndingSession) {
      return;
    }

    const currentSession = activeSessionRef.current;
    if (!currentSession) {
      alert("Nenhuma sessão ativa para encerrar.");
      return;
    }

    setIsEndingSession(true);
    setStatus("Encerrando sessão...");

    finalizeAssistantMessage();

    const endedAt = new Date().toISOString();
    const startedAtMs = new Date(currentSession.startedAt).getTime();
    const durationSeconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      wsRef.current.close();
    }

    cleanupAudio();

    const finalizedSession: LatestSessionData = {
      ...currentSession,
      endedAt,
      durationSeconds,
      transcript: transcriptRef.current,
    };

    saveLatestSession(finalizedSession);
    setActiveSession(finalizedSession);
    setIsSessionActive(false);
    setIsMicEnabled(false);

    const nextRoute =
      finalizedSession.sessionType === "diagnostic" ? "/app/feedback" : "/app/progress";
    navigate(nextRoute, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-7 flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sessão de Conversação</h2>
        <p className="text-slate-600">Treine por voz em tempo real com uma interface limpa e foco total na conversa.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
        <section className="min-h-[760px] px-1 sm:px-2">
          <div className="flex h-[760px] flex-col">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                      isSessionActive ? "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.15)]" : "bg-slate-300"
                    }`}
                  />
                  {isSessionActive ? "Conectado" : "Aguardando início"}
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {formatDuration(sessionElapsedSeconds)}
                </div>
              </div>

              {(sessionTitle || sessionFocus) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                  {sessionTitle && <p className="font-semibold text-slate-800">{sessionTitle}</p>}
                  {sessionFocus && <p className="mt-1 text-slate-600">Foco: {sessionFocus}</p>}
                </div>
              )}

              {missingConfigs.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Adicione no `.env`: {missingConfigs.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <button
                type="button"
                onClick={startSession}
                disabled={isSessionStarting || isSessionActive || missingConfigs.length > 0}
                className={`relative h-48 w-48 rounded-full border-0 text-white shadow-xl transition-all duration-500 ${
                  isSessionActive
                    ? "bg-gradient-to-br from-emerald-500 to-cyan-600 scale-[1.02]"
                    : "bg-gradient-to-br from-sky-600 to-indigo-700 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                }`}
              >
                {isSessionActive && <span className="absolute inset-0 rounded-full animate-ping border-4 border-cyan-200/70" />}
                <span className="absolute inset-0 rounded-full ring-8 ring-sky-100/50" />
                <span className="relative flex h-full flex-col items-center justify-center gap-2">
                  {isSessionStarting ? (
                    <>
                      <RefreshCw className="h-10 w-10 animate-spin" />
                      <span className="font-semibold">Iniciando...</span>
                    </>
                  ) : isSessionActive ? (
                    <>
                      <Sparkles className="h-10 w-10" />
                      <span className="font-semibold">Sessão ativa</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-10 w-10" />
                      <span className="font-semibold">Iniciar sessão</span>
                    </>
                  )}
                </span>
              </button>

              <p className="mt-4 min-h-[40px] text-sm text-slate-600 transition-colors duration-300">{status}</p>

              {activeSession && (
                <p className="text-xs text-slate-500 break-all">session_id: {activeSession.sessionId}</p>
              )}
            </div>

            <div className="mt-auto space-y-3 border-t border-slate-200/80 pt-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tipo</p>
                  <p className="mt-1 font-semibold text-slate-800">{sessionType}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Duração</p>
                  <p className="mt-1 font-semibold text-slate-800">{formatDuration(sessionElapsedSeconds)}</p>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={stopSessionAndFinish}
                disabled={!isSessionActive || isEndingSession}
                className="h-11"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                {isEndingSession
                  ? "Encerrando..."
                  : sessionType === "diagnostic"
                    ? "Encerrar e ver feedback"
                    : "Encerrar e ir para progresso"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="flex h-[760px] min-h-[620px] flex-col rounded-2xl border border-slate-200/70 bg-white/65 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Transcrições da Sessão</p>
            <p className="text-xs text-slate-500">{transcriptCards.length} registros</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {transcriptCards.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                Inicie a sessão para visualizar as transcrições em tempo real.
              </div>
            )}

            {transcriptCards.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {message.role === "assistant" ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                        Flueet AI
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 text-emerald-600" />
                        Voz do usuário
                      </>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </aside>
      </div>
    </div>
  );
}
