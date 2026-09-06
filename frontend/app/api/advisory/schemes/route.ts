import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { findMatchingSchemes } from '@/lib/vector';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    const body = await req.json().catch(() => ({}));
    const {
      businessType = 'agriculture',
      estimatedCapital = 500000,
      state = user?.state || 'Uttar Pradesh',
      district = user?.district || 'Lucknow',
      category = 'General',
      isWoman = false,
    } = body;

    const matches = await findMatchingSchemes({
      businessType,
      estimatedCapital: parseFloat(estimatedCapital.toString()),
      state,
      district,
      category,
      isWoman
    });

    return NextResponse.json({
      schemes: matches,
      totalMatches: matches.length,
      userLocation: { state, district }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error matching schemes' }, { status: 500 });
  }
}
