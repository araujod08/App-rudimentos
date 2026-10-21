"use client";
import { useState } from "react";
import RudimentPlayer from "./components/RudimentPlayer";
import FillBuilder from "./components/FillBuilder";
import "./rudimentos.css";

export default function Page() {
  const [tab, setTab] = useState<"R" | "V">("R");
  return (
    <main className="w">
      <h1>🥁 40 Rudimentos</h1>
      <div className="chips tabs">
        <button className={tab === "R" ? "on" : ""} onClick={() => setTab("R")}>🥁 Rudimentos</button>
        <button className={tab === "V" ? "on" : ""} onClick={() => setTab("V")}>🎛 Viradas</button>
      </div>
      {tab === "R" ? <RudimentPlayer /> : <FillBuilder />}
    </main>
  );
}
