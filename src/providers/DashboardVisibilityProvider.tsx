'use client';

import React, { createContext, useContext } from 'react';

export interface DashboardVisibilityContextValue {
  visibilityMap: Record<string, 'PUBLIC' | 'PRIVATE'>;
  isRoot: boolean;
  isRouteVisible: (href?: string | null) => boolean;
}

const ROUTE_ALIASES: Record<string, string> = {
  '/dashboard/root/payment-gateways': '/dashboard/payment-methods',
  '/dashboard/root/printers': '/dashboard/root/print-templates',
};

/**
 * Resolves whether a route link or quick action should be visible for the current user
 * based on `sys.visibility` (`PUBLIC` vs `PRIVATE`) and ROOT privilege.
 */
export function resolveRouteVisibility(
  href: string | undefined | null,
  visibilityMap: Record<string, 'PUBLIC' | 'PRIVATE'>,
  isRoot: boolean
): boolean {
  if (!href || isRoot) return true;
  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return true;
  }

  const cleanPath = trimmed.split('?')[0].split('#')[0];
  if (!cleanPath.startsWith('/dashboard') && !cleanPath.startsWith('/account')) {
    return true;
  }

  const normalized = ROUTE_ALIASES[cleanPath] || cleanPath;
  if (
    normalized.startsWith('/dashboard/root/visibility') ||
    normalized.startsWith('/dashboard/section')
  ) {
    return false;
  }

  if (normalized in visibilityMap) {
    return visibilityMap[normalized] !== 'PRIVATE';
  }

  const matchedParent = Object.keys(visibilityMap)
    .filter((k) => normalized.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];

  return matchedParent ? visibilityMap[matchedParent] !== 'PRIVATE' : true;
}

const DashboardVisibilityContext = createContext<DashboardVisibilityContextValue | null>(null);

export function DashboardVisibilityProvider({
  value,
  children,
}: {
  value: DashboardVisibilityContextValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardVisibilityContext.Provider value={value}>
      {children}
    </DashboardVisibilityContext.Provider>
  );
}

export function useOptionalRouteVisibility(): DashboardVisibilityContextValue | null {
  return useContext(DashboardVisibilityContext);
}

export function useRouteVisibility(): DashboardVisibilityContextValue {
  const ctx = useContext(DashboardVisibilityContext);
  if (ctx) return ctx;
  return {
    visibilityMap: {},
    isRoot: false,
    isRouteVisible: () => true,
  };
}
