import { useState, useRef, useEffect } from "react";
import { Send, Volume2, Sparkles, Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioTranscript?: boolean;
}

const scenarios = [
  "Apresentação de Projeto",
  "Negociação de Contrato",
  "Reunião de Equipe",
  "Entrevista de Emprego",
  "Atendimento ao Cliente",
];

const aiResponses = [
  "That's an excellent point! In a corporate setting, it's important to be clear and concise. Could you elaborate on your main objectives?",
  "I appreciate your perspective. In business communication, we often use phrases like 'I'd like to propose...' or 'What if we consider...'. How would you rephrase that?",
  "Great job! Your use of professional vocabulary is improving. Let's practice some more formal expressions. Can you tell me about a challenge you've faced at work?",
  "That's a good start. However, in a formal business context, we might say 'I would appreciate your feedback' instead of 'Give me your thoughts'. Could you try again?",
  "Excellent use of diplomatic language! In negotiations, it's crucial to maintain a collaborative tone. What would be your next step in this scenario?",
];

export function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Flueent, your AI language tutor for corporate communication. I'm here to help you practice professional conversations. What scenario would you like to practice today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simular início de gravação
      setTimeout(() => {
        setIsRecording(false);
        
        // Simular transcrição
        const transcribedText = "I think we should focus on improving our quarterly results.";
        
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: transcribedText,
          timestamp: new Date(),
          audioTranscript: true,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Simulate AI response
        setTimeout(() => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
      }, 3000);
    }
  };

  const handleScenarioSelect = (scenario: string) => {
    setSelectedScenario(scenario);
    const scenarioMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Perfect! Let's practice "${scenario}". I'll simulate this scenario with you. Remember to use professional language and clear communication. You can start whenever you're ready!`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, scenarioMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Conversação com IA</h2>
        <p className="text-gray-600">
          Pratique conversação por voz em cenários reais de negócios
        </p>
      </div>

      {/* Scenario Selection */}
      {!selectedScenario && messages.length <= 1 && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Escolha um Cenário:</h3>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <Badge
                key={scenario}
                variant="outline"
                className="cursor-pointer hover:bg-blue-100 hover:border-blue-400 px-4 py-2"
                onClick={() => handleScenarioSelect(scenario)}
              >
                {scenario}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {selectedScenario && (
        <div className="mb-4">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Sparkles className="w-3 h-3 mr-1" />
            Cenário: {selectedScenario}
          </Badge>
        </div>
      )}

      {/* Chat Area */}
      <Card className="h-[600px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold">Flueent AI</span>
                  </div>
                )}
                {message.audioTranscript && (
                  <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                    <Mic className="w-3 h-3" />
                    <span>Transcrição de áudio</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-transparent"
                      onClick={() => {
                        // Text-to-speech placeholder
                        console.log("Play audio for:", message.content);
                      }}
                    >
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <Button
              onClick={handleVoiceRecord}
              className={`h-[60px] px-6 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 animate-pulse"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Falar
                </>
              )}
            </Button>
            <Textarea
              placeholder="Ou fale algo aqui (texto)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[60px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="bg-blue-600 hover:bg-blue-700 h-[60px] px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            🎤 Clique em "Falar" para usar seu microfone ou digite no campo de texto
          </p>
        </div>
      </Card>

      {/* Tips */}
      <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas para melhor aprendizado:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use frases completas e gramaticalmente corretas</li>
          <li>• Pratique vocabulário formal e profissional</li>
          <li>• Fale com clareza para melhor transcrição</li>
          <li>• Experimente diferentes cenários corporativos</li>
        </ul>
      </Card>
    </div>
  );
}