"use client";
import { useState } from "react";
import RudimentPlayer from "./components/RudimentPlayer";
import FillBuilder from "./components/FillBuilder";
import Metronome from "./components/Metronome";
import "./rudimentos.css";

type Tab = "R" | "V" | "M";

export default function Page() {
  const [tab, setTab] = useState<Tab>("R");
  const tabs: [Tab, string][] = [["R", "🥁 Rudimentos"], ["V", "🎛 Viradas"], ["M", "⏱ Metrônomo"]];
  return (
    <main className="w">
      <h1>🥁 40 Rudimentos</h1>
      <div className="chips tabs">
        {tabs.map(([k, name]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{name}</button>
        ))}
      </div>
      {tab === "R" ? <RudimentPlayer /> : tab === "V" ? <FillBuilder /> : <Metronome />}
    </main>
  );
}