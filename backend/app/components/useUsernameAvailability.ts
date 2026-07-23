'use client';

/**
 * Debounced, stale-response-safe username availability hook
 * (EWP-011). Owns both the debounce timer and the request-generation
 * lifecycle, so a blur-triggered immediate check and a pending
 * debounced check can never both fire for the same username value.
 *
 * - Username change: cancels any pending debounce timer (via the
 *   effect cleanup below) and schedules exactly one new ~450ms
 *   debounced check. Invalid local input skips the RPC entirely and
 *   resets to 'idle'.
 * - checkNow() (wired to onBlur): cancels any pending debounce timer
 *   first, then runs the check immediately -- so if the debounce
 *   timer was still pending, it can never also fire afterward.
 * - Every username change bumps the generation counter immediately
 *   (synchronously, before any debounce delay), so a result from an
 *   in-flight request for a previous value is discarded even if it
 *   resolves after the input has already changed again.
 * - Unmount is guarded separately (mountedRef) so a late-resolving
 *   request can never call setState on an unmounted component.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { checkUsernameAvailability, isValidUsernameShape, type UsernameAvailability } from '../services/auth/auth-service';
import { getSupabaseBrowserClient } from '../config/supabase-browser';

export type UsernameAvailabilityState = 'idle' | 'checking' | 'available' | 'taken';

const DEBOUNCE_MS = 450;

export function useUsernameAvailability(username: string): {
  availability: UsernameAvailabilityState;
  checkNow: () => void;
} {
  const [availability, setAvailability] = useState<UsernameAvailabilityState>('idle');
  const generationRef = useRef(0);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runCheck = useCallback(async (candidateUsername: string) => {
    const myGeneration = ++generationRef.current;
    setAvailability('checking');

    // Any synchronous throw (e.g. client initialization) or rejected
    // promise (network/RPC failure) must resolve to 'unknown' rather
    // than leaving availability stuck at 'checking' forever -- an
    // advisory-check failure is never treated as taken or available.
    let result: UsernameAvailability;
    try {
      result = await checkUsernameAvailability(getSupabaseBrowserClient(), candidateUsername);
    } catch {
      result = 'unknown';
    }

    if (!mountedRef.current) return; // unmounted -- never update state
    if (generationRef.current !== myGeneration) return; // superseded by a newer check

    setAvailability(result === 'unknown' ? 'idle' : result);
  }, []);

  useEffect(() => {
    // Immediately invalidate any in-flight result belonging to the
    // previous value, even before this effect's own debounce timer
    // (if any) fires.
    generationRef.current++;

    if (!isValidUsernameShape(username)) {
      pendingTimeoutRef.current = undefined;
      setAvailability('idle');
      return;
    }

    setAvailability('idle');
    const timeoutId = setTimeout(() => {
      pendingTimeoutRef.current = undefined;
      runCheck(username);
    }, DEBOUNCE_MS);
    pendingTimeoutRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
      pendingTimeoutRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const checkNow = useCallback(() => {
    if (pendingTimeoutRef.current !== undefined) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = undefined;
    }

    if (isValidUsernameShape(username)) {
      runCheck(username);
    } else {
      generationRef.current++;
      setAvailability('idle');
    }
  }, [username, runCheck]);

  return { availability, checkNow };
}
