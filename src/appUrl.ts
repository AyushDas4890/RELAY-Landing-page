// The Relay app lives in its own project; every "Log in" / "Get started" button leaves this site for it.
export const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'https://slack-reverse.vercel.app';
export const openApp = () => { window.location.assign(APP_URL); };
