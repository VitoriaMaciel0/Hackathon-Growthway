import { TrendingUp, Award, Target, Calendar, Flame, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  date?: string;
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "Primeiro Passo",
    description: "Complete sua primeira lição",
    earned: true,
    date: "10/03/2026",
  },
  {
    id: "2",
    title: "Conversador",
    description: "Envie 50 mensagens na conversação",
    earned: true,
    date: "12/03/2026",
  },
  {
    id: "3",
    title: "Dedicado",
    description: "Estude por 7 dias consecutivos",
    earned: true,
    date: "14/03/2026",
  },
  {
    id: "4",
    title: "Mestre das Palavras",
    description: "Aprenda 100 novas palavras",
    earned: false,
  },
  {
    id: "5",
    title: "Profissional",
    description: "Complete 20 lições",
    earned: false,
  },
];

const weeklyActivity = [
  { day: "Seg", minutes: 45 },
  { day: "Ter", minutes: 30 },
  { day: "Qua", minutes: 60 },
  { day: "Qui", minutes: 20 },
  { day: "Sex", minutes: 55 },
  { day: "Sáb", minutes: 40 },
  { day: "Dom", minutes: 35 },
];

const skillsProgress = [
  { skill: "Vocabulário", progress: 75, level: "Intermediário" },
  { skill: "Gramática", progress: 60, level: "Intermediário" },
  { skill: "Conversação", progress: 85, level: "Avançado" },
  { skill: "Escrita", progress: 70, level: "Intermediário" },
  { skill: "Compreensão", progress: 80, level: "Avançado" },
];

export function ProgressPage() {
  const totalMinutes = weeklyActivity.reduce((sum, day) => sum + day.minutes, 0);
  const currentStreak = 7;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Seu Progresso</h2>
        <p className="text-gray-600">Acompanhe sua evolução e conquistas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-8 h-8" />
            <span className="text-3xl font-bold">{currentStreak}</span>
          </div>
          <p className="text-sm text-blue-100">Dias de Sequência</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
            <span className="text-3xl font-bold">12</span>
          </div>
          <p className="text-sm text-green-100">Lições Completas</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8" />
            <span className="text-3xl font-bold">85%</span>
          </div>
          <p className="text-sm text-purple-100">Taxa de Acurácia</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-600 to-orange-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8" />
            <span className="text-3xl font-bold">{totalMinutes}</span>
          </div>
          <p className="text-sm text-orange-100">Minutos Esta Semana</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold">Atividade Semanal</h3>
          </div>
          <div className="space-y-4">
            {weeklyActivity.map((day, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{day.day}</span>
                  <span className="text-sm text-gray-600">{day.minutes} min</span>
                </div>
                <Progress value={(day.minutes / 60) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        {/* Skills Progress */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold">Habilidades</h3>
          </div>
          <div className="space-y-4">
            {skillsProgress.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.skill}</span>
                  <Badge
                    variant="outline"
                    className={
                      item.level === "Avançado"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }
                  >
                    {item.level}
                  </Badge>
                </div>
                <Progress value={item.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{item.progress}%</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="text-xl font-semibold">Conquistas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 ${
                achievement.earned
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    achievement.earned
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                {achievement.earned && (
                  <Badge className="bg-green-600 text-white">Conquistado</Badge>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
              {achievement.earned && achievement.date && (
                <p className="text-xs text-gray-500">{achievement.date}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Goals Section */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <h3 className="font-semibold text-indigo-900 mb-3">🎯 Metas da Semana</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-800">Completar 5 lições</span>
            <span className="text-sm font-semibold text-indigo-900">3/5</span>
          </div>
          <Progress value={60} className="h-2" />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-indigo-800">Praticar 150 minutos</span>
            <span className="text-sm font-semibold text-indigo-900">{totalMinutes}/150</span>
          </div>
          <Progress value={(totalMinutes / 150) * 100} className="h-2" />
        </div>
      </Card>
    </div>
  );
}
