"use client";

import React, { useEffect, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  GTM_CONTAINER_ID,
  GA_MEASUREMENT_ID,
  isGtmEnabled,
  isGaEnabled,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics";

function AnalyticsPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAnalyticsEnabled || !pathname) return;
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (!isAnalyticsEnabled) {
    return null;
  }

  return (
    <>
      <Script id="google-analytics-bootstrap" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          ${
            isGaEnabled
              ? `gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`
              : ""
          }
          ${
            isGtmEnabled
              ? `window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });`
              : ""
          }
        `}
      </Script>

      {isGaEnabled && (
        <Script
          id="google-analytics-script"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      )}

      {isGtmEnabled && (
        <>
          <Script
            id="google-tag-manager-script"
            src={`https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`}
            strategy="afterInteractive"
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

      <Suspense fallback={null}>
        <AnalyticsPageTracker />
      </Suspense>
    </>
  );
}
