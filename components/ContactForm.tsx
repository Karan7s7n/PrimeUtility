"use client";

import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { Notice } from "@/components/tools/ui";

export function ContactForm({
  labels,
  email,
}: {
  labels: { name: string; email: string; message: string; send: string; hint: string; required: string };
  email: string;
}) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !from.trim() || !message.trim()) {
      setError(true);
      return;
    }
    setError(false);
    const subject = encodeURIComponent(`Contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n—\n${name}\n${from}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <form className="surface space-y-4 p-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">
            {labels.name}
          </label>
          <input
            id="contact-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            {labels.email}
          </label>
          <input
            id="contact-email"
            type="email"
            className="input"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            autoComplete="email"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="contact-message">
          {labels.message}
        </label>
        <textarea
          id="contact-message"
          className="code-area h-40"
          dir="auto"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      {error && <Notice tone="error">{labels.required}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          <Send className="size-4" />
          {labels.send}
        </button>
        <a href={`mailto:${email}`} className="link inline-flex items-center gap-1.5 text-sm">
          <Mail className="size-3.5" />
          {email}
        </a>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{labels.hint}</p>
    </form>
  );
}
