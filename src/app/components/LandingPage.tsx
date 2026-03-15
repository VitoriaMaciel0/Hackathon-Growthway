import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Check, MessageSquare, TrendingUp, BookOpen, Mic, Award, Users, Zap } from "lucide-react";
import logoImage from "../../assets/login.png";
import mascotImage from "../../assets/mascot.png";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src={logoImage} alt="Flueent" className="h-12" />
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Domine 4 Idiomas Corporativos com{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Inteligência Artificial
                </span>
              </h1>
              <div className="flex items-center gap-3 mb-4 text-4xl">
                <span>🇺🇸</span>
                <span>🇨🇳</span>
                <span>🇪🇸</span>
                <span>🇫🇷</span>
              </div>
              <p className="text-xl text-gray-600 mb-8">
                Pratique conversação por voz em Inglês, Mandarim, Espanhol e Francês com nosso assistente de IA especializado em ambientes corporativos. Aprenda no seu ritmo, com feedback em tempo real.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
                    Começar Agora
                  </Button>
                </Link>
                <a href="#pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Ver Planos
                  </Button>
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <img src={mascotImage} alt="Flueent AI Assistant" className="max-w-md w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Por que escolher o Flueent?</h2>
            <p className="text-xl text-gray-600">Tecnologia de ponta para acelerar seu aprendizado</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Conversação com IA</h3>
              <p className="text-gray-600">
                Pratique diálogos profissionais 24/7 com nossa IA especializada
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Teste de Voz</h3>
              <p className="text-gray-600">
                Avaliação de pronúncia e fluência com reconhecimento de voz
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lições Personalizadas</h3>
              <p className="text-gray-600">
                Conteúdo adaptado ao seu nível e objetivos profissionais
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Acompanhamento</h3>
              <p className="text-gray-600">
                Relatórios detalhados do seu progresso e evolução
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Como Funciona</h2>
            <p className="text-xl text-gray-600">Comece sua jornada em 4 passos simples</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Cadastre-se", desc: "Crie sua conta gratuitamente", icon: Users },
              { step: "2", title: "Onboarding", desc: "Responda perguntas sobre seus objetivos", icon: Zap },
              { step: "3", title: "Teste de Nível", desc: "Faça o teste de voz para avaliar seu inglês", icon: Mic },
              { step: "4", title: "Comece a Aprender", desc: "Acesse lições e pratique com a IA", icon: Award },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos e Preços</h2>
            <p className="text-xl text-gray-600">Escolha o plano ideal para você</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-2">Básico</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 49</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "5 horas de conversação com IA",
                  "Acesso a 20 lições",
                  "Relatórios básicos",
                  "Suporte por email",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant="outline" className="w-full">
                  Começar
                </Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="p-8 border-2 border-blue-600 hover:shadow-xl transition-shadow relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Profissional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 99</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Conversação ilimitada com IA",
                  "Acesso a todas as lições",
                  "Relatórios detalhados",
                  "Teste de voz avançado",
                  "Suporte prioritário",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Começar
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-2">Empresarial</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 199</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Tudo do Profissional",
                  "Até 10 usuários",
                  "Dashboard administrativo",
                  "Conteúdo customizado",
                  "Gerente de conta dedicado",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant="outline" className="w-full">
                  Começar
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para melhorar seu inglês corporativo?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Comece hoje mesmo e veja resultados em semanas
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src={logoImage} alt="Flueent" className="h-10 mb-4 brightness-0 invert" />
              <p className="text-sm">
                Tecnologia de IA para aprendizado de inglês corporativo
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Flueent. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}