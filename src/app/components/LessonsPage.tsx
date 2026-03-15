import { useState } from "react";
import { BookOpen, CheckCircle, Lock, Play, Clock, Award } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: "Básico" | "Intermediário" | "Avançado";
  completed: boolean;
  locked: boolean;
  progress: number;
  category: string;
}

const lessons: Lesson[] = [
  {
    id: "1",
    title: "Professional Email Writing",
    description: "Learn to write clear, concise, and professional emails",
    duration: "15 min",
    level: "Básico",
    completed: true,
    locked: false,
    progress: 100,
    category: "Comunicação Escrita",
  },
  {
    id: "2",
    title: "Business Meeting Vocabulary",
    description: "Essential vocabulary for conducting and participating in meetings",
    duration: "20 min",
    level: "Intermediário",
    completed: true,
    locked: false,
    progress: 100,
    category: "Reuniões",
  },
  {
    id: "3",
    title: "Presentation Skills",
    description: "Master the art of delivering impactful presentations",
    duration: "25 min",
    level: "Intermediário",
    completed: false,
    locked: false,
    progress: 65,
    category: "Apresentações",
  },
  {
    id: "4",
    title: "Negotiation Techniques",
    description: "Learn professional negotiation phrases and strategies",
    duration: "30 min",
    level: "Avançado",
    completed: false,
    locked: false,
    progress: 0,
    category: "Negociações",
  },
  {
    id: "5",
    title: "Client Communication",
    description: "Build rapport and communicate effectively with clients",
    duration: "20 min",
    level: "Intermediário",
    completed: false,
    locked: false,
    progress: 0,
    category: "Atendimento",
  },
  {
    id: "6",
    title: "Advanced Business Idioms",
    description: "Understand and use common business idioms and expressions",
    duration: "25 min",
    level: "Avançado",
    completed: false,
    locked: true,
    progress: 0,
    category: "Vocabulário",
  },
];

export function LessonsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const categories = ["Todos", ...Array.from(new Set(lessons.map((l) => l.category)))];

  const filteredLessons =
    selectedCategory === "Todos"
      ? lessons
      : lessons.filter((l) => l.category === selectedCategory);

  const completedLessons = lessons.filter((l) => l.completed).length;
  const totalLessons = lessons.length;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Básico":
        return "bg-green-100 text-green-700";
      case "Intermediário":
        return "bg-yellow-100 text-yellow-700";
      case "Avançado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Lições de Inglês Corporativo</h2>
        <p className="text-gray-600">
          Aprenda no seu ritmo com conteúdo estruturado e prático
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">Seu Progresso Geral</h3>
            <p className="text-blue-100">
              {completedLessons} de {totalLessons} lições completas
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
        </div>
        <Progress value={(completedLessons / totalLessons) * 100} className="h-3 bg-white/20" />
        <p className="text-sm mt-2 text-blue-100">
          {Math.round((completedLessons / totalLessons) * 100)}% concluído
        </p>
      </Card>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => (
          <Card
            key={lesson.id}
            className={`p-6 hover:shadow-lg transition-shadow ${
              lesson.locked ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                {lesson.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : lesson.locked ? (
                  <Lock className="w-6 h-6 text-gray-400" />
                ) : (
                  <BookOpen className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <Badge className={getLevelColor(lesson.level)}>{lesson.level}</Badge>
            </div>

            <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{lesson.description}</p>

            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{lesson.duration}</span>
            </div>

            {!lesson.completed && !lesson.locked && lesson.progress > 0 && (
              <div className="mb-4">
                <Progress value={lesson.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{lesson.progress}% concluído</p>
              </div>
            )}

            <Button
              className="w-full"
              variant={lesson.completed ? "outline" : "default"}
              disabled={lesson.locked}
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
              ) : lesson.progress > 0 ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continuar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Começar
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <Card className="mt-8 p-6 bg-indigo-50 border-indigo-200">
        <h3 className="font-semibold text-indigo-900 mb-3">📚 Dicas de Estudo</h3>
        <ul className="text-sm text-indigo-800 space-y-2">
          <li>• Complete as lições em ordem para melhor progressão</li>
          <li>• Dedique pelo menos 15-30 minutos por dia ao aprendizado</li>
          <li>• Revise lições completas para reforçar o conhecimento</li>
          <li>• Pratique o conteúdo aprendido na seção de Conversação</li>
        </ul>
      </Card>
    </div>
  );
}
