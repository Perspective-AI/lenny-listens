"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GeneratedPerspective, getUseCaseLabel } from "@/lib/lenny-methodology";

declare global {
  interface Window {
    Perspective?: {
      init: (config: {
        researchId: string;
        type: "popup" | "slider" | "widget" | "fullpage" | "chat";
        params?: Record<string, string>;
        onReady?: () => void;
        onSubmit?: (data: { researchId: string }) => void;
        onClose?: () => void;
        onError?: (error: Error) => void;
      }) => void;
    };
  }
}

// Lenny quotes from his podcast - rotating display while loading
const LENNY_QUOTES = [
  { quote: "The best founders I know are constantly talking to customers.", topic: "On customer research" },
  { quote: "Pull the thread. When something interesting comes up, dig deeper.", topic: "On interviewing" },
  { quote: "The goal isn't to validate your idea, it's to learn the truth.", topic: "On discovery" },
  { quote: "Great PMs are essentially professional question askers.", topic: "On product management" },
  { quote: "Most people don't actually know what they want until you show them.", topic: "On innovation" },
  { quote: "The magic happens when you stop pitching and start listening.", topic: "On conversations" },
  { quote: "Specificity is the antidote to bullshit.", topic: "On getting real answers" },
  { quote: "Find the tension. That's where the insight lives.", topic: "On uncovering needs" },
  { quote: "Your customers know things you don't. Your job is to extract that knowledge.", topic: "On research" },
  { quote: "Don't ask people if they'd use your product. Ask about their actual behavior.", topic: "On asking better questions" },
];

function ResultContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("cid");
  const sessionId = searchParams.get("session");

  const [perspective, setPerspective] = useState<GeneratedPerspective | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const maxPollAttempts = 60; // Try for about 3 minutes
  const perspectiveLoaded = useRef(false);

  // Load Perspective SDK
  useEffect(() => {
    if (perspectiveLoaded.current) return;
    perspectiveLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://getperspective.ai/v1/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchPerspective = useCallback(async () => {
    // Need either conversation ID or session ID
    if (!conversationId && !sessionId) {
      setError("No session or conversation ID provided");
      return;
    }

    try {
      // Use session lookup if we have session ID, otherwise direct conversation lookup
      const url = sessionId
        ? `/api/perspective/session/${sessionId}`
        : `/api/perspective/${conversationId}`;

      const response = await fetch(url);

      if (response.status === 404) {
        // Not found yet - might still be processing webhook
        setPollAttempts((prev) => prev + 1);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch perspective");
      }

      const data = await response.json();
      setPerspective(data);

      // Keep polling if still pending/generating
      if (data.status === "pending" || data.status === "generating") {
        setPollAttempts((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error fetching perspective:", err);
      setPollAttempts((prev) => prev + 1);
    }
  }, [conversationId, sessionId]);

  useEffect(() => {
    fetchPerspective();
  }, [fetchPerspective]);

  useEffect(() => {
    // Stop polling once we have a final status
    if (perspective?.status === "ready" || perspective?.status === "error") {
      return;
    }

    if (pollAttempts >= maxPollAttempts) {
      setError("Could not find your interview. Please try again in a moment.");
      return;
    }

    const timer = setTimeout(() => {
      fetchPerspective();
    }, 3000);

    return () => clearTimeout(timer);
  }, [pollAttempts, perspective?.status, fetchPerspective]);

  const openPreviewInterview = () => {
    if (!perspective?.perspective_id) {
      console.error("No perspective ID available");
      return;
    }

    if (window.Perspective) {
      window.Perspective.init({
        researchId: perspective.perspective_id,
        type: "popup",
        params: { mode: "restart" },
        onClose: () => {
          console.log("Preview interview closed");
        },
        onError: (error) => {
          console.error("Perspective error:", error);
        },
      });
    } else {
      // Fallback to opening in new tab if SDK not loaded
      window.open(perspective.preview_url, "_blank");
    }
  };

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">{error}</h1>
          <a href="/" className="text-amber-600 hover:underline dark:text-amber-400">
            ← Go back and try again
          </a>
        </div>
      </div>
    );
  }

  // Loading/Pending state with rotating Lenny quotes
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LENNY_QUOTES.length);
    }, 4000);
    return () => clearInterval(quoteInterval);
  }, []);

  if (!perspective || perspective.status === "pending" || perspective.status === "generating") {
    const currentQuote = LENNY_QUOTES[quoteIndex];

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black px-6">
        <div className="max-w-lg text-center">
          {/* Animated microphone icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              {/* Pulsing rings */}
              <div className="absolute inset-0 h-20 w-20 animate-ping rounded-full bg-amber-400/20" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 h-20 w-20 animate-ping rounded-full bg-amber-400/10" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            </div>
          </div>

          <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-white">
            {perspective?.status === "generating"
              ? "Lenny is crafting your interview..."
              : "Hang tight! Lenny's talking to a lot of people right now."}
          </h1>

          <p className="mb-8 text-zinc-600 dark:text-zinc-400">
            {perspective?.status === "generating"
              ? "Applying insights from 269 podcast episodes"
              : "Your personalized interview is being created. This usually takes 30-60 seconds."}
          </p>

          {perspective?.intake?.company_domain && (
            <p className="mb-8 text-sm text-amber-600 dark:text-amber-400 font-medium">
              Customizing for {perspective.intake.company_domain}
            </p>
          )}

          {/* Rotating quote card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-lg border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <div className="text-left">
                <p className="text-zinc-800 dark:text-zinc-200 font-medium italic">
                  &ldquo;{currentQuote.quote}&rdquo;
                </p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {currentQuote.topic}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="text-xs text-zinc-400">— Lenny Rachitsky</span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="mt-6 flex justify-center gap-1.5">
            {LENNY_QUOTES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  i === quoteIndex ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state from generation
  if (perspective.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            {perspective.error || "Failed to generate your interview. Please try again."}
          </p>
          <a href="/" className="text-amber-600 hover:underline dark:text-amber-400">
            ← Go back and try again
          </a>
        </div>
      </div>
    );
  }

  // Ready state - show the generated perspective
  const companyName = perspective.intake?.company_domain?.replace(/\.(com|io|co|ai|org|net)$/i, "") || "Your Company";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black">
      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Success Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white">
            Your Lenny interview is ready!
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Custom research interview for{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {companyName}
            </span>{" "}
            about {getUseCaseLabel(perspective.intake?.use_case || "")}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Send to Customers Card - Primary */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
              Send to your customers
            </h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Get this interview in your own Perspective AI workspace and start gathering real insights.
            </p>
            <a
              href={`https://getperspective.ai/claim/${perspective.perspective_id}?utm_source=lenny-listens`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 font-semibold text-white transition-colors hover:bg-amber-600"
            >
              <img src="/perspective-logo.png" alt="" className="h-5 w-5 brightness-0 invert" />
              Send to your customers
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* Try It Yourself Card - Secondary */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
              <svg className="h-6 w-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
              Try it yourself
            </h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Experience the interview as if you were one of your customers being interviewed by Lenny.
            </p>
            <button
              onClick={openPreviewInterview}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-300 px-6 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Start Preview Interview
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </button>
          </div>
        </div>

        {/* CTA to Sign Up */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 p-8 text-center text-white">
          <h2 className="mb-3 text-2xl font-bold">
            Ready to interview your real customers?
          </h2>
          <p className="mb-6 text-amber-100">
            Get this interview in your own workspace. Share with customers and get actionable insights.
          </p>
          <a
            href={`https://getperspective.ai/claim/${perspective.perspective_id}?utm_source=lenny-listens`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 font-semibold text-amber-600 transition-colors hover:bg-amber-50"
          >
            Send to your customers
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
          >
            ← Create another Lenny interview
          </a>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
