"use client";

import { motion } from "framer-motion";
import { ScoreGauge } from "./score-gauge";

interface ScoreHeroProps {
  score: number;
  grade: string;
  verdict: string;
  comparison: string;
}

export function ScoreHero({ score, verdict, comparison }: ScoreHeroProps) {
  return (
    <section className="relative py-16 flex flex-col items-center text-center overflow-hidden">
      {/* Radial glow behind gauge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px circle at 50% 40%, rgba(79,70,229,0.06), transparent 70%)",
        }}
      />

      <ScoreGauge score={score} />

      <motion.p
        className="mt-8 text-lg md:text-xl text-foreground/90 max-w-2xl leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.5 }}
      >
        {verdict}
      </motion.p>

      <motion.p
        className="mt-3 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3, duration: 0.4 }}
      >
        {comparison}
      </motion.p>
    </section>
  );
}
