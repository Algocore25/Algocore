"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CopyPasteGuard() {
  const pathname = usePathname() || '';

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // determine whether current route is one that should allow admin-only features
    const requiresAdmin = /^\/(admin(|monitor|results)|testedit|exammonitor|adminresults|compiler)(\/|$)/i.test(pathname);
    if (requiresAdmin || isLocalhost) {
      return;
    }

    const prevent = (event) => event.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('selectstart', prevent);
    document.addEventListener('dragstart', prevent);

    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('dragstart', prevent);
    };
  }, [pathname]);

  return null;
}
