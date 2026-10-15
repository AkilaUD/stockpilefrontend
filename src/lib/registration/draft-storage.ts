/**
 * The resumable-registration draft handle, kept in the browser (business-flows
 * §2/§3, api.md §2.1). The SERVER owns the draft and its prefill; the browser
 * keeps only the opaque token that addresses it, one per flow.
 *
 * localStorage, not sessionStorage: a draft exists precisely so a half-filled
 * signup survives closing the tab — and the browser. The token is not a
 * credential: it grants nothing but the prefill this visitor already typed, and
 * it is dropped the moment the registration completes or the server reports the
 * draft dead.
 *
 * Plain module (no hooks, no "use client"): client components call it, and every
 * access no-ops safely when storage is unavailable (server render, private
 * mode, storage disabled by policy).
 */

export type RegistrationDraftKind = "buyer" | "supplier";

export interface StoredDraftHandle {
  draftToken: string;
  expiresAt: string;
}

const KEY_PREFIX = "stockpile.registration-draft.v1";

const keyFor = (kind: RegistrationDraftKind): string => `${KEY_PREFIX}.${kind}`;

/** The handle for this flow, or null when there is none (or it is unreadable). */
export function readDraftHandle(kind: RegistrationDraftKind): StoredDraftHandle | null {
  try {
    const raw = window.localStorage.getItem(keyFor(kind));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredDraftHandle>;
    if (typeof parsed.draftToken !== "string" || parsed.draftToken.length === 0) return null;

    return {
      draftToken: parsed.draftToken,
      expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : "",
    };
  } catch {
    return null; // storage blocked, or a value written by an older shape
  }
}

/** Records (or refreshes) the handle after a successful save or resume. */
export function writeDraftHandle(kind: RegistrationDraftKind, handle: StoredDraftHandle): void {
  try {
    window.localStorage.setItem(keyFor(kind), JSON.stringify(handle));
  } catch {
    /* best-effort: a form that cannot persist still submits */
  }
}

/** Forgets the handle — the registration completed, or the draft is dead. */
export function clearDraftHandle(kind: RegistrationDraftKind): void {
  try {
    window.localStorage.removeItem(keyFor(kind));
  } catch {
    /* best-effort */
  }
}
