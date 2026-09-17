import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { api, GovService } from "../../api/client";
import {
  ArrowRight, Shield, Clock, Building2, Sparkles, Search,
  CheckCircle2, Layers, Zap, Globe, Filter, X, ChevronRight,
  Wheat, Home, Briefcase, Utensils, RefreshCw
} from "lucide-react";

// ---------------------------------------------------------------------------
// Category icon map
// ---------------------------------------------------------------------------
const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  "Employment & Skills": Briefcase,
  "Agriculture & Rural": Wheat,
  "Housing & Urban": Home,
  "Food & Civil Supplies": Utensils,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "Employment & Skills": { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   icon: "text-blue-600" },
  "Agriculture & Rural": { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  icon: "text-green-600" },
  "Housing & Urban":     { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  icon: "text-amber-600" },
  "Food & Civil Supplies":{ bg:"bg-orange-50", text:"text-orange-700",  border:"border-orange-200",  icon:"text-orange-600" },
};

const DEFAULT_COLOR = { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "text-violet-600" };

function getCategoryForService(id: string): string {
  const MAP: Record<string, string> = {
    "employment-support": "Employment & Skills",
    "farmer-dbt":         "Agriculture & Rural",
    "urban-housing":      "Housing & Urban",
    "smart-ration":       "Food & Civil Supplies",
  };
  return MAP[id] || "Welfare & Social";
}

// ---------------------------------------------------------------------------
// SLA badge
// ---------------------------------------------------------------------------
function SlaBadge({ days }: { days: number }) {
  const color = days <= 3 ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : days <= 7 ? "bg-amber-100 text-amber-800 border-amber-200"
              : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      <Clock className="w-2.5 h-2.5" />{days}d SLA
    </span>
  );
}

