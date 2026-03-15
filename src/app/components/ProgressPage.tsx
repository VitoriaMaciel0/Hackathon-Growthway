import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  Clock,
  Compass,
  FileAudio,
  PlayCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import {
  completePlanItem,
  createPlan,
  createPlanItem,
  getPlanItems,
  getPlansByProfile,
  getProfile,
  unlockPlanItem,
  updateSession,
  type PlanItemRecord,
} from "../lib/flueetApi";
import {
  loadLatestSession,
  loadOpenAiKey,
  loadPlanId,
  loadProfileId,
  saveLatestSession,
  savePlanId,
  type LatestSessionData,
} from "../lib/sessionStore";
import {
  generateCorrectionPlanFromDiagnostic,
  generateSessionFeedback,
} from "../lib/openai";

function planSessionTypeLabel(sessionType: PlanItemRecord["session_type"]): string {
  if (sessionType === "pronunciation_drill") {
    return "Pronuncia";
  }
  if (sessionType === "vocabulary") {
    return "Vocabulario";
  }
  return "Conversacao";
}

function genericSessionTypeLabel(
  sessionType: PlanItemRecord["session_type"] | LatestSessionData["sessionType"],
): string {
  if (sessionType === "diagnostic") {
    return "Diagnostico";
  }
  return planSessionTypeLabel(sessionType as PlanItemRecord["session_type"]);
}

function minutesFromDurationSeconds(durationSeconds?: number): number {
  if (!durationSeconds) {
    return 0;
  }
  return Math.max(1, Math.round(durationSeconds / 60));
}

