import type { CategoryId, Grade, Severity } from "@/types/report";

export const CATEGORY_CONFIG: Record<
  CategoryId,
  { name: string; weight: number; description: string }
> = {
  discoverability: {
    name: "Discoverability",
    weight: 0.15,
    description: "Can AI agents find products from the homepage? Measures navigation, search, and product listing quality.",
  },
  "product-understanding": {
    name: "Product Understanding",
    weight: 0.2,
    description: "Can AI agents read and understand product details like price, size, color, and availability?",
  },
  "navigation-interaction": {
    name: "Navigation & Interaction",
    weight: 0.2,
    description: "Can AI agents click buttons, use filters, select options, and navigate between pages?",
  },
  "cart-checkout": {
    name: "Cart & Checkout",
    weight: 0.25,
    description: "Can AI agents add items to cart and complete a purchase — the most critical step in the shopping journey.",
  },
  "performance-resilience": {
    name: "Performance & Resilience",
    weight: 0.05,
    description: "Does the site load fast enough and stay stable when AI agents interact with it?",
  },
  "data-standards": {
    name: "Data Standards & Feeds",
    weight: 0.05,
    description: "Does the site provide machine-readable product data (like Schema.org markup and XML sitemaps) that AI agents can parse?",
  },
  "agentic-commerce": {
    name: "Agentic Commerce",
    weight: 0.1,
    description: "Does this site support programmatic checkout APIs (like ACP) that let AI agents buy without browser automation?",
  },
};

export const GRADE_THRESHOLDS: {
  min: number;
  grade: Grade;
  label: string;
  color: string;
}[] = [
  { min: 85, grade: "A", label: "Agent-Ready", color: "#059669" },
  { min: 70, grade: "B", label: "Mostly Ready", color: "#0259DD" },
  { min: 50, grade: "C", label: "Needs Work", color: "#d97706" },
  { min: 30, grade: "D", label: "Poor", color: "#ea580c" },
  { min: 0, grade: "F", label: "Not Ready", color: "#dc2626" },
];

export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bgColor: string }
> = {
  critical: {
    label: "Critical",
    color: "#dc2626",
    bgColor: "#fef2f2",
  },
  high: {
    label: "High",
    color: "#ea580c",
    bgColor: "#fff7ed",
  },
  medium: {
    label: "Medium",
    color: "#d97706",
    bgColor: "#fffbeb",
  },
  low: {
    label: "Low",
    color: "#4f46e5",
    bgColor: "#eef2ff",
  },
};

export const AGENT_CONFIG: Record<
  string,
  { name: string; icon: string; description: string }
> = {
  browser: {
    name: "Browser Agent",
    icon: "Globe",
    description:
      "Navigates your site like a personal AI agent would — clicking links, filling forms, interacting with the DOM.",
  },
  data: {
    name: "Data Agent",
    icon: "Database",
    description:
      "Reads structured data, APIs, and feeds. Tests if an agent can understand your catalog without rendering the page.",
  },
  accessibility: {
    name: "Accessibility Agent",
    icon: "Eye",
    description:
      "Uses the accessibility tree and ARIA labels. Tests if interactive elements work without visual rendering.",
  },
};
