"use client";

import { motion } from "framer-motion";
import { Globe, Database, Eye } from "lucide-react";

const agents = [
  {
    icon: Globe,
    name: "Browser Agent",
    simulates: "Personal AI agents with web access",
    tests: [
      "Navigate from homepage to product",
      "Select size, color, and variants",
      "Add to cart and reach checkout",
      "Dismiss popups and cookie banners",
    ],
  },
  {
    icon: Database,
    name: "Data Agent",
    simulates: "Agents reading structured data & APIs",
    tests: [
      "Schema.org product markup",
      "JSON-LD and Open Graph tags",
      "Product API endpoints",
      "robots.txt and sitemap access",
    ],
  },
  {
    icon: Eye,
    name: "Accessibility Agent",
    simulates: "Agents using the accessibility tree",
    tests: [
      "ARIA labels on interactive elements",
      "Keyboard-navigable menus",
      "Screen reader compatibility",
      "Focus management and traps",
    ],
  },
];

export function AgentTypesPreview() {
  return (
    <section className="py-20">
      <h2 className="text-xl font-semibold text-foreground text-center mb-3">
        Three agents, three perspectives
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-12 max-w-lg mx-auto">
        Personal AI agents interact with sites in different ways. We test all three to give you complete coverage.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <div className="w-10 h-10 rounded-lg bg-arc-accent/10 flex items-center justify-center mb-4">
              <agent.icon size={20} className="text-arc-accent" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {agent.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {agent.simulates}
            </p>
            <ul className="space-y-2">
              {agent.tests.map((test) => (
                <li
                  key={test}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-arc-accent mt-0.5">&#x2022;</span>
                  {test}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
