'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Cloudflare Turnstile challenge.
 *
 * Renders only when the operator has enabled Turnstile in the admin panel
 * AND a site key is configured — `/api/settings` returns `turnstileSiteKey`
 * as null otherwise, and the parent skips this component entirely.
 *
 * The token is single-use and expires, so `onToken` is also called with
 * null on expiry to keep the submit button honest.
 */

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
}

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      theme?: 'light' | 'dark' | 'auto';
      appearance?: 'always' | 'execute' | 'interaction-only';
    },
  ) => string;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve) => existing.addEventListener('load', () => resolve(), { once: true }));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Kept in a ref so re-renders of the parent do not re-mount the widget,
  // which would discard an already-solved challenge. Assigned in an effect
  // rather than during render, since refs must not be written while rendering.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const mount = useCallback(async () => {
    try {
      await loadScript();
    } catch {
      // Fail open in the UI: the server still rejects a missing token when
      // Turnstile is enabled, so this cannot be used to bypass the check.
      console.error('[turnstile] could not load the challenge script');
      return;
    }

    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'light',
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onTokenRef.current(null),
      'error-callback': () => onTokenRef.current(null),
    });
  }, [siteKey]);

  useEffect(() => {
    void mount();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [mount]);

  return <div ref={containerRef} className="flex justify-center my-4" aria-label="Security verification" />;
}
