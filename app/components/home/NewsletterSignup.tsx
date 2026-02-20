"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);

  async function submit() {
    if (!email || !email.includes("@")) {
      setOk(false);
      return;
    }

    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setOk(true);
      setEmail("");
    } catch {
      setOk(false);
    }
  }

  return (
    <section className="w-full bg-black text-white py-12 px-6">
      <div className="mx-auto max-w-xl text-center">
        <h3 className="text-2xl font-extrabold">
          Enterarte primero tiene ventaja.
        </h3>
        <p className="mt-2 text-white/80">
          Recibe un aviso cuando llegue un drop nuevo o algo exclusivo.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo"
            className="flex-1 rounded-lg px-4 py-3 text-black outline-none"
          />
          <button
            onClick={submit}
            className="rounded-lg bg-white px-5 py-3 font-bold text-black hover:opacity-90"
          >
            Avisarme
          </button>
        </div>

        {ok === true && (
          <p className="mt-3 text-sm text-green-400">
            Listo. Te avisaremos 🔔
          </p>
        )}
        {ok === false && (
          <p className="mt-3 text-sm text-red-400">
            Revisa el correo e intenta de nuevo.
          </p>
        )}
      </div>
    </section>
  );
}