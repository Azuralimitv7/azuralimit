"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconWarn, IconX } from "./Icons";
import { sfx } from "@/lib/sound";

interface T {
  id: number;
  msg: string;
  kind: "ok" | "err" | "info";
}

let pushFn: ((t: T) => void) | null = null;
let nid = 0;

export function toast(msg: string, kind: T["kind"] = "info") {
  pushFn?.({ id: ++nid, msg, kind });
}

const STYLES: Record<T["kind"], string> = {
  ok: "az-badge-ok",
  err: "az-badge-bad",
  info: "border-[var(--line)] bg-[var(--menu)] text-[var(--ink)]",
};

export default function Toasts() {
  const [list, setList] = useState<T[]>([]);

  useEffect(() => {
    pushFn = (t) => {
      setList((l) => [...l.slice(-4), t]);
      window.setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 4600);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[95] flex w-[min(92vw,380px)] flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={`az-toast pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-[0_16px_40px_-14px_var(--shadow)] backdrop-blur-xl ${STYLES[t.kind]}`}
        >
          <span className="mt-0.5 shrink-0">
            {t.kind === "ok" ? (
              <IconCheck className="h-4 w-4" />
            ) : t.kind === "err" ? (
              <IconX className="h-4 w-4" />
            ) : (
              <IconWarn className="h-4 w-4" />
            )}
          </span>
          <span className="leading-snug">{t.msg}</span>
          <button
            onClick={() => {
              sfx.snap();
              setList((l) => l.filter((x) => x.id !== t.id));
            }}
            className="ml-auto shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
