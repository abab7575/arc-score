"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Scan,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";

interface Brand {
  id: number;
  slug: string;
  name: string;
  url: string;
  category: string;
  active: boolean;
  latestScore: number | null;
  latestGrade: string | null;
  lastScannedAt: string | null;
}

interface Submission {
  id: number;
  brandName: string;
  url: string;
  productUrl: string | null;
  category: string | null;
  email: string | null;
  status: string;
  createdAt: string;
}

type Tab = "brands" | "add" | "submissions";

function gradeColor(grade: string | null) {
  switch (grade) {
    case "A": return "text-emerald-600";
    case "B": return "text-blue-600";
    case "C": return "text-yellow-600";
    case "D": return "text-orange-600";
    case "F": return "text-red-600";
    default: return "text-muted-foreground/60";
  }
}

export default function AdminBrandsPage() {
  const [tab, setTab] = useState<Tab>("brands");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "score" | "date">("name");
  const [loading, setLoading] = useState(true);

  // Add brand form
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [adding, setAdding] = useState(false);

  async function fetchBrands() {
    try {
      const res = await fetch("/api/admin/brands");
      if (res.ok) setBrands(await res.json());
    } catch {}
  }

  async function fetchSubmissions() {
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.ok) setSubmissions(await res.json());
    } catch {}
  }

  useEffect(() => {
    Promise.all([fetchBrands(), fetchSubmissions()]).finally(() => setLoading(false));
  }, []);

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        url: newUrl,
        category: newCategory,
        productUrl: newProductUrl || undefined,
      }),
    });
    setNewName("");
    setNewUrl("");
    setNewProductUrl("");
    setAdding(false);
    await fetchBrands();
    setTab("brands");
  }

  async function toggleActive(id: number, active: boolean) {
    await fetch(`/api/admin/brands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active } : b))
    );
  }

  async function triggerScan(id: number) {
    await fetch(`/api/admin/brands/${id}/scan`, { method: "POST" });
  }

  async function handleSubmission(id: number, status: "approved" | "rejected") {
    await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    if (status === "approved") await fetchBrands();
  }

  const filtered = brands
    .filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "score") return (b.latestScore ?? -1) - (a.latestScore ?? -1);
      if (sort === "date") return (b.lastScannedAt ?? "").localeCompare(a.lastScannedAt ?? "");
      return a.name.localeCompare(b.name);
    });

  const categories = [
    "general", "fashion", "electronics", "home", "beauty",
    "grocery", "marketplace", "dtc", "luxury", "sports",
  ];

  const tabs = [
    { id: "brands" as Tab, label: "All Brands", count: brands.length },
    { id: "add" as Tab, label: "Add Brand" },
    { id: "submissions" as Tab, label: "Submissions", count: submissions.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Brands</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[#0259DD] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-border text-xs">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All Brands Tab */}
      {tab === "brands" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="px-3 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
            >
              <option value="name">Name</option>
              <option value="score">Score</option>
              <option value="date">Last Scan</option>
            </select>
          </div>

          <div className="bg-white border border-border shadow-sm rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map((brand) => (
                <div
                  key={brand.id}
                  className={`px-5 py-3 flex items-center justify-between ${
                    !brand.active ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={`font-mono font-bold text-lg w-8 text-center ${gradeColor(
                        brand.latestGrade
                      )}`}
                    >
                      {brand.latestGrade ?? "–"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {brand.name}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {brand.category} · {brand.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {brand.latestScore !== null && (
                      <span className="text-sm font-mono text-muted-foreground w-14 text-right">
                        {brand.latestScore}/100
                      </span>
                    )}
                    <button
                      onClick={() => triggerScan(brand.id)}
                      className="p-2 rounded-md hover:bg-secondary text-muted-foreground/60 hover:text-foreground transition-colors"
                      title="Trigger scan"
                    >
                      <Scan className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(brand.id, !brand.active)}
                      className="p-2 rounded-md hover:bg-secondary text-muted-foreground/60 hover:text-foreground transition-colors"
                      title={brand.active ? "Deactivate" : "Activate"}
                    >
                      {brand.active ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Brand Tab */}
      {tab === "add" && (
        <div className="max-w-lg">
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Brand Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                placeholder="e.g. Nike"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                placeholder="https://nike.com"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Product URL <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                type="url"
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                placeholder="https://nike.com/running-shoes/air-max"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={adding || !newName || !newUrl}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0259DD] text-white text-sm font-medium hover:bg-[#0259DD]/80 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {adding ? "Adding..." : "Add Brand"}
            </button>
          </form>
        </div>
      )}

      {/* Submissions Tab */}
      {tab === "submissions" && (
        <div className="space-y-3">
          {submissions.length === 0 && (
            <div className="bg-white border border-border shadow-sm rounded-xl px-5 py-8 text-center text-muted-foreground/60 text-sm">
              No pending submissions.
            </div>
          )}
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-border shadow-sm rounded-xl px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{sub.brandName}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {sub.url}
                  {sub.category && ` · ${sub.category}`}
                  {sub.email && ` · ${sub.email}`}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Submitted {new Date(sub.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSubmission(sub.id, "approved")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-600 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleSubmission(sub.id, "rejected")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 text-red-600 text-xs font-medium hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
