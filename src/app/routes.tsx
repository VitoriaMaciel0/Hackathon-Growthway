import { createBrowserRouter, redirect, type LoaderFunction } from "react-router";
import { Root } from "./components/Root";
import { HomePage } from "./components/HomePage";
import { ConversationPage } from "./components/ConversationPage";
import { LessonsPage } from "./components/LessonsPage.tsx";
import { ProgressPage } from "./components/ProgressPage.tsx";
import { FeedbackPage } from "./components/FeedbackPage.tsx";
import { LoginPage } from "./components/LoginPage";
import { SignUpPage } from "./components/SignUpPage";
import { LandingPage } from "./components/LandingPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { VoiceTestPage } from "./components/VoiceTestPage";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    loader: (() => redirect("/")) as LoaderFunction,
  },
  {
    path: "/landing",
    Component: LandingPage,
  },
  {
    path: "/onboarding",
    loader: (() => {
      if (localStorage.getItem("flueet-auth") !== "true") {
        return redirect("/");
      }
      return null;
    }) as LoaderFunction,
    Component: OnboardingPage,
  },
  {
    path: "/voice-test",
    loader: (() => {
      if (localStorage.getItem("flueet-auth") !== "true") {
        return redirect("/");
      }
      return null;
    }) as LoaderFunction,
    Component: VoiceTestPage,
  },
  {
    path: "/",
    Component: SignUpPage,
  },
  {
    path: "/app",
    loader: (() => {
      if (localStorage.getItem("flueet-auth") !== "true") {
        return redirect("/");
      }
      return null;
    }) as LoaderFunction,
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "conversation", Component: ConversationPage },
      { path: "lessons", Component: LessonsPage },
      { path: "progress", Component: ProgressPage },
      { path: "feedback", Component: FeedbackPage },
      { path: "*", Component: NotFound },
    ],
  },
]);