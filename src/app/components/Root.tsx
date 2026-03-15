import { Outlet, Link, useLocation } from "react-router";
import { MessageSquare, BookOpen, TrendingUp, Home, MessageCircle } from "lucide-react";

export function Root() {
  const location = useLocation();

  const isActive = (path: string) => {
    // path já inclui o prefixo /app (ex: "/app", "/app/conversation")
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Flueent
                </h1>
                <p className="text-xs text-gray-500">Corporate English AI</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/app"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/app") && location.pathname === "/app"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Início</span>
              </Link>
              <Link
                to="/app/conversation"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/app/conversation")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversação</span>
              </Link>
              <Link
                to="/app/lessons"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/app/lessons")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Lições</span>
              </Link>
              <Link
                to="/app/progress"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/app/progress")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Progresso</span>
              </Link>
              <Link
                to="/app/feedback"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/app/feedback")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Feedback</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <Link
            to="/app"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
              isActive("/app") && location.pathname === "/app"
                ? "text-blue-700"
                : "text-gray-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Início</span>
          </Link>
          <Link
            to="/app/conversation"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
              isActive("/app/conversation") ? "text-blue-700" : "text-gray-600"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </Link>
          <Link
            to="/app/lessons"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
              isActive("/app/lessons") ? "text-blue-700" : "text-gray-600"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Lições</span>
          </Link>
          <Link
            to="/app/progress"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
              isActive("/app/progress") ? "text-blue-700" : "text-gray-600"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Progresso</span>
          </Link>
          <Link
            to="/app/feedback"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
              isActive("/app/feedback") ? "text-blue-700" : "text-gray-600"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Feedback</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}