"use client";

import { useEffect, useState } from "react";
import { isIos, isStandalone } from "@/lib/pwa";

const KEY = "nourish-install-tip-dismissed";

/** On iPhone Safari, explains how to add the app to the Home Screen. */
export function InstallTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {}
    setShow(isIos() && !isStandalone() && !dismissed);
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-rose-900">Install Nourish on your iPhone</p>
        <button
          aria-label="Dismiss"
          className="text-stone-400"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
        >
          ✕
        </button>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Tap the <span className="font-medium">Share</span> button (square with an arrow) in Safari.
        </li>
        <li>
          Choose <span className="font-medium">Add to Home Screen</span>, then <span className="font-medium">Add</span>.
        </li>
        <li>Open Nourish from your Home Screen to turn on reminders.</li>
      </ol>
    </div>
  );
}
