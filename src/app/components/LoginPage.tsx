import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import logoImage from "../../assets/login.png";
import { getProfilesByUser, listUsers } from "../lib/flueetApi";
import {
  saveProfileId,
  saveUserEmail,
  saveUserId,
  saveUserName,
} from "../lib/sessionStore";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const users = await listUsers(0, 500);
      const foundUser = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

      if (!foundUser) {
        alert("Usuario nao encontrado. Crie uma conta primeiro.");
        return;
      }

      saveUserId(foundUser.id);
      saveUserName(foundUser.name);
      saveUserEmail(foundUser.email);
      localStorage.setItem("flueet-auth", "true");

      const profiles = await getProfilesByUser(foundUser.id);
      const firstProfile = profiles[0];
      if (firstProfile?.id) {
        saveProfileId(firstProfile.id);
        navigate("/app", { replace: true });
        return;
      }

      navigate("/onboarding", { replace: true });
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImage} alt="Flueet" className="h-20 mx-auto mb-4" />
          <p className="text-gray-600">Seu assistente de IA para inglês corporativo</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6">Bem-vindo de volta!</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-gray-600">Lembrar-me</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                Esqueceu a senha?
              </a>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-3">
              Não tem uma conta?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline font-semibold">
                Cadastre-se
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
                Conheça o Flueet
              </Button>
            </Link>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          Ao continuar, você concorda com nossos{" "}
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
