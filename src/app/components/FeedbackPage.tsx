import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Clock,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  completePlanItem,
  createCoachMemory,
  createPlan,
  createPlanItem,
  getCoachMemoryByProfile,
  getPlanItems,
  getPlansByProfile,
  getProfile,
  unlockPlanItem,
  updateCoachMemory,
  updateSession,
  type RecurringErrorItem,
} from "../lib/flueetApi";
import { Progress } from "./ui/progress";
import {
  extractRecurringErrorsFromMemoryMarkdown,
  generateFeedbackInsightsJson,
  generateCorrectionPlanFromDiagnostic,
  generateInitialCoachMemoryMarkdown,
  generateSessionFeedback,
  type FeedbackInsights,
  updateCoachMemoryWithFeedback,
} from "../lib/openai";
import {
  loadLatestSession,
  loadOpenAiKey,
  saveCoachMemoryId,
  saveLatestSession,
  savePlanId,
  type LatestSessionData,
} from "../lib/sessionStore";

function renderInlineMarkdown(text: string): ReactNode[] {
  const chunks = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return chunks.map((chunk, index) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return <strong key={`bold-${index}`}>{chunk.slice(2, -2)}</strong>;
    }

    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code key={`code-${index}`} className="rounded bg-slate-100 px-1 py-0.5 text-xs">
          {chunk.slice(1, -1)}
        </code>
      );
    }

    return <span key={`text-${index}`}>{chunk}</span>;
  });
}

