"use client";

import { useEffect, useState } from "react";
import {
  Send, Copy, Check, Mail, ExternalLink, ChevronDown, ChevronUp,
  Sparkles, SkipForward, MessageSquare, UserCheck, Search,
} from "lucide-react";

interface OutreachItem {
  id: number;
  brandId: number;
  brandName: string;
  brandSlug: string;
  brandUrl: string;
  contactEmail: string | null;
  contactName: string | null;
  contactTitle: string | null;
  emailSource: string | null;
  subject: string;
  body: string;
  brandScore: number;
  brandGrade: string;
  issueCount: number;
  topIssues: string;
  reportUrl: string;
  status: string;
  notes: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  queued: number;
  ready: number;
  sent: number;
  replied: number;
  converted: number;
  skipped: number;
}

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-gray-100 text-gray-600",
  email_found: "bg-blue-100 text-blue-700",
  ready: "bg-emerald-100 text-emerald-700",
  sent: "bg-amber-100 text-amber-700",
  replied: "bg-violet-100 text-violet-700",
  converted: "bg-emerald-200 text-emerald-800",
  skipped: "bg-gray-100 text-gray-400",
};

function gradeColor(grade: string | null): string {
  if (!grade) return "text-gray-400";
  if (grade === "A") return "text-emerald-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-amber-600";
  if (grade === "D") return "text-orange-600";
  return "text-red-600";
}

