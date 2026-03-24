"use client";

import { useEffect, useRef } from "react";

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

export default function Home() {
  const perspectiveLoaded = useRef(false);

  useEffect(() => {
    // Load Perspective SDK
    if (perspectiveLoaded.current) return;
    perspectiveLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://getperspective.ai/v1/embed.js";
    script.async = true;
    document.body.appendChild(script);

    // Listen for postMessage events from Perspective iframe
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Perspective
      if (!event.origin.includes("getperspective.ai")) return;

      console.log(
        "PostMessage from Perspective:",
        JSON.stringify(event.data, null, 2),
      );

      // Try to extract interview ID from any message type
      const data = event.data || {};
      const conversationId =
        data.conversationId ||
        data.conversation_id ||
        data.interview_id ||
        data.interviewId ||
        data.id ||
        data.data?.conversationId ||
        data.data?.conversation_id ||
        data.data?.interview_id ||
        data.data?.id;

      if (
        conversationId &&
        (data.type === "perspective:submit" ||
          data.type === "perspective:complete" ||
          data.type === "perspective:redirect")
      ) {
        console.log("Got conversation ID from postMessage:", conversationId);
        window.location.href = `/result?cid=${conversationId}`;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openIntake = () => {
    if (window.Perspective) {
      // Generate unique session ID to track this user's intake
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      window.Perspective.init({
        researchId: "ICYxmulx",
        type: "popup",
        // Pass session_id as custom param - gets stored in participant_metadata
        // mode=restart ensures a fresh interview each time
        params: { session_id: sessionId, mode: "restart" },
        onSubmit: () => {
          console.log(
            "Perspective onSubmit fired, redirecting with session:",
            sessionId,
          );
          // Redirect with session ID - webhook will have stored data indexed by this
          window.location.href = `/result?session=${sessionId}`;
        },
        onClose: () => {
          console.log("Perspective popup closed");
        },
        onError: (error) => {
          console.error("Perspective error:", error);
        },
      });
    } else {
      console.error("Perspective SDK not loaded");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black">
      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Hero Section */}
        <div className="text-center">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              <span>Powered by 269 episodes of Lenny&apos;s Podcast</span>
            </div>
          </div>
          <a
            href="https://getperspective.ai?utm_source=lenny-listens"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <span>Built with</span>
            <img
              src="/perspective-logo.png"
              alt=""
              aria-hidden="true"
              className="h-4 w-auto"
            />
            <span className="font-medium">Perspective AI</span>
          </a>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
            Get{" "}
            <span className="text-amber-600 dark:text-amber-400">Lenny</span> to
            interview your customers
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Generate custom research interviews using Lenny Rachitsky&apos;s
            proven interviewing methodology. Understand your customers like
            never before.
          </p>

          {/* CTA Button - Opens Intake Popup via JS API */}
          <button
            onClick={openIntake}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-amber-500 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:bg-amber-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Create Your Lenny Interview
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>

          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Takes less than 2 minutes
          </p>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="mb-12 text-center text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
            How it works
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Tell us what you want to learn
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Share your company and research goals. Feature requests? Product
                discovery? Customer feedback?
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                We generate your Lenny interview
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Using methodology from 269 podcast episodes, we create a custom
                research interview in Lenny&apos;s voice.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Interview your customers
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Try it yourself or invite your customers. Get insights that
                actually matter.
              </p>
            </div>
          </div>
        </div>

        {/* Lenny's Methodology */}
        <div className="mt-24 rounded-3xl bg-zinc-900 p-8 text-white dark:bg-zinc-800 sm:p-12">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">
            Lenny&apos;s interviewing methodology
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-zinc-400">
            Distilled from hundreds of conversations with world-class product
            leaders
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Three-layer approach</h3>
                <p className="text-sm text-zinc-400">
                  Origin Story → Framework → Application
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Pull the thread</h3>
                <p className="text-sm text-zinc-400">
                  Dig deeper when something interesting emerges
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Find tensions</h3>
                <p className="text-sm text-zinc-400">
                  Explore contradictions and tradeoffs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Seek specifics</h3>
                <p className="text-sm text-zinc-400">
                  Get concrete examples for broad claims
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Perspective CTA */}
        <div className="mt-24 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-6">
            <div className="mb-4 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-700">
              <img
                src="/perspective-logo.png"
                alt="Perspective AI"
                className="h-8 w-auto"
              />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-white">
                Want to build your own AI interviews?
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Perspective AI lets you create custom research interviews for
                any use case — not just Lenny&apos;s methodology.
              </p>
            </div>
            <a
              href="https://getperspective.ai/signup?utm_source=lenny-listens"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 sm:mt-0"
            >
              Try Perspective AI
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-zinc-500">
          <p>
            Inspired by{" "}
            <a
              href="https://www.lennysnewsletter.com?utm_source=lenny-listens"
              className="text-amber-600 hover:underline dark:text-amber-400"
            >
              Lenny&apos;s Newsletter
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
