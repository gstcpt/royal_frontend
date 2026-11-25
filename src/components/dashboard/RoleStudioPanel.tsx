'use client';

import * as React from 'react';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  LayoutGrid,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Badge, Button, Toggle } from '@/components/ui';
import {
  ACTION_FRENCH_TITLES,
  applyPresetToRoleState,
  DASHBOARD_VIEW_SECTIONS,
  formatModuleLabel,
  formatPermissionFrenchTitle,
  PERMISSION_DOMAINS,
  ROLE_PRESETS,
  RolePresetId,
} from '@/lib/rbac-catalog';

export interface StudioPermissionViewMeta {
  id?: string;
  permissionCode?: string;
  viewPath: string;
  viewLabelFr: string;
  sectionKey?: string;
  sectionOrder?: number;
  actionTitleFr?: string;
  backendRoute?: string | null;
}

export interface StudioPermissionItem {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
  actionTitleFr?: string | null;
  views?: StudioPermissionViewMeta[];
}

export interface StudioRoleItem {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSystem?: boolean;
  userCount?: number;
}

interface RoleStudioPanelProps {
  role: StudioRoleItem;
  roleDisplayName: string;
  roleDescription?: string | null;
  groupedPerms: Record<string, StudioPermissionItem[]>;
  permissionViews?: StudioPermissionViewMeta[];
  rolePermSet: Set<string>;
  roleViews: string[];
  visibilityMap: Record<string, 'PUBLIC' | 'PRIVATE'>;
  actionLabels?: Record<string, string>;
  onTogglePermission: (permId: string) => void;
  onSetModulePerms: (permIds: string[], enabled: boolean) => void;
  onSetRoleState: (permIds: Set<string>, views: string[]) => void;
  onToggleViewRoute: (routePath: string) => void;
  onToggleViewSection: (routePaths: string[], enableAll: boolean) => void;
}

const READ_ACTIONS = ['read', 'read_list', 'read_detail'];