// ---------------------------------------------------------------------------
// Service card
// ---------------------------------------------------------------------------
function ServiceCard({ svc, lang }: { svc: GovService; lang: "en" | "mr" }) {
  const category = getCategoryForService(svc.id);
  const colors = CATEGORY_COLORS[category] || DEFAULT_COLOR;
  const CatIcon = CATEGORY_ICONS[category] || Layers;
  const displayName = lang === "mr" && svc.name_mr ? svc.name_mr : svc.name;
  const displayDesc = lang === "mr" && svc.description_mr ? svc.description_mr : svc.description;

  return (
    <div className={`group relative bg-white rounded-2xl border ${colors.border} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden`}>
      {/* Top accent strip */}
      <div className={`h-1 w-full ${colors.bg.replace("bg-", "bg-").replace("50", "400")}`}
        style={{ background: `var(--svc-accent, #e2e8f0)` }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Category + SLA */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
            <CatIcon className={`w-3 h-3 ${colors.icon}`} />
            {category}
          </div>
          <SlaBadge days={svc.sla_days} />
        </div>

        {/* Name */}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors">
            {displayName}
          </h2>
          {lang === "mr" && svc.name_mr && (
            <p className="text-xs text-slate-500 mt-0.5">{svc.name}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed flex-1">{displayDesc}</p>

        {/* Departments */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="text-[10px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-700" /> Federated Verification Chain
          </div>
          <div className="flex flex-wrap gap-1">
            {svc.participating_departments.map((d, i) => (
              <span key={i} className="text-[9px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Apply CTA */}
      <div className="px-5 pb-5">
        <Link to={`/services/${svc.id}/apply`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-colors shadow-sm group-hover:shadow-blue-900/20 group-hover:shadow-md">
          Apply with Service Passport
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------
function StatsCard({ icon: Icon, label, value, color }: { icon: React.FC<any>; label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-white/70 font-medium text-center leading-tight">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ServicesPage
// ---------------------------------------------------------------------------
export const ServicesPage: React.FC = () => {
  const { language } = useLanguage();
  const lang = language as "en" | "mr";

  const [services, setServices] = useState<GovService[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    async function load() {
      try {
        const [svcs, statsData] = await Promise.all([
          api.getServices(),
          api.getServiceStats().catch(() => null),
        ]);
        setServices(svcs);
        setStats(statsData);
      } catch (e) {
        console.error("Failed to load services", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build category list
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => getCategoryForService(s.id)));
    return ["All", ...Array.from(cats).sort()];
  }, [services]);

  // Filter services
  const filtered = useMemo(() => {
    return services.filter(svc => {
      const catMatch = activeCategory === "All" || getCategoryForService(svc.id) === activeCategory;
      if (!catMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        svc.name.toLowerCase().includes(q) ||
        (svc.name_mr && svc.name_mr.includes(q)) ||
        svc.description.toLowerCase().includes(q) ||
        svc.department.toLowerCase().includes(q)
      );
    });
  }, [services, searchQuery, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0f2942 0%, #1e3d6b 55%, #0f2942 100%)" }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 70% 40%, rgba(251,191,36,0.12) 0%, transparent 55%), radial-gradient(circle at 10% 80%, rgba(99,102,241,0.1) 0%, transparent 55%)" }} />

        <div className="relative px-6 sm:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-4">
                <Building2 className="w-3 h-3" /> Unified Citizen Services Catalog
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Government Welfare Schemes &amp; Services
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-xl leading-relaxed">
                Apply once with cryptographic consent. Participating departments verify your credentials collaboratively — you never re-upload the same document twice.
              </p>
            </div>

            {/* Stats strip */}
            {stats && (
              <div className="grid grid-cols-4 gap-6 shrink-0">
                <StatsCard icon={Layers}       label="Active Schemes"   value={stats.active_services}   color="text-amber-400" />
                <StatsCard icon={Building2}    label="Departments"      value={stats.total_departments} color="text-sky-400" />
                <StatsCard icon={Zap}          label="Min SLA (Days)"   value={stats.min_sla_days}      color="text-emerald-400" />
                <StatsCard icon={CheckCircle2} label="DPDP Compliant"   value="100%"                    color="text-violet-400" />
              </div>
            )}
          </div>

          {/* Compliance badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {["DPDP Act 2023 Compliant", "W3C Verifiable Credentials", "One Consent · All Departments", "SHA-256 Tamper-Proof Audit"].map(b => (
              <span key={b} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 bg-white/10 text-white/80 border border-white/20 rounded-full font-semibold">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search schemes by name, department, or keyword…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {categories.map(cat => {
            const colors = CATEGORY_COLORS[cat] || { bg: "", text: "", border: "" };
            return (
              <button key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-blue-950 text-white border-blue-950"
                    : `bg-white text-slate-600 border-slate-200 hover:border-blue-300`
                }`}>
                {cat}{cat !== "All" && ` (${services.filter(s => getCategoryForService(s.id) === cat).length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">
          {loading ? "Loading schemes…" : `Showing ${filtered.length} of ${services.length} active government schemes`}
        </p>
        {(searchQuery || activeCategory !== "All") && (
          <button onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm mb-1">No schemes found</h3>
          <p className="text-xs text-slate-500 mb-4">Try a different search term or category filter.</p>
          <button onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(svc => <ServiceCard key={svc.id} svc={svc} lang={lang} />)}
        </div>
      )}

      {/* Bottom CTA */}
      {!loading && filtered.length > 0 && (
        <div className="mt-10 bg-slate-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Need help finding the right scheme?</h3>
            <p className="text-xs text-slate-400 mt-0.5">Use the MahaSetu AI voice assistant or check your Proactive Entitlements</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/citizen/entitlements" className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-900 font-black text-xs rounded-xl hover:bg-amber-300 transition-colors whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5" /> Check Entitlements
            </Link>
            <Link to="/citizen/vaani" className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white font-bold text-xs rounded-xl hover:bg-white/20 transition-colors whitespace-nowrap">
              <Globe className="w-3.5 h-3.5" /> Marathi Voice Help
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
