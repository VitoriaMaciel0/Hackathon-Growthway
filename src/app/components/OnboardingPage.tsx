import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Progress } from "./ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import mascotImage from "../../assets/mascot.png";
import { createProfile } from "../lib/flueetApi";
import { loadUserId, saveProfileId } from "../lib/sessionStore";

interface OnboardingData {
  nativeLanguage: string;
  targetLanguage: string;
  currentLevel: string;
  learningGoal: string;
  workArea: string;
  availableTime: string;
  preferredLearning: string;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    nativeLanguage: "",
    targetLanguage: "",
    currentLevel: "",
    learningGoal: "",
    workArea: "",
    availableTime: "",
    preferredLearning: "",
  });

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    if (isSubmitting) {
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const userId = loadUserId();
      if (!userId) {
        alert("Usuario nao encontrado. Faca login novamente.");
        navigate("/login", { replace: true });
        return;
      }

      setIsSubmitting(true);

      try {
        const profile = await createProfile({
          user_id: userId,
          native_language: formData.nativeLanguage,
          target_language: formData.targetLanguage,
          current_level: formData.currentLevel,
          goal: formData.learningGoal,
        });

        if (profile.id) {
          saveProfileId(profile.id);
        }

        // Finalizar onboarding e ir para diagnóstico inicial
        navigate("/app", { replace: true });
      } catch (error) {
        alert((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateFormData = (key: keyof OnboardingData, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.nativeLanguage !== "";
      case 2:
        return formData.targetLanguage !== "";
      case 3:
        return formData.currentLevel !== "";
      case 4:
        return formData.learningGoal !== "";
      case 5:
        return formData.workArea !== "";
      case 6:
        return formData.availableTime !== "";
      case 7:
        return formData.preferredLearning !== "";
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={mascotImage} alt="Flueet" className="h-32 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Vamos conhecer você!</h2>
            <p className="text-gray-600">
              Responda algumas perguntas para personalizarmos sua experiência
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Pergunta {step} de {totalSteps}</span>
              <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Questions */}
          <div className="min-h-[300px]">
            {step === 1 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Qual é sua língua nativa?</h3>
                <RadioGroup value={formData.nativeLanguage} onValueChange={(value) => updateFormData("nativeLanguage", value)}>
                  <div className="space-y-3">
                    {[
                      { value: "portuguese", label: "Português" },
                      { value: "english", label: "English" },
                      { value: "spanish", label: "Español" },
                      { value: "french", label: "Français" },
                      { value: "mandarin", label: "中文 (Mandarin)" },
                      { value: "other", label: "Outro idioma" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Qual idioma você quer aprender?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  O Flueet oferece 4 idiomas para você dominar no ambiente corporativo
                </p>
                <RadioGroup value={formData.targetLanguage} onValueChange={(value) => updateFormData("targetLanguage", value)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: "english", label: "English", flag: "🇺🇸", desc: "Inglês Corporativo" },
                      { value: "mandarin", label: "中文", flag: "🇨🇳", desc: "Mandarim para Negócios" },
                      { value: "spanish", label: "Español", flag: "🇪🇸", desc: "Espanhol Empresarial" },
                      { value: "french", label: "Français", flag: "🇫🇷", desc: "Francês Profissional" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 border-2 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{option.flag}</span>
                            <span className="font-semibold">{option.label}</span>
                          </div>
                          <p className="text-xs text-gray-600">{option.desc}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Qual é o seu nível atual neste idioma?</h3>
                <RadioGroup value={formData.currentLevel} onValueChange={(value) => updateFormData("currentLevel", value)}>
                  <div className="space-y-3">
                    {[
                      { value: "beginner", label: "Iniciante - A1/A2", desc: "Sei o básico ou estou começando" },
                      { value: "elementary", label: "Elementar - B1", desc: "Consigo me comunicar de forma simples" },
                      { value: "intermediate", label: "Intermediário - B2", desc: "Consigo me comunicar bem" },
                      { value: "advanced", label: "Avançado - C1", desc: "Tenho boa fluência" },
                      { value: "fluent", label: "Fluente - C2", desc: "Domino o idioma" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.desc}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Quais são suas principais metas?</h3>
                <RadioGroup value={formData.learningGoal} onValueChange={(value) => updateFormData("learningGoal", value)}>
                  <div className="space-y-3">
                    {[
                      { value: "meetings", label: "Participar de reuniões e apresentações" },
                      { value: "emails", label: "Escrever comunicações profissionais" },
                      { value: "negotiations", label: "Negociar contratos e vendas" },
                      { value: "networking", label: "Fazer networking internacional" },
                      { value: "fluency", label: "Melhorar pronúncia e fluência" },
                      { value: "all", label: "Todos os acima" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 5 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Em qual área você trabalha?</h3>
                <RadioGroup value={formData.workArea} onValueChange={(value) => updateFormData("workArea", value)}>
                  <div className="space-y-3">
                    {[
                      { value: "tech", label: "Tecnologia" },
                      { value: "finance", label: "Finanças" },
                      { value: "marketing", label: "Marketing/Vendas" },
                      { value: "consulting", label: "Consultoria" },
                      { value: "healthcare", label: "Saúde" },
                      { value: "other", label: "Outra área" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 6 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Quanto tempo pode dedicar por dia?</h3>
                <RadioGroup value={formData.availableTime} onValueChange={(value) => updateFormData("availableTime", value)}>
                  <div className="space-y-3">
                    {[
                      { value: "15min", label: "15 minutos - Só tenho um tempinho" },
                      { value: "30min", label: "30 minutos - Prática regular" },
                      { value: "1hour", label: "1 hora - Dedicação diária" },
                      { value: "2hours", label: "2+ horas - Aprendizado intensivo" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 7 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Como você prefere aprender?</h3>
                <RadioGroup value={formData.preferredLearning} onValueChange={(value) => updateFormData("preferredLearning", value)}>
                  <div className="space-y-3">
                    {[
                      { value: "conversation", label: "Conversação - Praticando diálogos por voz" },
                      { value: "lessons", label: "Lições estruturadas - Passo a passo" },
                      { value: "mixed", label: "Misto - Lições + Conversação" },
                      { value: "immersion", label: "Imersão - Direto na prática" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {step === totalSteps ? (isSubmitting ? "Salvando..." : "Finalizar") : "Próximo"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}