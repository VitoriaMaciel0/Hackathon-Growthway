import { TrendingUp, AlertCircle, CheckCircle, Volume2, Target, Award, Calendar } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface PronunciationFeedback {
  phoneme: string;
  accuracy: number;
  examples: string[];
}

const recentTests = [
  { date: "15/03/2026", scenario: "Apresentação de Projeto", score: 85, errors: 3 },
  { date: "14/03/2026", scenario: "Negociação de Contrato", score: 78, errors: 5 },
  { date: "13/03/2026", scenario: "Reunião de Equipe", score: 92, errors: 2 },
  { date: "12/03/2026", scenario: "Entrevista de Emprego", score: 88, errors: 3 },
  { date: "11/03/2026", scenario: "Atendimento ao Cliente", score: 81, errors: 4 },
];

const pronunciationAreas: PronunciationFeedback[] = [
  {
    phoneme: "TH Sound (/θ/ e /ð/)",
    accuracy: 65,
    examples: ["think", "this", "through", "although"],
  },
  {
    phoneme: "R Sound (/r/)",
    accuracy: 72,
    examples: ["right", "really", "presentation", "project"],
  },
  {
    phoneme: "V vs W",
    accuracy: 58,
    examples: ["very", "value", "we", "work"],
  },
  {
    phoneme: "Final S/Z",
    accuracy: 80,
    examples: ["sales", "goals", "thinks", "business"],
  },
];

const commonErrors = [
  { type: "Tempo de Fala", occurrences: 12, impact: "Moderado" },
  { type: "Entonação", occurrences: 8, impact: "Alto" },
  { type: "Vocabulário", occurrences: 5, impact: "Baixo" },
  { type: "Gramática", occurrences: 7, impact: "Moderado" },
];

export function FeedbackPage() {
  const totalTests = recentTests.length;
  const totalErrors = recentTests.reduce((sum, test) => sum + test.errors, 0);
  const averageScore = Math.round(recentTests.reduce((sum, test) => sum + test.score, 0) / totalTests);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Análise de Desempenho</h2>
        <p className="text-gray-600">
          Veja seu feedback detalhado e áreas para melhorar
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
            <span className="text-3xl font-bold">{averageScore}%</span>
          </div>
          <p className="text-sm text-blue-100">Pontuação Média</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8" />
            <span className="text-3xl font-bold">{totalTests}</span>
          </div>
          <p className="text-sm text-purple-100">Testes Realizados</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-600 to-orange-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8" />
            <span className="text-3xl font-bold">{totalErrors}</span>
          </div>
          <p className="text-sm text-orange-100">Erros Totais</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8" />
            <span className="text-3xl font-bold">+15%</span>
          </div>
          <p className="text-sm text-green-100">Melhoria Semanal</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pronunciation Feedback */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Volume2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-semibold">Pronúncia - Áreas para Melhorar</h3>
          </div>
          
          <div className="space-y-6">
            {pronunciationAreas.map((area, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{area.phoneme}</h4>
                    <p className="text-xs text-gray-600">
                      Exemplos: {area.examples.join(", ")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      area.accuracy >= 75
                        ? "bg-green-50 text-green-700 border-green-200"
                        : area.accuracy >= 60
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {area.accuracy}%
                  </Badge>
                </div>
                <Progress value={area.accuracy} className="h-2" />
                {area.accuracy < 75 && (
                  <div className="mt-2 flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">
                      {area.accuracy < 60
                        ? "Pratique mais este som! Repita as palavras em voz alta diariamente."
                        : "Você está melhorando! Continue praticando para dominar este som."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
            <Volume2 className="w-4 h-4 mr-2" />
            Praticar Pronúncia
          </Button>
        </Card>

        {/* Common Errors */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-semibold">Erros Mais Comuns</h3>
          </div>

          <div className="space-y-4 mb-6">
            {commonErrors.map((error, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{error.type}</h4>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        error.impact === "Alto"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : error.impact === "Moderado"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      {error.impact}
                    </Badge>
                    <span className="text-sm text-gray-600">{error.occurrences}x</span>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {error.type === "Tempo de Fala" && "Você tende a falar muito rápido. Pratique pausar entre as frases."}
                    {error.type === "Entonação" && "Trabalhe na entonação para soar mais natural em inglês corporativo."}
                    {error.type === "Vocabulário" && "Use sinônimos mais formais em contextos profissionais."}
                    {error.type === "Gramática" && "Revise tempos verbais e concordância em frases complexas."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Tests History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">Histórico de Testes</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cenário</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Pontuação</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Erros</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTests.map((test, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{test.date}</td>
                  <td className="py-3 px-4 text-sm">{test.scenario}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      className={
                        test.score >= 85
                          ? "bg-green-100 text-green-700"
                          : test.score >= 70
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {test.score}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600">
                    {test.errors}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {test.score >= 85 ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Improvement Tips */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <h3 className="font-semibold text-indigo-900 mb-3">🎯 Recomendações Personalizadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Foco Principal</h4>
            <p className="text-sm text-gray-700">
              Trabalhe na pronúncia do som "TH" e "V vs W" - estas são suas maiores oportunidades de melhoria.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Sugestão de Prática</h4>
            <p className="text-sm text-gray-700">
              Faça 15 minutos de conversação diária focando em diminuir o ritmo da fala e melhorar a entonação.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
