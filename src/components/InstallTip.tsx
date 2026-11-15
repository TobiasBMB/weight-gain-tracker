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
    <div className="rounded-[20px] border border-baby bg-card p-4 text-sm text-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-bold text-fg">Install Nourish on your iPhone</p>
        <button
          aria-label="Dismiss"
          className="-m-2 flex h-11 w-11 items-center justify-center text-muted"
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
          Tap the <span className="font-semibold text-fg">Share</span> button (square with an arrow) in Safari.
        </li>
        <li>
          Choose <span className="font-semibold text-fg">Add to Home Screen</span>, then <span className="font-semibold text-fg">Add</span>.
        </li>
        <li>Open Nourish from your Home Screen to turn on reminders.</li>
      </ol>
    </div>
  );
}
