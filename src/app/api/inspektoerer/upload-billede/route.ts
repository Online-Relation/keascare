// src/app/api/inspektoerer/upload-billede/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const slug    = form.get('slug');
    const billede = form.get('billede');

    if (typeof slug !== 'string' || !slug) {
      return NextResponse.json({ fejl: 'Mangler slug' }, { status: 400 });
    }
    if (!(billede instanceof File)) {
      return NextResponse.json({ fejl: 'Mangler billede' }, { status: 400 });
    }

    const ext = billede.name.split('.').at(-1)?.toLowerCase();
    const gyldigExt = ext === 'jpeg' ? 'jpg' : ext;
    if (!['jpg', 'png', 'webp'].includes(gyldigExt ?? '')) {
      return NextResponse.json({ fejl: 'Ugyldig filtype. Brug jpg, png eller webp.' }, { status: 400 });
    }

    const bytes  = await billede.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filnavn = `${slug}.${gyldigExt}`;
    const sti = join(process.cwd(), 'public', 'images', 'inspektoerer', filnavn);

    await writeFile(sti, buffer);
    // Slet gamle versioner med andre extensions
    const andreExt = ['jpg', 'png', 'webp'].filter((e) => e !== gyldigExt);
    for (const e of andreExt) {
      const { unlink } = await import('fs/promises');
      await unlink(join(process.cwd(), 'public', 'images', 'inspektoerer', `${slug}.${e}`)).catch(() => {});
    }

    return NextResponse.json({ ok: true, sti: `/images/inspektoerer/${filnavn}` });
  } catch (e) {
    console.error('[upload-billede]', e);
    return NextResponse.json({ fejl: 'Intern fejl' }, { status: 500 });
  }
}
