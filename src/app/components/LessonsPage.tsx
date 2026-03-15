import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Lock,
  Play,
  Target,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { loadUserId } from "../lib/sessionStore";

interface LessonTemplate {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  level: "Basico" | "Intermediario" | "Avancado";
  category: string;
  objective: string;
  tasks: string[];
}

interface LessonProgressState {
  started: boolean;
  completed: boolean;
  doneTaskIds: string[];
  progress: number;
  lastUpdatedAt?: string;
}

type LessonsProgressMap = Record<string, LessonProgressState>;

interface LessonView extends LessonTemplate {
  locked: boolean;
  started: boolean;
  completed: boolean;
  progress: number;
  doneTaskIds: string[];
}

const DEFAULT_LESSONS: LessonTemplate[] = [
  {
    id: "lesson-1",
    title: "Introducao a Reunioes em Ingles",
    description: "Aprenda frases-chave para abrir, conduzir e encerrar reunioes de forma profissional.",
    durationMinutes: 15,
    level: "Basico",
    category: "Reunioes",
    objective: "Conseguir participar de reunioes curtas com seguranca.",
    tasks: [
      "Ler o vocabulário essencial da lição",
      "Praticar 8 frases de abertura em voz alta",
      "Responder o mini desafio de encerramento",
    ],
  },
  {
    id: "lesson-2",
    title: "Email Profissional Objetivo",
    description: "Estruture emails claros com tom corporativo e chamadas para acao.",
    durationMinutes: 18,
    level: "Basico",
    category: "Comunicacao Escrita",
    objective: "Escrever emails mais claros e diretos no contexto de trabalho.",
    tasks: [
      "Revisar estrutura de email (assunto, abertura, pedido, fechamento)",
      "Montar 1 email de follow-up",
      "Corrigir 3 erros comuns de formalidade",
    ],
  },
  {
    id: "lesson-3",
    title: "Vocabulário para Alinhamento de Projeto",
    description: "Use termos de planejamento, prazo e prioridade com naturalidade.",
    durationMinutes: 20,
    level: "Intermediario",
    category: "Projetos",
    objective: "Ganhar repertorio para discutir status de projeto com fluidez.",
    tasks: [
      "Memorizar 12 termos de projeto",
      "Montar 5 frases com prazo e prioridade",
      "Fazer role-play curto de checkpoint",
    ],
  },
  {
    id: "lesson-4",
    title: "Apresentacao de Resultados",
    description: "Organize ideias para apresentar progresso, risco e proximo passo.",
    durationMinutes: 22,
    level: "Intermediario",
    category: "Apresentacoes",
    objective: "Apresentar resultados com mais clareza e impacto.",
    tasks: [
      "Preparar abertura de 30 segundos",
      "Explicar 2 indicadores de desempenho",
      "Concluir com recomendacao objetiva",
    ],
  },
  {
    id: "lesson-5",
    title: "Negociacao e Contraproposta",
    description: "Treine linguagem diplomatica para negociar escopo, tempo e custo.",
    durationMinutes: 25,
    level: "Avancado",
    category: "Negociacao",
    objective: "Sustentar contrapropostas de forma profissional e colaborativa.",
    tasks: [
      "Praticar 6 frases de contraproposta",
      "Simular objeção do cliente",
      "Fechar acordo com resumo claro",
    ],
  },
  {
    id: "lesson-6",
    title: "Conversa Estrategica com Stakeholders",
    description: "Gerencie perguntas dificeis e conduza discussoes executivas com confianca.",
    durationMinutes: 28,
    level: "Avancado",
    category: "Lideranca",
    objective: "Conduzir conversas estrategicas sem perder clareza.",
    tasks: [
      "Estruturar resposta para pergunta dificil",
      "Defender prioridade de negocio com argumentos",
      "Registrar proximo passo com dono e prazo",
    ],
  },
];

function lessonsStorageKey(userId: string): string {
  return `flueet-lessons-progress:${userId || "guest"}`;
}

function loadLessonsProgress(storageKey: string): LessonsProgressMap {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as LessonsProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    localStorage.removeItem(storageKey);
    return {};
  }
}

function buildTaskId(lessonId: string, taskIndex: number): string {
  return `${lessonId}-task-${taskIndex}`;
}

function lessonProgressFromTasks(doneTaskIds: string[], taskCount: number): number {
  if (taskCount <= 0) {
    return 0;
  }
  return Math.round((doneTaskIds.length / taskCount) * 100);
}

function getLevelColor(level: LessonTemplate["level"]): string {
  if (level === "Basico") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (level === "Intermediario") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-rose-100 text-rose-700";
}

