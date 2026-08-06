// src/app/actions/filterActions.ts
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { COOKIE_NAVN, COOKIE_LOS, COOKIE_PARAGRAF43 } from '@/lib/config/GlobalFilter';

const COOKIE_OPTS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  httpOnly: false,
  sameSite: 'lax' as const,
};

export async function setVisFilter(filter: 'alle' | 'privat') {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAVN, filter, COOKIE_OPTS);
  revalidatePath('/dashboard', 'layout');
}

export async function setLosFilter(filter: 'ekskluder' | 'inkluder') {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_LOS, filter, COOKIE_OPTS);
  revalidatePath('/dashboard', 'layout');
}

export async function setParagraf43Filter(filter: 'alle' | 'inkluder_43') {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_PARAGRAF43, filter, COOKIE_OPTS);
  revalidatePath('/dashboard', 'layout');
}
