import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import logoImage from "../../assets/login.png";

export function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignUp = (e: React.FormEvent) => {
  e.preventDefault();
  if (formData.password !== formData.confirmPassword) {
    alert("As senhas não coincidem!");
    return;
  }
  localStorage.setItem("flueent-auth", "true");
  // Opcional: salvar dados do usuário
  navigate("/onboarding", { replace: true });
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImage} alt="Flueent" className="h-20 mx-auto mb-4" />
          <p className="text-gray-600">Comece sua jornada de aprendizado hoje</p>
        </div>

        {/* SignUp Card */}
        <Card className="p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6">Criar Conta</h2>
          
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Criar Conta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-3">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Faça login
              </Link>
            </p>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <Link to="/landing">
              <Button variant="outline" className="w-full">
                Saiba mais sobre o Flueent
              </Button>
            </Link>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          Ao criar uma conta, você concorda com nossos{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
