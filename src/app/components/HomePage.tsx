import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { getPlanItems, getPlansByProfile, getProfile, type PlanItemRecord } from "../lib/flueetApi";
import { loadPlanId, loadProfileId, savePlanId } from "../lib/sessionStore";

function sessionTypeLabel(sessionType: PlanItemRecord["session_type"]): string {
  if (sessionType === "pronunciation_drill") {
    return "Pronuncia";
  }
  if (sessionType === "vocabulary") {
    return "Vocabulario";
  }
  return "Conversacao";
}

export function HomePage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<PlanItemRecord[]>([]);
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [currentLevel, setCurrentLevel] = useState("B1");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  const profileId = (import.meta.env.VITE_DEFAULT_PROFILE_ID || loadProfileId() || "").trim();
  const planId = (import.meta.env.VITE_DEFAULT_PLAN_ID || loadPlanId() || "").trim();

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (profileId) {
          const profile = await getProfile(profileId);
          setTargetLanguage(profile.target_language || "English");
          setCurrentLevel(profile.current_level || "B1");
        }

        let resolvedPlanId = planId;
        if (!resolvedPlanId && profileId) {
          const plans = await getPlansByProfile(profileId);
          resolvedPlanId = plans[0]?.id ?? "";
          if (resolvedPlanId) {
            savePlanId(resolvedPlanId);
          }
        }

        if (resolvedPlanId) {
          const planItems = await getPlanItems(resolvedPlanId);
          setItems(planItems);
        } else {
          setItems([]);
        }
      } catch (loadError) {
        setError((loadError as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [planId, profileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimateIn(true), 30);
    return () => window.clearTimeout(timer);
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order_index - b.order_index),
    [items],
  );

  const completedCount = sortedItems.filter((item) => Boolean(item.completed_session_id)).length;
  const availableItem = sortedItems.find((item) => !item.completed_session_id && item.unlocked);
  const progressPercent = sortedItems.length ? (completedCount / sortedItems.length) * 100 : 0;

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
    const currentIndex = sortedItems.findIndex((entry) => entry.id === item.id);
    const nextItem = currentIndex >= 0 ? sortedItems[currentIndex + 1] : undefined;

    navigate("/app/conversation", {
      state: {
        sessionType: item.session_type,
        title: item.title,
        focus: item.focus,
        itemId: item.id,
        nextItemId: nextItem?.id,
        planId,
        profileId,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-10 text-center text-slate-600 border-slate-200/80 shadow-sm">
            Carregando seu caminho de correcao...
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

  if (!planId || sortedItems.length === 0) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 via-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card
            className={`p-10 text-center space-y-5 border-slate-200/80 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)] transition-all duration-700 ${
              animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <h2 className="text-3xl font-bold text-slate-900">Seu caminho de correcao</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Antes de liberar seu plano progressivo, precisamos rodar uma sessao de diagnostico.
            </p>
            <p className="text-sm text-slate-500">{targetLanguage} · {currentLevel}</p>
            <div>
              <Button
                onClick={startDiagnostic}
                className="bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-lg transition-all"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Iniciar diagnostico
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card
          className={`mb-8 p-6 md:p-7 border-slate-200/80 bg-white shadow-[0_18px_42px_-24px_rgba(15,23,42,0.35)] transition-all duration-700 ${
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Seu caminho de correcao</h2>
          <p className="text-slate-600 mb-4">{targetLanguage} · {currentLevel}</p>
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>{completedCount} de {sortedItems.length} sessoes concluidas</span>
            <span className="font-semibold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </Card>

        <div className="space-y-4">
          {sortedItems.map((item, index) => {
            const isCompleted = Boolean(item.completed_session_id);
            const isAvailable = availableItem?.id === item.id;
            const isLocked = !isCompleted && !isAvailable;

            return (
              <div
                key={item.id}
                className={`relative pl-10 transition-all duration-500 ${
                  animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                {index < sortedItems.length - 1 && (
                  <span className="absolute left-[15px] top-8 h-[calc(100%+12px)] w-[2px] bg-slate-200" />
                )}

                <span
                  className={`absolute left-0 top-6 h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-600"
                      : isAvailable
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <PlayCircle className="w-5 h-5" />
                  )}
                </span>

                <Card
                  className={`p-5 md:p-6 border-slate-200/80 transition-all duration-300 hover:shadow-md ${
                    isCompleted
                      ? "opacity-80 bg-white"
                      : isAvailable
                        ? "border-sky-300 bg-white shadow-[0_12px_30px_-20px_rgba(2,132,199,0.55)]"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <Badge variant="outline" className="bg-white">
                      {sessionTypeLabel(item.session_type)}
                    </Badge>
                  </div>

                  <p className="text-slate-700 mb-3">{item.focus}</p>
                  <p className="text-sm text-slate-500 mb-4">Duracao estimada: {item.duration_minutes} min</p>

                  {isCompleted && <p className="text-sm text-emerald-700 font-medium">Concluido</p>}

                  {isLocked && (
                    <p className="text-sm text-slate-500">Complete a anterior para desbloquear</p>
                  )}

                  {isAvailable && (
                    <Button
                      onClick={() => startPlanSession(item)}
                      className="bg-sky-600 hover:bg-sky-700 shadow-sm hover:shadow-md transition-all"
                    >
                      Iniciar sessao
                    </Button>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
