// src/app/api/inspektoerer/upload-billede/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

const BUCKET = 'inspektoer-billeder';

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

    const supabase = getSupabaseServerClient();

    // Slet gamle versioner med andre extensions
    const andreExt = ['jpg', 'png', 'webp'].filter((e) => e !== gyldigExt);
    for (const e of andreExt) {
      await supabase.storage.from(BUCKET).remove([`${slug}.${e}`]);
    }

    // Upload til Supabase Storage
    const { error: uploadFejl } = await supabase.storage
      .from(BUCKET)
      .upload(filnavn, buffer, { contentType: billede.type, upsert: true });

    if (uploadFejl) {
      console.error('[upload-billede] storage fejl:', uploadFejl);
      return NextResponse.json({ fejl: 'Upload fejlede: ' + uploadFejl.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filnavn);
    const publicUrl = urlData.publicUrl;

    // Gem URL i DB så avatar-komponenten kan slå den op
    await supabase.from('inspektoer_billeder').upsert({ slug, billede_url: publicUrl });

    return NextResponse.json({ ok: true, sti: publicUrl });
  } catch (e) {
    console.error('[upload-billede]', e);
    return NextResponse.json({ fejl: 'Intern fejl' }, { status: 500 });
  }
}
