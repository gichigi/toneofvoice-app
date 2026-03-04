// Meta Pixel event tracking helpers.
// The pixel base code is loaded in app/layout.tsx - this file just wraps
// window.fbq so callers get type safety and a safe no-op in SSR/test envs.

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
  }
}

function fbq(action: string, event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(action, event, params);
  }
}

export const MetaPixel = {
  /** Fired automatically by the base code on every page load. */
  pageView: () => fbq("track", "PageView"),

  /** Fire when a user completes account registration. */
  completeRegistration: () => fbq("track", "CompleteRegistration"),

  /** Fire when a new user account is created (MOF ad set optimisation). */
  lead: () => {
    console.log("[MetaPixel] Lead fired");
    fbq("track", "Lead");
  },

  /** Fire when a user clicks "Get Pro" / "Get Agency". */
  initiateCheckout: (plan: "pro" | "agency") =>
    fbq("track", "InitiateCheckout", { content_name: plan }),

  /** Fire on high-intent pages (e.g. billing/pricing). */
  viewContent: (contentName: string) => {
    console.log("[MetaPixel] ViewContent fired", { content_name: contentName });
    fbq("track", "ViewContent", { content_name: contentName });
  },

  /** Fire after Stripe redirects back with ?subscription=success. */
  purchase: (plan: "pro" | "agency") => {
    const value = plan === "pro" ? 12 : 49;
    // Purchase = generic conversion; Subscribe = Meta's specific event for paid subscriptions.
    // Fire both so Meta can optimise for either depending on campaign objective.
    fbq("track", "Purchase", { value, currency: "USD", content_name: plan });
    fbq("track", "Subscribe", { value, currency: "USD", predicted_ltv: value * 12 });
  },
};
