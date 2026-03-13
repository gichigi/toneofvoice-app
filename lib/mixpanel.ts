/**
 * Thin wrapper around mixpanel-browser for safe client-side event tracking.
 * Import this instead of mixpanel-browser directly so tracking never breaks the app.
 */

type Properties = Record<string, string | number | boolean | null | undefined>

function getClient() {
  if (typeof window === "undefined") return null
  if (process.env.NODE_ENV === "development") return null
  // mixpanel-browser attaches itself to window after init
  return (window as any).mixpanel ?? null
}

export function track(event: string, properties?: Properties) {
  try {
    getClient()?.track(event, properties)
  } catch {
    // Never let analytics break the app
  }
}

export function identify(userId: string, properties?: Properties) {
  try {
    const mp = getClient()
    mp?.identify(userId)
    if (properties) mp?.people.set(properties)
  } catch {}
}