export function RoleStudioPanel({
  role,
  roleDisplayName,
  roleDescription,
  groupedPerms,
  permissionViews = [],
  rolePermSet,
  roleViews,
  visibilityMap,
  actionLabels = ACTION_FRENCH_TITLES,
  onTogglePermission,
  onSetModulePerms,
  onSetRoleState,
  onToggleViewRoute,
  onToggleViewSection,
}: RoleStudioPanelProps) {
  const [studioTab, setStudioTab] = React.useState<'unified' | 'views'>('unified');
  const [searchQuery, setSearchQuery] = React.useState('');
  // Par défaut : les 13 accordéons sont TOUS fermés au chargement
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});
  const [activeSectionFilter, setActiveSectionFilter] = React.useState<string>('ALL');

  const isRootRole = role.name === 'ROOT';
  const roleViewsSet = React.useMemo(() => new Set(roleViews), [roleViews]);
  const allModulesList = React.useMemo(
    () => Object.keys(groupedPerms).sort((a, b) => a.localeCompare(b)),
    [groupedPerms],
  );

  // Index permissions_views par route pour enrichir les tooltips/badges d'API backend
  const viewMetaByPath = React.useMemo(() => {
    const map = new Map<string, { permCodes: Set<string>; backendRoutes: Set<string> }>();
    for (const pv of permissionViews) {
      if (!pv?.viewPath) continue;
      const cur = map.get(pv.viewPath) || { permCodes: new Set(), backendRoutes: new Set() };
      if (pv.permissionCode) cur.permCodes.add(pv.permissionCode);
      if (pv.backendRoute) {
        pv.backendRoute
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((ep) => cur.backendRoutes.add(ep));
      }
      map.set(pv.viewPath, cur);
    }
    return map;
  }, [permissionViews]);

  // Index des 13 sections canoniques 1..13 (modules + vues unifiés)
  const canonicalSections = React.useMemo(() => {
    const knownSet = new Set(PERMISSION_DOMAINS.flatMap((d) => d.modules));
    const customModules = allModulesList.filter((m) => !knownSet.has(m));
    const viewBySectionId = new Map(DASHBOARD_VIEW_SECTIONS.map((s) => [s.id, s]));

    const ordered = PERMISSION_DOMAINS.map((dom) => {
      const viewSec = viewMetaOrFallback(viewBySectionId.get(dom.id));
      return {
        order: dom.order,
        id: dom.id,
        label: dom.label,
        description: dom.description,
        modules: dom.modules.filter((m) => Boolean(groupedPerms[m]?.length)),
        routes: viewSec?.routes || [],
      };
    });

    if (customModules.length > 0) {
      ordered.push({
        order: 14,
        id: 'custom',
        label: '14. Modules personnalisés',
        description: 'Modules ajoutés manuellement ou spécifiques.',
        modules: customModules,
        routes: [],
      });
    }

    return ordered;

    function viewMetaOrFallback(sec: (typeof DASHBOARD_VIEW_SECTIONS)[number] | undefined) {
      return sec;
    }
  }, [allModulesList, groupedPerms]);

  const visibleSections = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return canonicalSections
      .filter((sec) => activeSectionFilter === 'ALL' || sec.id === activeSectionFilter)
      .map((sec) => {
        if (!q) return sec;
        const secMatches =
          sec.label.toLowerCase().includes(q) || sec.description.toLowerCase().includes(q);
        if (secMatches) return sec;

        const matchingModules = sec.modules.filter((m) => {
          if (m.toLowerCase().includes(q) || formatModuleLabel(m).toLowerCase().includes(q)) {
            return true;
          }
          const perms = groupedPerms[m] || [];
          return perms.some(
            (p) =>
              p.code.toLowerCase().includes(q) ||
              formatPermissionFrenchTitle(m, p.action, p.actionTitleFr).toLowerCase().includes(q),
          );
        });

        const matchingRoutes = sec.routes.filter(
          (r) => r.label.toLowerCase().includes(q) || r.path.toLowerCase().includes(q),
        );

        return {
          ...sec,
          modules: matchingModules,
          routes: matchingRoutes,
        };
      })
      .filter((sec) => sec.modules.length > 0 || sec.routes.length > 0);
  }, [canonicalSections, activeSectionFilter, searchQuery, groupedPerms]);

  const visibleViewSections = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DASHBOARD_VIEW_SECTIONS;
    return DASHBOARD_VIEW_SECTIONS.map((sec) => ({
      ...sec,
      routes: sec.routes.filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.path.toLowerCase().includes(q) ||
          sec.label.toLowerCase().includes(q),
      ),
    })).filter((sec) => sec.routes.length > 0);
  }, [searchQuery]);

  const toggleAccordion = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const anySectionExpanded = React.useMemo(
    () => visibleSections.some((s) => Boolean(openSections[s.id])),
    [visibleSections, openSections],
  );

  const toggleExpandAll = () => {
    const nextState: Record<string, boolean> = {};
    const targetOpen = !anySectionExpanded;
    for (const s of canonicalSections) {
      nextState[s.id] = targetOpen;
    }
    setOpenSections(nextState);
  };

  const handleApplyPreset = (presetId: RolePresetId) => {
    if (isRootRole) return;
    const next = applyPresetToRoleState(presetId, groupedPerms, rolePermSet, roleViews);
    onSetRoleState(next.permIds, next.views);
  };

  const toggleGroupAction = (modPerms: StudioPermissionItem[], actions: string[]) => {
    if (isRootRole) return;
    const matching = modPerms.filter((p) => actions.includes(p.action));
    if (matching.length === 0) return;
    const allEnabled = matching.every((p) => rolePermSet.has(p.id));
    onSetModulePerms(
      matching.map((p) => p.id),
      !allEnabled,
    );
  };

  const renderQuickPill = (
    label: string,
    modPerms: StudioPermissionItem[],
    actions: string[],
    tone: 'default' | 'danger' | 'amber' = 'default',
  ) => {
    const matching = modPerms.filter((p) => actions.includes(p.action));
    if (matching.length === 0) return null;
    const allChecked = isRootRole || matching.every((p) => rolePermSet.has(p.id));
    const someChecked = !allChecked && matching.some((p) => rolePermSet.has(p.id));

    const activeStyles =
      tone === 'danger'
        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
        : tone === 'amber'
          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
          : 'bg-[#1D232E] text-white border-[#1D232E] shadow-2xs';

    const partialStyles = 'bg-[#FBF6E8] text-[#9A7414] border-[#C59B27]';
    const inactiveStyles = 'bg-[#F8F9FA] text-slate-600 border-[#E6E1D6] hover:border-[#C59B27]';

    return (
      <button
        type="button"
        disabled={isRootRole}
        onClick={() => toggleGroupAction(modPerms, actions)}
        title={
          tone === 'amber'
            ? 'Attention : inclut toutes les actions y compris Supprimer'
            : `${label} (${matching.map((m) => m.action).join(', ')})`
        }
        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          allChecked ? activeStyles : someChecked ? partialStyles : inactiveStyles
        }`}
      >
        <span>{label}</span>
        {someChecked && <span className="text-[9px] opacity-80">(partiel)</span>}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs overflow-hidden">
      {/* Top Studio Header */}
      <div className="p-5 bg-[#FBF9F4] border-b border-[#E6E1D6] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7414]">
                Assistant Simple par Profil — 13 Sections Sidebar
              </span>
              {isRootRole ? (
                <Badge variant="warning" size="sm">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  ROOT Verrouillé (100% Accès)
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  {rolePermSet.size} permissions · {roleViews.length} vues actives
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-heading font-black text-[#1D232E]">{roleDisplayName}</h2>
            {roleDescription && <p className="text-xs text-slate-500">{roleDescription}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#C59B27] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher action FR, module ou URL..."
                className="pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E6E1D6] text-xs w-64 focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="inline-flex p-1 rounded-xl bg-white border border-[#E6E1D6]">
              <button
                type="button"
                onClick={() => setStudioTab('unified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  studioTab === 'unified'
                    ? 'bg-[var(--royal-primary)] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#1D232E]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1..13 Sections &amp; Droits</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioTab('views')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  studioTab === 'views'
                    ? 'bg-[var(--royal-primary)] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#1D232E]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vues rapides ({roleViews.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* One-Click Presets Row */}
        {!isRootRole && (
          <div className="pt-3 border-t border-[#E6E1D6]/80 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9A7414] mr-1">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Modèles rapides (1 clic) :</span>
            </span>
            {ROLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                title={preset.summary}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                  preset.tone === 'gold'
                    ? 'bg-[#FBF6E8] border-[#C59B27]/60 text-[#8C6400] hover:bg-[#F3E9C9]'
                    : preset.tone === 'emerald'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : preset.tone === 'rose'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-white border-[#E6E1D6] text-slate-700 hover:border-[#C59B27]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: 13 NUMBERED ACCORDIONS (CLOSED BY DEFAULT) */}
      {studioTab === 'unified' && (
        <div className="p-5 space-y-4">
          {/* Section Filter Bar + Expand/Collapse All */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSectionFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  activeSectionFilter === 'ALL'
                    ? 'bg-[#1D232E] text-white border-[#1D232E]'
                    : 'bg-[#F8F9FA] text-slate-600 border-[#E6E1D6] hover:border-[#C59B27]'
                }`}
              >
                Toutes les sections ({canonicalSections.length})
              </button>
              {canonicalSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSectionFilter(sec.id);
                    setOpenSections((prev) => ({ ...prev, [sec.id]: true }));
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    activeSectionFilter === sec.id
                      ? 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)]'
                      : 'bg-white text-slate-600 border-[#E6E1D6] hover:border-[#C59B27]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={toggleExpandAll} className="shrink-0">
              {anySectionExpanded ? (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Tout replier</span>
                </>
              ) : (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Tout déplier</span>
                </>
              )}
            </Button>
          </div>

          {/* 1..13 Separate Accordions */}
          <div className="space-y-2.5">
            {visibleSections.map((sec) => {
              const sectionPerms = sec.modules.flatMap((m) => groupedPerms[m] || []);
              const sectionNoDeleteIds = sectionPerms
                .filter((p) => p.action !== 'delete' && p.action !== 'manage')
                .map((p) => p.id);
              const enabledPermsCount = isRootRole
                ? sectionPerms.length
                : sectionPerms.filter((p) => rolePermSet.has(p.id)).length;

              const routePaths = sec.routes.map((r) => r.path);
              const enabledViewsCount = isRootRole
                ? routePaths.length
                : routePaths.filter((p) => roleViewsSet.has(p)).length;
              const allViewsChecked =
                routePaths.length > 0 && enabledViewsCount === routePaths.length;

              const isExpanded = Boolean(openSections[sec.id]) || Boolean(searchQuery.trim());

              return (
                <div
                  key={sec.id}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isExpanded
                      ? 'border-[#C59B27]/60 bg-white shadow-2xs'
                      : 'border-[#E6E1D6] bg-white hover:border-[#C59B27]/50'
                  }`}
                >
                  {/* Accordion Header */}
                  <div className="px-4 py-3 bg-[#FBF9F4] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleAccordion(sec.id)}
                      aria-expanded={isExpanded}
                      className="flex items-start sm:items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="w-7 h-7 rounded-xl bg-white border border-[#E6E1D6] flex items-center justify-center text-[#9A7414] shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-[#1D232E]">{sec.label}</h3>
                          {sectionPerms.length > 0 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#E6E1D6] text-[#9A7414]">
                              {enabledPermsCount}/{sectionPerms.length} droits
                            </span>
                          )}
                          {routePaths.length > 0 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#E6E1D6] text-slate-600">
                              {enabledViewsCount}/{routePaths.length} vues
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {sec.description}
                        </p>
                      </div>
                    </button>

                    {!isRootRole && (
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-10 md:pl-0">
                        {sectionNoDeleteIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onSetModulePerms(sectionNoDeleteIds, true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
                          >
                            + Droits sans Supprimer
                          </button>
                        )}
                        {sectionPerms.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allActive = sectionPerms.every((p) => rolePermSet.has(p.id));
                              onSetModulePerms(
                                sectionPerms.map((p) => p.id),
                                !allActive,
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-[#E6E1D6] hover:border-[#C59B27] text-[11px] font-bold cursor-pointer"
                          >
                            Basculer droits
                          </button>
                        )}
                        {routePaths.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 pl-1.5 border-l border-[#E6E1D6]">
                            <span className="text-[10px] font-bold text-slate-500">Vues</span>
                            <Toggle
                              compact
                              size="sm"
                              checked={allViewsChecked}
                              onChange={() => onToggleViewSection(routePaths, !allViewsChecked)}
                              ariaLabel={`Basculer toutes les vues ${sec.label}`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="border-t border-[#E6E1D6] divide-y divide-slate-100">
                      {/* Sub-block A: Vues du Menu (permissions_views) */}
                      {sec.routes.length > 0 && (
                        <div className="p-4 bg-[#F8F9FA]/60 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9A7414] flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Vues du Menu Sidebar &amp; Routes ({sec.routes.length})</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                            {sec.routes.map((route) => {
                              const isGlobalPrivate = visibilityMap[route.path] === 'PRIVATE';
                              const checked = isRootRole || roleViewsSet.has(route.path);
                              const meta = viewMetaByPath.get(route.path);
                              const linkedPermHint = meta
                                ? Array.from(meta.permCodes).slice(0, 2).join(', ')
                                : null;

                              return (
                                <div
                                  key={route.path}
                                  className="px-3 py-2 rounded-xl bg-white border border-[#E6E1D6]/80 hover:border-[#C59B27]/60 flex items-center justify-between gap-2 transition"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-[#1D232E] truncate">
                                        {route.label}
                                      </span>
                                      {isGlobalPrivate && (
                                        <span
                                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-800 shrink-0"
                                          title="Route globalement privée dans Visibilité des vues"
                                        >
                                          <Lock className="w-2.5 h-2.5" />
                                          <span>PRIVÉ</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 truncate">
                                      {route.path}
                                      {linkedPermHint ? ` · [${linkedPermHint}]` : ''}
                                    </div>
                                  </div>

                                  <Toggle
                                    compact
                                    size="sm"
                                    disabled={isRootRole}
                                    checked={checked}
                                    onChange={() => onToggleViewRoute(route.path)}
                                    ariaLabel={`${route.label} pour ${roleDisplayName}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sub-block B: Modules & Permissions Actions FR */}
                      {sec.modules.length > 0 && (
                        <div className="divide-y divide-slate-100">
                          {sec.modules.map((mod) => {
                            const modPerms = groupedPerms[mod] || [];
                            const enabledCount = isRootRole
                              ? modPerms.length
                              : modPerms.filter((p) => rolePermSet.has(p.id)).length;

                            return (
                              <div key={mod} className="p-4 space-y-3 hover:bg-[#FBF9F4]/30">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-[#1D232E]">
                                      {formatModuleLabel(mod)}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E6E1D6]">
                                      {mod}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-[#9A7414]">
                                      {enabledCount}/{modPerms.length}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {renderQuickPill('Voir', modPerms, READ_ACTIONS)}
                                    {renderQuickPill('Ajouter', modPerms, ['create'])}
                                    {renderQuickPill('Modifier', modPerms, ['update'])}
                                    {renderQuickPill('Supprimer', modPerms, ['delete'], 'danger')}
                                    {renderQuickPill(
                                      'Gestion complète',
                                      modPerms,
                                      ['manage'],
                                      'amber',
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                  {modPerms.map((perm) => {
                                    const checked = isRootRole || rolePermSet.has(perm.id);
                                    const titleFr = formatPermissionFrenchTitle(
                                      mod,
                                      perm.action,
                                      perm.actionTitleFr,
                                    );
                                    const linkedViews = perm.views || [];

                                    return (
                                      <div
                                        key={perm.id}
                                        className={`px-3 py-2.5 rounded-xl border flex items-start justify-between gap-2.5 transition ${
                                          checked
                                            ? 'bg-[#FBF6E8]/45 border-[#C59B27]/50'
                                            : 'bg-[#F8F9FA] border-[#E6E1D6]/80'
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <div className="text-[11.5px] font-bold text-[#1D232E] leading-snug">
                                            {titleFr}
                                          </div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-mono text-slate-500">
                                              {perm.code}
                                            </span>
                                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white border border-[#E6E1D6] text-[#9A7414] font-semibold">
                                              {actionLabels[perm.action] || perm.action}
                                            </span>
                                          </div>
                                          {linkedViews.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                              {linkedViews.slice(0, 2).map((v) => (
                                                <span
                                                  key={`${perm.id}-${v.viewPath}`}
                                                  title={v.backendRoute || v.viewPath}
                                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 truncate max-w-[200px]"
                                                >
                                                  {v.viewPath}
                                                </span>
                                              ))}
                                              {linkedViews.length > 2 && (
                                                <span className="text-[9px] font-mono text-slate-400">
                                                  +{linkedViews.length - 2}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <Toggle
                                          compact
                                          size="sm"
                                          disabled={isRootRole}
                                          checked={checked}
                                          onChange={() => onTogglePermission(perm.id)}
                                          ariaLabel={titleFr}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COMPACT GRID OF ALL 78 VIEWS */}
      {studioTab === 'views' && (
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-[#1D232E] flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-[#C59B27]" />
                <span>Accès Dynamique aux Vues &amp; Sections du Dashboard (78 vues)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Activez exactement les pages visibles dans le menu gauche et accessibles par URL pour{' '}
                <strong>{roleDisplayName}</strong>. Les pages marquées{' '}
                <span className="font-bold text-amber-800">PRIVÉ</span> doivent également être passées en{' '}
                <strong>PUBLIC</strong> dans <em>Visibilité des vues</em> pour les comptes non-ROOT.
              </p>
            </div>
            {!isRootRole && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allPublicRoutes = DASHBOARD_VIEW_SECTIONS.flatMap((s) =>
                      s.routes.filter((r) => visibilityMap[r.path] !== 'PRIVATE').map((r) => r.path),
                    );
                    onToggleViewSection(allPublicRoutes, true);
                  }}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Tout Public</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset('MARKETING_FULL')}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Pack Marketing</span>
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleViewSections.map((section) => {
              const paths = section.routes.map((r) => r.path);
              const enabledInSection = isRootRole
                ? paths.length
                : paths.filter((p) => roleViewsSet.has(p)).length;
              const allSectionChecked =
                paths.length > 0 && enabledInSection === paths.length;

              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-[#E6E1D6] bg-white overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 bg-[#FBF9F4] border-b border-[#E6E1D6] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#1D232E] truncate">
                        {section.label}
                      </div>
                      <div className="text-[10px] font-mono text-[#9A7414]">
                        {enabledInSection}/{paths.length} vues actives
                      </div>
                    </div>
                    {!isRootRole && (
                      <Toggle
                        compact
                        size="sm"
                        checked={allSectionChecked}
                        onChange={() => onToggleViewSection(paths, !allSectionChecked)}
                        ariaLabel={`Basculer toutes les vues ${section.label}`}
                      />
                    )}
                  </div>

                  <div className="p-2.5 space-y-1.5 flex-1">
                    {section.routes.map((route) => {
                      const isGlobalPrivate = visibilityMap[route.path] === 'PRIVATE';
                      const checked = isRootRole || roleViewsSet.has(route.path);

                      return (
                        <div
                          key={route.path}
                          className="px-3 py-2 rounded-xl hover:bg-[#F8F9FA] border border-transparent hover:border-[#E6E1D6]/70 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#1D232E]">
                                {route.label}
                              </span>
                              {isGlobalPrivate && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-800"
                                  title="Route globalement privée dans Visibilité des vues"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>PRIVÉ</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate">
                              {route.path}
                            </div>
                          </div>

                          <Toggle
                            compact
                            size="sm"
                            disabled={isRootRole}
                            checked={checked}
                            onChange={() => onToggleViewRoute(route.path)}
                            ariaLabel={`${route.label} pour ${roleDisplayName}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