export function LessonsPage() {
  const userId = loadUserId() || "guest";
  const storageKey = lessonsStorageKey(userId);

  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [progressMap, setProgressMap] = useState<LessonsProgressMap>(() => loadLessonsProgress(storageKey));
  const [activeLessonId, setActiveLessonId] = useState<string>(DEFAULT_LESSONS[0].id);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(progressMap));
  }, [progressMap, storageKey]);

  const lessonViews = useMemo<LessonView[]>(() => {
    return DEFAULT_LESSONS.map((lesson, index) => {
      const prevLessonId = index > 0 ? DEFAULT_LESSONS[index - 1].id : null;
      const prevCompleted = prevLessonId ? Boolean(progressMap[prevLessonId]?.completed) : true;

      const state = progressMap[lesson.id] || {
        started: false,
        completed: false,
        doneTaskIds: [],
        progress: 0,
      };

      const progressByTasks = lessonProgressFromTasks(state.doneTaskIds, lesson.tasks.length);
      const completed = state.completed || progressByTasks === 100;

      return {
        ...lesson,
        locked: !prevCompleted,
        started: state.started || state.doneTaskIds.length > 0,
        completed,
        progress: completed ? 100 : progressByTasks,
        doneTaskIds: state.doneTaskIds,
      };
    });
  }, [progressMap]);

  const categories = [
    "Todos",
    ...Array.from(new Set(DEFAULT_LESSONS.map((lesson) => lesson.category))),
  ];

  const filteredLessons =
    selectedCategory === "Todos"
      ? lessonViews
      : lessonViews.filter((lesson) => lesson.category === selectedCategory);

  const completedLessons = lessonViews.filter((lesson) => lesson.completed).length;
  const totalLessons = lessonViews.length;
  const globalProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const activeLesson = lessonViews.find((lesson) => lesson.id === activeLessonId) || lessonViews[0];

  const setLessonStarted = (lessonId: string) => {
    const lesson = lessonViews.find((item) => item.id === lessonId);
    if (!lesson || lesson.locked) {
      return;
    }

    setProgressMap((prev) => {
      const current = prev[lessonId] || {
        started: false,
        completed: false,
        doneTaskIds: [],
        progress: 0,
      };

      return {
        ...prev,
        [lessonId]: {
          ...current,
          started: true,
          progress: lessonProgressFromTasks(current.doneTaskIds, lesson.tasks.length),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });

    setActiveLessonId(lessonId);
  };

  const toggleTask = (lessonId: string, taskIndex: number) => {
    const lesson = lessonViews.find((item) => item.id === lessonId);
    if (!lesson || lesson.locked) {
      return;
    }

    const taskId = buildTaskId(lessonId, taskIndex);

    setProgressMap((prev) => {
      const current = prev[lessonId] || {
        started: false,
        completed: false,
        doneTaskIds: [],
        progress: 0,
      };

      const alreadyDone = current.doneTaskIds.includes(taskId);
      const nextDoneTaskIds = alreadyDone
        ? current.doneTaskIds.filter((id) => id !== taskId)
        : [...current.doneTaskIds, taskId];

      const nextProgress = lessonProgressFromTasks(nextDoneTaskIds, lesson.tasks.length);
      const completed = nextProgress === 100;

      return {
        ...prev,
        [lessonId]: {
          started: true,
          completed,
          doneTaskIds: nextDoneTaskIds,
          progress: completed ? 100 : nextProgress,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Licoes praticas</h2>
        <p className="text-slate-600">Licoes padrao para evoluir no ingles corporativo com passos claros.</p>
      </div>

      <Card className="p-6 mb-8 bg-gradient-to-r from-sky-600 to-indigo-700 text-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">Progresso das licoes</h3>
            <p className="text-sky-100">
              {completedLessons} de {totalLessons} completas
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
        </div>
        <Progress value={globalProgress} className="h-3 bg-white/20" />
        <p className="text-sm mt-2 text-sky-100">{globalProgress}% concluido</p>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className={`cursor-pointer px-4 py-2 ${
              selectedCategory === category
                ? "bg-sky-600 text-white"
                : "hover:bg-slate-100"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLessons.map((lesson) => (
            <Card
              key={lesson.id}
              className={`p-6 transition-all duration-300 hover:shadow-md ${
                lesson.locked ? "opacity-65" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
                  {lesson.completed ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : lesson.locked ? (
                    <Lock className="w-6 h-6 text-slate-400" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-sky-600" />
                  )}
                </div>
                <Badge className={getLevelColor(lesson.level)}>{lesson.level}</Badge>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{lesson.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{lesson.description}</p>

              <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{lesson.durationMinutes} min</span>
              </div>

              <div className="mb-4">
                <Progress value={lesson.progress} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">{lesson.progress}% da licao</p>
              </div>

              <Button
                className="w-full"
                variant={lesson.completed ? "outline" : "default"}
                disabled={lesson.locked}
                onClick={() => setLessonStarted(lesson.id)}
              >
                {lesson.locked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Bloqueado
                  </>
                ) : lesson.completed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Revisar
                  </>
                ) : lesson.started ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continuar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Comecar
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-6 border-slate-200/80 shadow-sm h-fit sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-sky-600" />
            <h3 className="font-semibold text-slate-900">Licao ativa</h3>
          </div>

          {activeLesson ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Titulo</p>
                <p className="font-semibold text-slate-900 mt-1">{activeLesson.title}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Objetivo</p>
                <p className="text-sm text-slate-700 mt-1">{activeLesson.objective}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Passos da licao</p>
                <div className="space-y-2">
                  {activeLesson.tasks.map((task, index) => {
                    const taskId = buildTaskId(activeLesson.id, index);
                    const checked = activeLesson.doneTaskIds.includes(taskId);

                    return (
                      <label
                        key={taskId}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          checked
                            ? "border-emerald-200 bg-emerald-50/70"
                            : "border-slate-200 bg-white"
                        } ${activeLesson.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={activeLesson.locked}
                          onChange={() => toggleTask(activeLesson.id, index)}
                          className="mt-0.5"
                        />
                        <span className="text-slate-700">{task}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Progresso atual</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{activeLesson.progress}%</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Selecione uma licao para comecar.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
