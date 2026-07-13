// Used only for React list keys, not for anything security-sensitive, so we
// don't need crypto.randomUUID() (which requires HTTPS - this app is served
// over plain HTTP on the NAS).
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
