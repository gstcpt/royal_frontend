'use client';

import * as React from 'react';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
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
  applyPresetToRoleState,
  DASHBOARD_VIEW_SECTIONS,
  formatModuleLabel,
  PERMISSION_DOMAINS,
  ROLE_PRESETS,
  RolePresetId,
} from '@/lib/rbac-catalog';

export interface StudioPermissionItem {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
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
  rolePermSet: Set<string>;
  roleViews: string[];
  visibilityMap: Record<string, 'PUBLIC' | 'PRIVATE'>;
  actionLabels: Record<string, string>;
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
  rolePermSet,
  roleViews,
  visibilityMap,
  actionLabels,
  onTogglePermission,
  onSetModulePerms,
  onSetRoleState,
  onToggleViewRoute,
  onToggleViewSection,
}: RoleStudioPanelProps) {
  const [studioTab, setStudioTab] = React.useState<'permissions' | 'views'>('permissions');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedRawModules, setExpandedRawModules] = React.useState<Record<string, boolean>>({});
  const [activeDomainId, setActiveDomainId] = React.useState<string>('ALL');

  const isRootRole = role.name === 'ROOT';
  const roleViewsSet = React.useMemo(() => new Set(roleViews), [roleViews]);
  const allModulesList = React.useMemo(
    () => Object.keys(groupedPerms).sort((a, b) => a.localeCompare(b)),
    [groupedPerms],
  );

  // Build domain buckets dynamically including any custom modules in DB
  const domainBuckets = React.useMemo(() => {
    const knownSet = new Set(PERMISSION_DOMAINS.flatMap((d) => d.modules));
    const customModules = allModulesList.filter((m) => !knownSet.has(m));
    const base = PERMISSION_DOMAINS.map((d) => ({
      ...d,
      modules: d.modules.filter((m) => Boolean(groupedPerms[m]?.length)),
    })).filter((d) => d.modules.length > 0);

    if (customModules.length > 0) {
      base.push({
        id: 'custom',
        label: 'Modules Personnalisés / Autres',
        description: 'Modules ajoutés manuellement ou spécifiques.',
        modules: customModules,
      });
    }
    return base;
  }, [allModulesList, groupedPerms]);

  const visibleDomains = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return domainBuckets
      .filter((d) => activeDomainId === 'ALL' || d.id === activeDomainId)
      .map((d) => ({
        ...d,
        modules: d.modules.filter((m) => {
          if (!q) return true;
          return (
            m.toLowerCase().includes(q) ||
            formatModuleLabel(m).toLowerCase().includes(q) ||
            d.label.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((d) => d.modules.length > 0);
  }, [domainBuckets, activeDomainId, searchQuery]);

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
                Assistant Simple par Profil
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
                placeholder={
                  studioTab === 'permissions'
                    ? 'Rechercher un module (ex: articles, contact...)'
                    : 'Rechercher une vue ou URL...'
                }
                className="pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E6E1D6] text-xs w-64 focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="inline-flex p-1 rounded-xl bg-white border border-[#E6E1D6]">
              <button
                type="button"
                onClick={() => setStudioTab('permissions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  studioTab === 'permissions'
                    ? 'bg-[var(--royal-primary)] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#1D232E]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Droits &amp; Actions</span>
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
                <span>2. Vues Dashboard ({roleViews.length})</span>
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

      {/* TAB 1: SIMPLIFIED PERMISSIONS */}
      {studioTab === 'permissions' && (
        <div className="p-5 space-y-5">
          {/* Domain Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveDomainId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                activeDomainId === 'ALL'
                  ? 'bg-[#1D232E] text-white border-[#1D232E]'
                  : 'bg-[#F8F9FA] text-slate-600 border-[#E6E1D6] hover:border-[#C59B27]'
              }`}
            >
              Tous les domaines ({domainBuckets.length})
            </button>
            {domainBuckets.map((dom) => (
              <button
                key={dom.id}
                type="button"
                onClick={() => setActiveDomainId(dom.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  activeDomainId === dom.id
                    ? 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)]'
                    : 'bg-white text-slate-600 border-[#E6E1D6] hover:border-[#C59B27]'
                }`}
              >
                {dom.label}
              </button>
            ))}
          </div>

          {/* Domain Sections */}
          <div className="space-y-4">
            {visibleDomains.map((dom) => {
              const domainPerms = dom.modules.flatMap((m) => groupedPerms[m] || []);
              const domainNoDeleteIds = domainPerms
                .filter((p) => p.action !== 'delete' && p.action !== 'manage')
                .map((p) => p.id);
              const domainEnabledCount = domainPerms.filter((p) => rolePermSet.has(p.id)).length;

              return (
                <div
                  key={dom.id}
                  className="rounded-2xl border border-[#E6E1D6] bg-white overflow-hidden"
                >
                  <div className="px-4 py-3 bg-[#FBF9F4] border-b border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#1D232E]">{dom.label}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#E6E1D6] text-[#9A7414]">
                          {domainEnabledCount}/{domainPerms.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{dom.description}</p>
                    </div>
                    {!isRootRole && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {domainNoDeleteIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onSetModulePerms(domainNoDeleteIds, true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
                          >
                            + Tout sans Supprimer
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const allActive =
                              domainPerms.length > 0 &&
                              domainPerms.every((p) => rolePermSet.has(p.id));
                            onSetModulePerms(
                              domainPerms.map((p) => p.id),
                              !allActive,
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-[#E6E1D6] hover:border-[#C59B27] text-[11px] font-bold cursor-pointer"
                        >
                          Tout basculer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dom.modules.map((mod) => {
                      const modPerms = groupedPerms[mod] || [];
                      const enabledCount = isRootRole
                        ? modPerms.length
                        : modPerms.filter((p) => rolePermSet.has(p.id)).length;
                      const isRawOpen = Boolean(expandedRawModules[mod]);
                      const extraActions = modPerms.filter(
                        (p) =>
                          !READ_ACTIONS.includes(p.action) &&
                          !['create', 'update', 'delete', 'manage'].includes(p.action),
                      );

                      return (
                        <div key={mod} className="px-4 py-3 hover:bg-[#FBF9F4]/50 transition">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#1D232E]">
                                  {formatModuleLabel(mod)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-slate-200">
                                  {mod}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#9A7414]">
                                  {enabledCount}/{modPerms.length}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {renderQuickPill('Voir', modPerms, READ_ACTIONS)}
                              {renderQuickPill('Ajouter', modPerms, ['create'])}
                              {renderQuickPill('Modifier', modPerms, ['update'])}
                              {renderQuickPill('Supprimer', modPerms, ['delete'], 'danger')}
                              {renderQuickPill('Gestion complète', modPerms, ['manage'], 'amber')}
                              {extraActions.map((extra) =>
                                renderQuickPill(
                                  actionLabels[extra.action] || extra.action,
                                  modPerms,
                                  [extra.action],
                                ),
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRawModules((prev) => ({ ...prev, [mod]: !prev[mod] }))
                                }
                                className="px-2 py-1 rounded-lg border border-transparent hover:border-[#E6E1D6] text-[10px] font-semibold text-slate-400 hover:text-slate-700 inline-flex items-center gap-0.5 cursor-pointer"
                                title="Voir le détail technique des actions"
                              >
                                {isRawOpen ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                                <span>Détails</span>
                              </button>
                            </div>
                          </div>

                          {isRawOpen && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {modPerms.map((perm) => {
                                const checked = isRootRole || rolePermSet.has(perm.id);
                                return (
                                  <div
                                    key={perm.id}
                                    className="px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6]/70 flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-bold text-[#1D232E]">
                                        {actionLabels[perm.action] || perm.action}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400 truncate">
                                        {perm.code}
                                      </div>
                                    </div>
                                    <Toggle
                                      compact
                                      size="sm"
                                      disabled={isRootRole}
                                      checked={checked}
                                      onChange={() => onTogglePermission(perm.id)}
                                      ariaLabel={perm.code}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
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

      {/* TAB 2: DYNAMIC DASHBOARD VIEWS PER ROLE */}
      {studioTab === 'views' && (
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-[#1D232E] flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-[#C59B27]" />
                <span>Accès Dynamique aux Vues &amp; Sections du Dashboard</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Activez exactement les pages visibles dans le menu gauche et accessibles par URL pour{' '}
                <strong>{roleDisplayName}</strong>. Les pages marquées{' '}
                <span className="font-bold text-amber-800">PRIVÉ (ROOT)</span> doivent également être passées en{' '}
                <strong>PUBLIC</strong> dans <em>Visibilité des vues</em> pour les utilisateurs non-ROOT.
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
