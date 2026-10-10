"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

export default function AppSplash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const fade = window.setTimeout(() => setLeaving(true), 1800);
    const close = window.setTimeout(() => setVisible(false), 2250);
    return () => { window.clearTimeout(fade); window.clearTimeout(close); };
  }, []);
  if (!visible) return null;
  return (
    <div className={`app-splash${leaving ? " app-splash-leaving" : ""}`} role="status" aria-label="Welcome to Battle of the States" onClick={() => setVisible(false)}>
      <div className="app-splash-content">
        <div className="app-splash-emblem" aria-hidden="true"><Trophy strokeWidth={1.5}/><span>BOT<span>S</span></span></div>
        <h1>Battle of<br/>the States</h1>
        <p>eFootball Mobile</p>
      </div>
      <div className="app-splash-progress" aria-hidden="true"><span/></div>
    </div>
  );
}