export default function OutreachPage() {
  const [items, setItems] = useState<OutreachItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [editingEmail, setEditingEmail] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [findingEmails, setFindingEmails] = useState(false);

  async function fetchItems() {
    try {
      const res = await fetch("/api/admin/outreach");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setStats(data.stats);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchItems().finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/outreach", { method: "POST" });
      if (res.ok) await fetchItems();
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await fetch(`/api/admin/outreach/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status, ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}) }
            : item
        )
      );
    } catch { /* ignore */ }
  }

  async function saveEmail(id: number) {
    try {
      await fetch(`/api/admin/outreach/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactEmail: emailInput, status: "ready" }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, contactEmail: emailInput, status: "ready" } : item
        )
      );
      setEditingEmail(null);
      setEmailInput("");
    } catch { /* ignore */ }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const filtered = filter === "all"
    ? items
    : items.filter((item) => item.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-xs text-gray-400">Loading outreach queue...</div>
      </div>
    );
  }

  const readyCount = items.filter((i) => i.status === "ready").length;
  const queuedCount = items.filter((i) => i.status === "queued").length;

  return (
    <div className="space-y-6">
      {/* Quick-start guide — only show when queue is empty or has actionable items */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-[#FF6648]/30 bg-[#FF6648]/5 p-6">
          <h2 className="text-base font-bold text-foreground mb-3">Get started in 3 steps</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex gap-3">
              <span className="data-num text-lg font-black text-[#FF6648]">1</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Generate Queue</p>
                <p className="text-xs text-muted-foreground">Click the button below. Creates pre-written emails for all brands scoring under 70.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="data-num text-lg font-black text-[#0259DD]">2</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Find Emails</p>
                <p className="text-xs text-muted-foreground">Apollo auto-finds contacts. Click &quot;Find Emails&quot; for more. Uses 1 credit per lookup.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="data-num text-lg font-black text-[#059669]">3</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Copy &amp; Send</p>
                <p className="text-xs text-muted-foreground">Open a card. Copy subject + body. Paste into your email. Send. Mark as sent.</p>
              </div>
            </div>
          </div>
        </div>
      ) : readyCount > 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#059669]/10 border border-[#059669]/20">
          <span className="text-sm">
            <strong className="text-[#059669]">{readyCount} emails ready to send.</strong>
            {" "}Expand a card below → copy subject + body → paste into your email → send → mark as sent.
          </span>
        </div>
      ) : queuedCount > 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0259DD]/10 border border-[#0259DD]/20">
          <span className="text-sm">
            <strong className="text-[#0259DD]">{queuedCount} brands need emails.</strong>
            {" "}Click &quot;Find Emails (Apollo)&quot; to auto-discover contacts, or add emails manually.
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Outreach</h1>
          <p className="text-sm text-muted-foreground">
            Pre-written emails for every scanned brand. Copy, paste, send.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setFindingEmails(true);
              try {
                const res = await fetch("/api/admin/outreach/find-emails", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ maxCredits: 10 }),
                });
                if (res.ok) await fetchItems();
              } catch { /* ignore */ }
              finally { setFindingEmails(false); }
            }}
            disabled={findingEmails}
            className="flex items-center gap-2 px-4 py-2 border border-[#0259DD] text-[#0259DD] text-sm font-bold hover:bg-[#0259DD] hover:text-white transition-colors disabled:opacity-50"
          >
            <Search size={14} />
            {findingEmails ? "Finding..." : "Find Emails (Apollo)"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} />
            {generating ? "Generating..." : "Generate Queue"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-7 gap-2">
          {Object.entries(stats).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilter(key === "total" ? "all" : key)}
              className={`text-center py-2 px-1 border transition-colors ${
                (key === "total" && filter === "all") || filter === key
                  ? "border-[#0259DD] bg-[#0259DD]/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="data-num text-lg font-bold text-foreground">{value}</div>
              <div className="spec-label text-[8px] text-muted-foreground capitalize">{key}</div>
            </button>
          ))}
        </div>
      )}

      {/* Queue */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {items.length === 0
              ? 'No outreach items yet. Click "Generate Queue" to create from scan data.'
              : `No items with status "${filter}".`}
          </div>
        )}

        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="border border-gray-200 bg-white">
              {/* Summary row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <span className={`data-num text-lg font-bold w-8 text-center ${gradeColor(item.brandGrade)}`}>
                  {item.brandScore}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{item.brandName}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[item.status] ?? "bg-gray-100"}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.contactEmail && (
                    <span className="text-xs text-muted-foreground">{item.contactEmail}</span>
                  )}
                  {item.issueCount > 0 && (
                    <span className="text-[10px] text-red-500 font-mono">{item.issueCount} issues</span>
                  )}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                  {/* Email address */}
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-muted-foreground shrink-0" />
                    {editingEmail === item.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="contact@brand.com"
                          className="flex-1 px-2 py-1 border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#0259DD]"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEmail(item.id)}
                          className="px-3 py-1 bg-[#0259DD] text-white text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingEmail(null); setEmailInput(""); }}
                          className="px-3 py-1 border border-gray-200 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : item.contactEmail ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-foreground">{item.contactEmail}</span>
                        {item.contactName && <span className="text-xs text-muted-foreground">({item.contactName})</span>}
                        <button
                          onClick={() => { setEditingEmail(item.id); setEmailInput(item.contactEmail ?? ""); }}
                          className="text-xs text-[#0259DD] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">No email yet</span>
                        <button
                          onClick={() => { setEditingEmail(item.id); setEmailInput(""); }}
                          className="text-xs text-[#0259DD] hover:underline"
                        >
                          Add email
                        </button>
                        <a
                          href={`https://hunter.io/search/${new URL(item.brandUrl).hostname}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Search size={10} /> Hunter.io
                          <ExternalLink size={10} />
                        </a>
                        <a
                          href={`https://app.apollo.io/#/people?organizationDomains[]=${new URL(item.brandUrl).hostname}&personTitles[]=Head%20of%20E-commerce&personTitles[]=VP%20Digital&personTitles[]=Head%20of%20Digital`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Search size={10} /> Apollo
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Subject line */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="spec-label text-[9px] text-muted-foreground">SUBJECT LINE</span>
                      <button
                        onClick={() => copyToClipboard(item.subject, `subject-${item.id}`)}
                        className="flex items-center gap-1 text-xs text-[#0259DD] hover:underline"
                      >
                        {copiedField === `subject-${item.id}` ? <Check size={10} /> : <Copy size={10} />}
                        {copiedField === `subject-${item.id}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-medium text-foreground">
                      {item.subject}
                    </div>
                  </div>

                  {/* Email body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="spec-label text-[9px] text-muted-foreground">EMAIL BODY</span>
                      <button
                        onClick={() => copyToClipboard(item.body, `body-${item.id}`)}
                        className="flex items-center gap-1 text-xs text-[#0259DD] hover:underline"
                      >
                        {copiedField === `body-${item.id}` ? <Check size={10} /> : <Copy size={10} />}
                        {copiedField === `body-${item.id}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="px-3 py-3 bg-gray-50 border border-gray-200 text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                      {item.body}
                    </pre>
                  </div>

                  {/* Report link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={item.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#0259DD] hover:underline"
                    >
                      View Report <ExternalLink size={10} />
                    </a>
                    <button
                      onClick={() => copyToClipboard(item.reportUrl, `url-${item.id}`)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copiedField === `url-${item.id}` ? <Check size={10} /> : <Copy size={10} />}
                      Copy URL
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {item.status !== "sent" && (
                      <button
                        onClick={() => updateStatus(item.id, "sent")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0259DD] text-white text-xs font-bold hover:bg-[#0249BB] transition-colors"
                      >
                        <Send size={11} /> Mark as Sent
                      </button>
                    )}
                    {item.status === "sent" && (
                      <button
                        onClick={() => updateStatus(item.id, "replied")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
                      >
                        <MessageSquare size={11} /> Got Reply
                      </button>
                    )}
                    {item.status === "replied" && (
                      <button
                        onClick={() => updateStatus(item.id, "converted")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        <UserCheck size={11} /> Converted
                      </button>
                    )}
                    {item.status !== "skipped" && item.status !== "sent" && (
                      <button
                        onClick={() => updateStatus(item.id, "skipped")}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-muted-foreground hover:bg-gray-50 transition-colors"
                      >
                        <SkipForward size={11} /> Skip
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
