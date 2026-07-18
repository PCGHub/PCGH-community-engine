/**
 * Standard response envelope, per docs/api-specification.md Section 7.
 * Every endpoint returns exactly one of these two shapes -- no route
 * handler constructs a response body directly; all responses go
 * through apiSuccess()/apiError() so the envelope can never drift
 * per-endpoint.
 */

import { NextResponse } from 'next/server';

export interface ApiPagination {
  readonly limit: number;
  readonly offset: number;
  readonly total: number;
}

export interface ApiSuccessInit {
  readonly status?: number;
  readonly pagination?: ApiPagination;
}

export function apiSuccess<T>(data: T, init?: ApiSuccessInit): NextResponse {
  const status = init?.status ?? 200;
  const body = init?.pagination ? { data, pagination: init.pagination } : { data };
  return NextResponse.json(body, { status });
}

export function apiError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}
