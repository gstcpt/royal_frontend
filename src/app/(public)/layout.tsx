import React from 'react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { CompareBar } from '@/components/storefront/CompareBar';
import { ScrollToTop } from '@/components/common/ScrollToTop';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--royal-bg)] text-[var(--royal-ink)] font-sans selection:bg-[var(--royal-primary)] selection:text-[var(--royal-primary-text)]">
      {/* Luxury Storefront Sticky Header */}
      <StorefrontHeader />

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Floating Compare Bar */}
      <CompareBar />

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />

      {/* Luxury Dark Obsidian Footer */}
      <StorefrontFooter />
    </div>
  );
}
