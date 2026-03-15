import { Link } from "react-router";
import { MessageSquare, BookOpen, TrendingUp, Award, Target, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Aprimore seus Idiomas Corporativos com IA
        </h2>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Pratique conversação por voz com o Flueent em 4 idiomas: Inglês, Mandarim, Espanhol e Francês
        </p>
        <div className="flex items-center justify-center gap-3 mb-8 text-3xl">
          <span>🇺🇸</span>
          <span>🇨🇳</span>
          <span>🇪🇸</span>
          <span>🇫🇷</span>
        </div>
        <Link to="/app/conversation">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <MessageSquare className="w-5 h-5 mr-2" />
            Começar Conversação
          </Button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Conversação em Tempo Real</h3>
          <p className="text-gray-600">
            Pratique diálogos profissionais com feedback instantâneo da IA
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Lições Personalizadas</h3>
          <p className="text-gray-600">
            Conteúdo focado em vocabulário e situações corporativas
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Acompanhe seu Progresso</h3>
          <p className="text-gray-600">
            Veja suas conquistas e áreas de melhoria com relatórios detalhados
          </p>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-16">
        <h3 className="text-2xl font-bold mb-6 text-center">Seu Aprendizado Hoje</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-gray-600">Lições Completas</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">85%</p>
            <p className="text-gray-600">Taxa de Acurácia</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">45</p>
            <p className="text-gray-600">Minutos de Prática</p>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div>
        <h3 className="text-2xl font-bold mb-6">Tópicos Populares</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Reuniões e Apresentações", level: "Intermediário" },
            { title: "Negociações e Vendas", level: "Avançado" },
            { title: "E-mails Profissionais", level: "Básico" },
            { title: "Networking e Small Talk", level: "Intermediário" },
          ].map((topic, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{topic.title}</h4>
                  <p className="text-sm text-gray-500">{topic.level}</p>
                </div>
                <Button variant="ghost" size="sm">
                  Começar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}