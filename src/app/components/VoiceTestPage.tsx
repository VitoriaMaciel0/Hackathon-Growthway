import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Mic, MicOff, Volume2, CheckCircle } from "lucide-react";
import mascotImage from "../../assets/mascot.png";

interface VoiceQuestion {
  id: number;
  question: string;
  expectedAnswer: string;
  audioPrompt?: string;
}

const questions: VoiceQuestion[] = [
  {
    id: 1,
    question: "Introduce yourself and tell me about your current job.",
    expectedAnswer: "My name is... I work as a... at...",
  },
  {
    id: 2,
    question: "Describe a typical day at your workplace.",
    expectedAnswer: "I usually start my day... then I...",
  },
  {
    id: 3,
    question: "What are your main responsibilities in your role?",
    expectedAnswer: "My main responsibilities include...",
  },
];

export function VoiceTestPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simular gravação - em produção, usar Web Speech API ou similar
    setTimeout(() => {
      setIsRecording(false);
      handleNextQuestion();
    }, 3000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    setAnswers([...answers, "Simulated answer"]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleSkipTest = () => {
  navigate("/app", { replace: true });
};

const handleFinish = () => {
  navigate("/app", { replace: true });
};

  const playAudio = () => {
    // Simular reprodução de áudio
    console.log("Playing audio question");
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-2xl w-full text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Teste Concluído!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Ótimo trabalho! Analisamos sua pronúncia e fluência.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-lg mb-4">Seus Resultados Preliminares:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">75%</p>
                <p className="text-sm text-gray-600">Pronúncia</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">68%</p>
                <p className="text-sm text-gray-600">Fluência</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">82%</p>
                <p className="text-sm text-gray-600">Vocabulário</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold mb-2">📊 Nível Estimado: Intermediário</h4>
            <p className="text-sm text-gray-700">
              Com base no seu teste, criamos um plano personalizado de estudos focado em melhorar sua fluência e expandir seu vocabulário corporativo.
            </p>
          </div>

          <Button
            onClick={handleFinish}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            Ir para a Plataforma
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card className="p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={mascotImage} alt="Flueet" className="h-24 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Teste de Voz</h2>
            <p className="text-gray-600">
              Vamos avaliar seu nível de inglês falado. Responda as perguntas em voz alta.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Pergunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 mb-8">
            <div className="flex items-start gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={playAudio} className="flex-shrink-0">
                <Volume2 className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {questions[currentQuestion].question}
                </h3>
                <p className="text-sm text-gray-600">
                  Dica: {questions[currentQuestion].expectedAnswer}
                </p>
              </div>
            </div>
          </Card>

          {/* Recording Area */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isRecording ? "bg-red-500 animate-pulse" : "bg-blue-600"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-16 h-16 text-white" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </div>
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></div>
              )}
            </div>

            <div className="mb-6">
              {isRecording ? (
                <div>
                  <p className="text-lg font-semibold text-red-600 mb-2">Gravando...</p>
                  <p className="text-sm text-gray-600">Fale naturalmente e com clareza</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Clique no microfone para responder
                  </p>
                  <p className="text-sm text-gray-600">
                    Você terá até 60 segundos para responder
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              {isRecording ? (
                <Button onClick={handleStopRecording} variant="destructive" size="lg">
                  <MicOff className="w-5 h-5 mr-2" />
                  Parar Gravação
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleStartRecording}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Começar a Gravar
                  </Button>
                  <Button onClick={handleNextQuestion} variant="outline" size="lg">
                    Pular Pergunta
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Info Box */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              💡 <strong>Dica:</strong> Fale de forma natural e não se preocupe com erros. Estamos avaliando sua fluência e
              pronúncia para personalizar seu aprendizado.
            </p>
          </Card>

          {/* Skip Test */}
          <div className="text-center mt-6">
            <Button variant="ghost" onClick={handleSkipTest}>
              Pular teste e ir direto para a plataforma
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}