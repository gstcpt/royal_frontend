'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xl hover:bg-[var(--royal-primary-hover)] hover:scale-110 active:scale-95 transition-all duration-300 border border-white/25 group cursor-pointer"
    >
      <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