export function ProgressPage() {
  const navigate = useNavigate();

  const [targetLanguage, setTargetLanguage] = useState("English");
  const [currentLevel, setCurrentLevel] = useState("B1");
  const [items, setItems] = useState<PlanItemRecord[]>([]);
  const [activePlanId, setActivePlanId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [latestSession, setLatestSession] = useState<LatestSessionData | null>(() => loadLatestSession());

  const profileId = (import.meta.env.VITE_DEFAULT_PROFILE_ID || loadProfileId() || "").trim();
  const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY || loadOpenAiKey() || "").trim();

  useEffect(() => {
    const syncLatestSession = async () => {
      const session = latestSession;
      if (!session || session.postSessionSyncDone) {
        return;
      }

      setSyncStatus("Sincronizando ultima sessao...");

      try {
        const isLocalSession =
          session.sessionId.startsWith("local-") || session.profileId === "local-profile";

        const endedAt = session.endedAt ?? new Date().toISOString();
        const durationSeconds =
          session.durationSeconds ||
          Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000));

        let feedbackRaw = session.feedbackRaw?.trim() ?? "";
        if (!feedbackRaw && openAiApiKey) {
          feedbackRaw = await generateSessionFeedback(openAiApiKey, {
            sessionType: session.sessionType,
            durationSeconds,
            transcript: session.transcript,
          });
        }

        if (!isLocalSession && feedbackRaw) {
          await updateSession(session.sessionId, {
            ended_at: endedAt,
            feedback_raw: feedbackRaw,
          });
        }

        const updatedSession: LatestSessionData = {
          ...session,
          endedAt,
          durationSeconds,
          feedbackRaw,
        };

        if (!isLocalSession && session.sessionType === "diagnostic" && openAiApiKey && feedbackRaw) {
          const planDraft = await generateCorrectionPlanFromDiagnostic(openAiApiKey, feedbackRaw);
          const createdPlanId = await createPlan({
            user_language_profile_id: session.profileId,
            diagnostic_session_id: session.sessionId,
            plan_json: planDraft,
          });

          for (const item of planDraft) {
            await createPlanItem({
              plan_id: createdPlanId,
              order_index: item.order_index,
              title: item.title,
              focus: item.focus,
              session_type: item.session_type,
              duration_minutes: item.duration_minutes,
              unlocked: item.unlocked,
            });
          }

          savePlanId(createdPlanId);
          updatedSession.planId = createdPlanId;
          updatedSession.planGenerated = true;
        }

        if (!isLocalSession && session.sessionType !== "diagnostic") {
          if (session.planItemId) {
            await completePlanItem(session.planItemId, session.sessionId);
          }

          if (session.nextPlanItemId) {
            await unlockPlanItem(session.nextPlanItemId);
          }
        }

        updatedSession.postSessionSyncDone = true;
        saveLatestSession(updatedSession);
        setLatestSession(updatedSession);
        setSyncStatus("Sessao sincronizada com sucesso.");
      } catch (syncError) {
        setSyncStatus((syncError as Error).message || "Nao foi possivel sincronizar a ultima sessao.");
      }
    };

    syncLatestSession();
  }, [latestSession, openAiApiKey]);

  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!profileId) {
          setItems([]);
          setActivePlanId("");
          setIsLoading(false);
          return;
        }

        const profile = await getProfile(profileId);
        setTargetLanguage(profile.target_language || "English");
        setCurrentLevel(profile.current_level || "B1");

        let resolvedPlanId = (import.meta.env.VITE_DEFAULT_PLAN_ID || loadPlanId() || "").trim();
        if (!resolvedPlanId) {
          const plans = await getPlansByProfile(profileId);
          resolvedPlanId = plans[0]?.id ?? "";
          if (resolvedPlanId) {
            savePlanId(resolvedPlanId);
          }
        }

        setActivePlanId(resolvedPlanId);

        if (!resolvedPlanId) {
          setItems([]);
          return;
        }

        const planItems = await getPlanItems(resolvedPlanId);
        setItems(planItems.sort((a, b) => a.order_index - b.order_index));
      } catch (loadError) {
        setError((loadError as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [profileId, latestSession?.planId, latestSession?.postSessionSyncDone]);

  const completedCount = items.filter((item) => Boolean(item.completed_session_id)).length;
  const totalCount = items.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextItem = items.find((item) => !item.completed_session_id && item.unlocked);

  const completedMinutes = items
    .filter((item) => Boolean(item.completed_session_id))
    .reduce((sum, item) => sum + item.duration_minutes, 0);
  const latestMinutes = minutesFromDurationSeconds(latestSession?.durationSeconds);
  const practicedMinutes = completedMinutes + latestMinutes;
  const avgSessionMinutes = completedCount ? Math.round(completedMinutes / completedCount) : latestMinutes;

  const completedPronunciation = items.filter(
    (item) => item.completed_session_id && item.session_type === "pronunciation_drill",
  ).length;
  const completedVocabulary = items.filter(
    (item) => item.completed_session_id && item.session_type === "vocabulary",
  ).length;
  const completedConversation = items.filter(
    (item) => item.completed_session_id && item.session_type === "free_conversation",
  ).length;
  const completedTotalByType = completedPronunciation + completedVocabulary + completedConversation;

  const transcriptLines = latestSession?.transcript?.length ?? 0;
  const transcriptPreview = (latestSession?.transcript ?? []).slice(-3);

  const achievements = [
    {
      title: "Primeira sessao",
      description: "Concluir a primeira sessao da jornada.",
      unlocked: completedCount >= 1,
    },
    {
      title: "Ritmo consistente",
      description: "Acumular pelo menos 30 minutos de pratica.",
      unlocked: practicedMinutes >= 30,
    },
    {
      title: "Metade da trilha",
      description: "Chegar a 50% de conclusao do plano.",
      unlocked: progressPercent >= 50,
    },
    {
      title: "Reta final",
      description: "Chegar a 80% de conclusao do plano.",
      unlocked: progressPercent >= 80,
    },
  ];

  const startDiagnostic = () => {
    if (!profileId) {
      navigate("/onboarding", { replace: true });
      return;
    }

    navigate("/app/conversation", {
      state: {
        sessionType: "diagnostic",
        title: "Diagnostico inicial",
        focus: "Avaliacao geral de pronuncia, vocabulario e fluencia",
        profileId,
      },
    });
  };

  const startPlanSession = (item: PlanItemRecord) => {
    const currentIndex = items.findIndex((entry) => entry.id === item.id);
    const next = currentIndex >= 0 ? items[currentIndex + 1] : undefined;

    navigate("/app/conversation", {
      state: {
        sessionType: item.session_type,
        title: item.title,
        focus: item.focus,
        itemId: item.id,
        nextItemId: next?.id,
        planId: activePlanId,
        profileId,
      },
    });
  };

  const continueNextSession = () => {
    if (!nextItem) {
      startDiagnostic();
      return;
    }
    startPlanSession(nextItem);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-10 text-center text-slate-600 border-slate-200/80 shadow-sm">
            Carregando progresso...
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-10 text-center border-red-200 bg-red-50/60 shadow-sm">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => navigate(0)} variant="outline">
              Tentar novamente
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-10 text-center border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">Configure seu perfil</h2>
            <p className="text-slate-600">Precisamos do onboarding para montar seu progresso.</p>
            <Button onClick={() => navigate("/onboarding", { replace: true })}>Ir para onboarding</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="mb-8 p-6 md:p-7 border-slate-200/80 bg-white shadow-[0_18px_42px_-24px_rgba(15,23,42,0.35)]">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Seu progresso</h2>
          <p className="text-slate-600 mb-4">{targetLanguage} · {currentLevel}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <Card className="p-4 border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Sessoes concluidas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{completedCount}/{totalCount || 0}</p>
            </Card>

            <Card className="p-4 border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Minutos praticados</span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{practicedMinutes}</p>
            </Card>

            <Card className="p-4 border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status do plano</span>
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{progressPercent}%</p>
            </Card>

            <Card className="p-4 border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Media por sessao</span>
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{avgSessionMinutes || 0} min</p>
            </Card>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Andamento da trilha</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />

          {syncStatus && <p className="mt-3 text-sm text-slate-600">{syncStatus}</p>}

          {nextItem && (
            <p className="mt-3 text-sm text-slate-600">
              Proxima sessao: <span className="font-semibold text-slate-800">{nextItem.title}</span>
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={continueNextSession} className="bg-sky-600 hover:bg-sky-700">
              <PlayCircle className="w-4 h-4 mr-2" />
              {nextItem ? "Continuar jornada" : "Iniciar diagnostico"}
            </Button>
            <Button onClick={() => navigate("/app/conversation")} variant="outline">
              Sessao livre
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 p-6 border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Distribuicao de treino</h3>
            </div>

            {completedTotalByType === 0 ? (
              <p className="text-sm text-slate-600">
                Complete algumas sessoes para ver sua distribuicao por habilidade.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-700 mb-1">
                    <span>Pronuncia</span>
                    <span className="font-medium">{completedPronunciation}</span>
                  </div>
                  <Progress
                    value={(completedPronunciation / completedTotalByType) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm text-slate-700 mb-1">
                    <span>Vocabulario</span>
                    <span className="font-medium">{completedVocabulary}</span>
                  </div>
                  <Progress
                    value={(completedVocabulary / completedTotalByType) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm text-slate-700 mb-1">
                    <span>Conversacao</span>
                    <span className="font-medium">{completedConversation}</span>
                  </div>
                  <Progress
                    value={(completedConversation / completedTotalByType) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-4 h-4 text-sky-600" />
              <h3 className="text-lg font-semibold text-slate-900">Foco recomendado</h3>
            </div>

            {nextItem ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Proxima etapa da jornada</p>
                <p className="font-semibold text-slate-900">{nextItem.title}</p>
                <p className="text-sm text-slate-700">{nextItem.focus}</p>
                <p className="text-xs text-slate-500">
                  Tipo: {planSessionTypeLabel(nextItem.session_type)} · {nextItem.duration_minutes} min
                </p>
                <Button onClick={() => startPlanSession(nextItem)} className="w-full bg-sky-600 hover:bg-sky-700">
                  Iniciar agora
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Nao ha uma proxima etapa destravada no momento.
                </p>
                <Button onClick={startDiagnostic} className="w-full bg-sky-600 hover:bg-sky-700">
                  Novo diagnostico
                </Button>
              </div>
            )}
          </Card>

          <Card className="xl:col-span-2 p-6 border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileAudio className="w-4 h-4 text-violet-600" />
              <h3 className="text-lg font-semibold text-slate-900">Ultima sessao</h3>
            </div>

            {!latestSession ? (
              <p className="text-sm text-slate-600">Ainda nao encontramos uma sessao recente salva.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="p-3 border-slate-200">
                    <p className="text-xs text-slate-500">Tipo</p>
                    <p className="font-semibold text-slate-900 mt-1">
                      {genericSessionTypeLabel(latestSession.sessionType)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-xs text-slate-500">Duracao</p>
                    <p className="font-semibold text-slate-900 mt-1">
                      {minutesFromDurationSeconds(latestSession.durationSeconds)} min
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-xs text-slate-500">Falas transcritas</p>
                    <p className="font-semibold text-slate-900 mt-1">{transcriptLines}</p>
                  </Card>
                </div>

                {transcriptPreview.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Trecho recente</p>
                    <div className="space-y-2">
                      {transcriptPreview.map((entry, index) => (
                        <p key={`${entry.at}-${index}`} className="text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900 mr-1">
                            {entry.role === "assistant" ? "AI:" : "Voce:"}
                          </span>
                          {entry.text}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6 border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Conquistas</h3>
            </div>

            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.title}
                  className={`rounded-lg border p-3 ${
                    achievement.unlocked
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{achievement.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{achievement.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
