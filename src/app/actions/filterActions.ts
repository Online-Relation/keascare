// src/app/actions/filterActions.ts
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { COOKIE_NAVN } from '@/lib/config/GlobalFilter';

export async function setVisFilter(filter: 'alle' | 'privat') {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAVN, filter, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 år
    httpOnly: false,
    sameSite: 'lax',
  });
  revalidatePath('/dashboard', 'layout');
}