function MarkdownRenderer({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const elements: ReactNode[] = [];
  let bulletItems: string[] = [];
  let numberItems: string[] = [];

  const flushBulletItems = () => {
    if (!bulletItems.length) {
      return;
    }

    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-1 text-slate-700">
        {bulletItems.map((item, index) => (
          <li key={`li-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );

    bulletItems = [];
  };

  const flushNumberItems = () => {
    if (!numberItems.length) {
      return;
    }

    elements.push(
      <ol key={`ol-${elements.length}`} className="list-decimal pl-6 space-y-1 text-slate-700">
        {numberItems.map((item, index) => (
          <li key={`oli-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>,
    );

    numberItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushBulletItems();
      flushNumberItems();
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushNumberItems();
      bulletItems.push(trimmed.slice(2).trim());
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushBulletItems();
      numberItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushBulletItems();
    flushNumberItems();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-slate-900">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${elements.length}`} className="mt-2 text-xl font-bold text-slate-900">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${elements.length}`} className="mt-2 text-2xl font-bold text-slate-900">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>,
      );
      return;
    }

    elements.push(
      <p key={`p-${elements.length}`} className="text-slate-700 leading-relaxed">
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushBulletItems();
  flushNumberItems();

  return <div className="space-y-3">{elements}</div>;
}

function normalizeRecurringErrors(
  items: Array<{ error: string; weight: number; last_seen?: string }>,
  nowIso: string,
): RecurringErrorItem[] {
  return items
    .filter((item) => item && typeof item.error === "string" && item.error.trim())
    .map((item) => ({
      error: item.error.trim(),
      weight: Math.max(0.1, Number(item.weight || 0.1)),
      last_seen: item.last_seen || nowIso,
    }));
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const barColor =
    value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-sky-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <Card className="p-4 border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </Card>
  );
}

export function FeedbackPage() {
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<LatestSessionData | null>(null);
  const [feedbackMarkdown, setFeedbackMarkdown] = useState("");
  const [feedbackInsights, setFeedbackInsights] = useState<FeedbackInsights | null>(null);
  const [status, setStatus] = useState("Aguardando dados da sessao...");
  const [postStatus, setPostStatus] = useState("Aguardando...");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planProgress, setPlanProgress] = useState<{
    total: number;
    completed: number;
    percent: number;
    nextTitle?: string;
    planId?: string;
  } | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);

  const openAiApiKey = useMemo(
    () => (import.meta.env.VITE_OPENAI_API_KEY || loadOpenAiKey() || "").trim(),
    [],
  );

  const buildFallbackInsights = (session: LatestSessionData, rawFeedback: string): FeedbackInsights => {
    const transcriptCount = session.transcript.length;
    const estimatedBase = Math.max(45, Math.min(80, 50 + Math.round(transcriptCount * 0.8)));

    return {
      resumo:
        rawFeedback.slice(0, 360) ||
        "Sessao concluida com sucesso. Continue praticando para consolidar fluencia e clareza.",
      fluencia: estimatedBase,
      pronuncia: Math.max(40, estimatedBase - 3),
      vocabulario: Math.max(42, estimatedBase - 1),
      gramatica: Math.max(40, estimatedBase - 4),
      clareza: Math.max(42, estimatedBase - 2),
      pontos_fortes: ["Participacao ativa", "Boa continuidade de fala"],
      pontos_de_atencao: ["Estabilizar pronuncia", "Refinar estruturas gramaticais"],
      proximo_passo: "Faca uma sessao focada em ritmo e clareza nas respostas curtas.",
    };
  };

  useEffect(() => {
    const run = async () => {
      const latestSession = loadLatestSession();
      if (!latestSession) {
        setStatus("Nenhuma sessao recente encontrada.");
        return;
      }

      setSessionData(latestSession);

      if (!openAiApiKey) {
        setError("OPENAI API Key nao encontrada. Configure VITE_OPENAI_API_KEY.");
        setStatus("Nao foi possivel processar o feedback.");
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const isLocalSession =
          latestSession.sessionId.startsWith("local-") || latestSession.profileId === "local-profile";
        const endedAt = latestSession.endedAt ?? new Date().toISOString();
        const durationSeconds =
          latestSession.durationSeconds ||
          Math.max(0, Math.round((Date.now() - new Date(latestSession.startedAt).getTime()) / 1000));

        let feedback = latestSession.feedbackRaw?.trim() ?? "";
        if (!feedback) {
          setStatus("Gerando feedback com OpenAI...");
          feedback = await generateSessionFeedback(openAiApiKey, {
            sessionType: latestSession.sessionType,
            durationSeconds,
            transcript: latestSession.transcript,
          });
        }

        let backendAvailable = !isLocalSession;
        if (backendAvailable) {
          try {
            setStatus("Salvando feedback no backend...");
            await updateSession(latestSession.sessionId, {
              ended_at: endedAt,
              feedback_raw: feedback,
            });
          } catch {
            backendAvailable = false;
            setStatus("Feedback gerado em modo local (backend indisponivel/CORS).");
          }
        } else {
          setStatus("Feedback gerado em modo local.");
        }

        const updatedSession: LatestSessionData = {
          ...latestSession,
          endedAt,
          durationSeconds,
          feedbackRaw: feedback,
        };

        saveLatestSession(updatedSession);
        setSessionData(updatedSession);
        setFeedbackMarkdown(feedback);

        setIsSummarizing(true);
        try {
          const insights = await generateFeedbackInsightsJson(openAiApiKey, {
            sessionType: updatedSession.sessionType,
            durationSeconds,
            transcript: updatedSession.transcript,
            feedbackRaw: feedback,
          });
          setFeedbackInsights(insights);
        } catch {
          setFeedbackInsights(buildFallbackInsights(updatedSession, feedback));
        } finally {
          setIsSummarizing(false);
        }

        setStatus("Feedback pronto.");

        if (!backendAvailable) {
          const finalizedLocal: LatestSessionData = {
            ...updatedSession,
            postSessionSyncDone: true,
          };
          saveLatestSession(finalizedLocal);
          setSessionData(finalizedLocal);
          setPostStatus("Backend bloqueado por CORS. Sessao concluida localmente.");
          return;
        }

        if (updatedSession.postSessionSyncDone) {
          setPostStatus("Sincronizacao da sessao ja concluida.");
          return;
        }

        setIsSyncing(true);

        if (updatedSession.sessionType === "diagnostic") {
          setPostStatus("Gerando plano de correcao (6-8 sessoes)...");

          const profile = await getProfile(updatedSession.profileId);
          const planDraft = await generateCorrectionPlanFromDiagnostic(openAiApiKey, feedback);
          const nextFocus = planDraft[0]?.focus || "Consolidar base de comunicacao oral";
          const nowIso = new Date().toISOString();
          const dateLabel = new Date().toLocaleDateString("pt-BR");

          const memoryMarkdownPromise = generateInitialCoachMemoryMarkdown(openAiApiKey, {
            targetLanguage: profile.target_language,
            currentLevel: profile.current_level,
            dateLabel,
            nextFocus,
            feedbackRaw: feedback,
          });

          const planFlowPromise = (async () => {
            const createdPlanId = await createPlan({
              user_language_profile_id: updatedSession.profileId,
              diagnostic_session_id: updatedSession.sessionId,
              plan_json: planDraft,
            });
            savePlanId(createdPlanId);

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

            return createdPlanId;
          })();

          const memoryFlowPromise = (async () => {
            const memoryMd = await memoryMarkdownPromise;
            const memoryId = await createCoachMemory({
              user_language_profile_id: updatedSession.profileId,
              memory_md: memoryMd,
            });
            saveCoachMemoryId(memoryId);

            const recurringFromMarkdown = extractRecurringErrorsFromMemoryMarkdown(memoryMd).map((item) => ({
              ...item,
              last_seen: nowIso,
            }));

            await updateCoachMemory(memoryId, {
              memory_md: memoryMd,
              recurring_errors: normalizeRecurringErrors(recurringFromMarkdown, nowIso),
              confirmed_improvements: [],
              next_focus: nextFocus,
              sessions_total: 1,
              last_compression_at: nowIso,
            });
          })();

          const createdPlanId = await planFlowPromise;
          await memoryFlowPromise;

          const finalizedSession: LatestSessionData = {
            ...updatedSession,
            planId: createdPlanId,
            planGenerated: true,
            postSessionSyncDone: true,
          };

          saveLatestSession(finalizedSession);
          setSessionData(finalizedSession);
          setPostStatus("Plano e memoria criados. Redirecionando para o dashboard...");
          setTimeout(() => navigate("/app", { replace: true }), 900);
          return;
        }

        setPostStatus("Atualizando progresso da sessao...");

        if (updatedSession.planItemId) {
          await completePlanItem(updatedSession.planItemId, updatedSession.sessionId);
        }

        if (updatedSession.nextPlanItemId) {
          await unlockPlanItem(updatedSession.nextPlanItemId);
        }

        const existingMemory = await getCoachMemoryByProfile(updatedSession.profileId);
        if (existingMemory?.id && existingMemory.memory_md) {
          const nowIso = new Date().toISOString();
          const memoryUpdate = await updateCoachMemoryWithFeedback(openAiApiKey, {
            currentMemoryMd: existingMemory.memory_md,
            feedbackRaw: feedback,
          });

          await updateCoachMemory(existingMemory.id, {
            memory_md: memoryUpdate.memory_md,
            recurring_errors: normalizeRecurringErrors(memoryUpdate.recurring_errors, nowIso),
            confirmed_improvements: memoryUpdate.confirmed_improvements,
            next_focus: memoryUpdate.next_focus || "Consolidar melhoria recente",
            sessions_total: (existingMemory.sessions_total ?? 1) + 1,
            last_compression_at: nowIso,
          });
          saveCoachMemoryId(existingMemory.id);
        }

        const finalizedSession: LatestSessionData = {
          ...updatedSession,
          postSessionSyncDone: true,
        };

        saveLatestSession(finalizedSession);
        setSessionData(finalizedSession);
        setPostStatus("Sessao sincronizada com sucesso.");
      } catch (runError) {
        setError((runError as Error).message);
        setStatus("Falha no processamento do feedback.");
        setPostStatus("Nao foi possivel concluir a sincronizacao desta sessao.");
      } finally {
        setIsGenerating(false);
        setIsSyncing(false);
      }
    };

    run();
  }, [navigate, openAiApiKey]);

  useEffect(() => {
    const loadProgress = async () => {
      if (!sessionData || !sessionData.profileId || sessionData.profileId === "local-profile") {
        setPlanProgress(null);
        return;
      }

      setIsProgressLoading(true);
      try {
        let resolvedPlanId = sessionData.planId;
        if (!resolvedPlanId) {
          const plans = await getPlansByProfile(sessionData.profileId);
          resolvedPlanId = plans[0]?.id;
        }

        if (!resolvedPlanId) {
          setPlanProgress({ total: 0, completed: 0, percent: 0 });
          return;
        }

        const items = await getPlanItems(resolvedPlanId);
        const total = items.length;
        const completed = items.filter((item) => Boolean(item.completed_session_id)).length;
        const next = items
          .sort((a, b) => a.order_index - b.order_index)
          .find((item) => !item.completed_session_id && item.unlocked);

        setPlanProgress({
          total,
          completed,
          percent: total ? Math.round((completed / total) * 100) : 0,
          nextTitle: next?.title,
          planId: resolvedPlanId,
        });
      } catch {
        setPlanProgress(null);
      } finally {
        setIsProgressLoading(false);
      }
    };

    loadProgress();
  }, [sessionData?.planId, sessionData?.postSessionSyncDone, sessionData?.profileId]);

  const isFeedbackReady = Boolean(feedbackMarkdown.trim());
  const isDiagnosticSession = sessionData?.sessionType === "diagnostic";
  const canReturnToDashboard =
    isFeedbackReady &&
    (!isDiagnosticSession || Boolean(sessionData?.postSessionSyncDone));

  const metricCards = feedbackInsights
    ? [
        { label: "Fluencia", value: feedbackInsights.fluencia },
        { label: "Pronuncia", value: feedbackInsights.pronuncia },
        { label: "Vocabulario", value: feedbackInsights.vocabulario },
        { label: "Gramatica", value: feedbackInsights.gramatica },
        { label: "Clareza", value: feedbackInsights.clareza },
      ]
    : [];

  if (!sessionData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sem sessao para avaliar</h2>
          <p className="text-slate-600 mb-6">Inicie uma sessao em Conversacao para gerar feedback.</p>
          <Button onClick={() => navigate("/app/conversation")} className="bg-blue-600 hover:bg-blue-700">
            Ir para Conversacao
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Feedback da Sessao</h2>
        <p className="text-slate-600">
          {isDiagnosticSession
            ? "Resultado do teste inicial com preparacao automatica da sua jornada de estudo."
            : "Resumo personalizado da sua evolucao nesta sessao."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2.2fr)_360px]">
        <Card className="p-7 md:p-8 border-slate-200/80 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>{status}</span>
            </div>

            {(isGenerating || isSyncing || isSummarizing) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {isGenerating
                    ? "Gerando feedback"
                    : isSummarizing
                      ? "Estruturando indicadores"
                      : "Sincronizando sessao"}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!isFeedbackReady && !isGenerating && (
            <p className="text-slate-600">Ainda nao ha feedback disponivel para esta sessao.</p>
          )}

          {isFeedbackReady && (
            <div className="space-y-7">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resumo executivo</h3>
                <p className="mt-3 text-xl leading-relaxed text-slate-900">
                  {feedbackInsights?.resumo || "Seu feedback esta pronto e foi estruturado para facilitar sua evolucao."}
                </p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-slate-200/80 bg-slate-50/70">
                  <h4 className="text-sm font-semibold text-slate-800">Pontos fortes</h4>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(feedbackInsights?.pontos_fortes?.length
                      ? feedbackInsights.pontos_fortes
                      : ["Participacao ativa na conversa", "Boa capacidade de continuidade"]
                    ).map((item, index) => (
                      <li key={`forte-${index}`}>- {item}</li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-4 border-slate-200/80 bg-slate-50/70">
                  <h4 className="text-sm font-semibold text-slate-800">Pontos de atencao</h4>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(feedbackInsights?.pontos_de_atencao?.length
                      ? feedbackInsights.pontos_de_atencao
                      : ["Refinar pronuncia em frases longas", "Aumentar precisao gramatical"]
                    ).map((item, index) => (
                      <li key={`atencao-${index}`}>- {item}</li>
                    ))}
                  </ul>
                </Card>
              </section>

              <section className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                <h4 className="text-sm font-semibold text-sky-900">Proximo passo recomendado</h4>
                <p className="mt-2 text-sky-900/90 leading-relaxed">
                  {feedbackInsights?.proximo_passo || "Faca uma sessao curta focada em fluidez com respostas objetivas."}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Analise detalhada</h4>
                <div className="rounded-xl border border-slate-200 p-4">
                  <MarkdownRenderer markdown={feedbackMarkdown} />
                </div>
              </section>
            </div>
          )}
        </Card>

        <aside className="space-y-4">
          <Card className="p-4 border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-slate-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">Progresso</span>
            </div>

            {isProgressLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Atualizando progresso...</span>
              </div>
            ) : planProgress ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{planProgress.completed} de {planProgress.total} sessoes</span>
                  <span className="font-semibold">{planProgress.percent}%</span>
                </div>
                <Progress value={planProgress.percent} className="h-2" />
                {planProgress.nextTitle && (
                  <p className="text-sm text-slate-600">
                    Proxima sessao: <span className="font-medium text-slate-800">{planProgress.nextTitle}</span>
                  </p>
                )}
                {isDiagnosticSession && <p className="text-xs text-slate-500">{postStatus}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sem dados de progresso disponiveis para esta sessao.</p>
            )}
          </Card>

          <Card className="p-4 border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-slate-700">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Dados da sessao</span>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="text-slate-500">Tipo:</span> {sessionData.sessionType}</p>
              <p><span className="text-slate-500">Duracao:</span> {sessionData.durationSeconds}s</p>
              <p><span className="text-slate-500">Transcricoes:</span> {sessionData.transcript.length}</p>
              <p className="break-all text-xs text-slate-500 pt-1">session_id: {sessionData.sessionId}</p>
            </div>
          </Card>

          {metricCards.map((metric) => (
            <ScoreCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </aside>
      </div>

      {canReturnToDashboard && (
        <div className="mt-6 flex justify-end">
          <Button onClick={() => navigate("/app", { replace: true })} className="bg-blue-600 hover:bg-blue-700">
            Voltar ao dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
