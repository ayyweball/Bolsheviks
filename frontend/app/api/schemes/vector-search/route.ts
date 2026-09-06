import { NextResponse } from 'next/server';
import { findMatchingSchemes } from '@/lib/vector';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessType, estimatedCapital, state, district, category, isWoman } = body;

    const results = await findMatchingSchemes({
      businessType: businessType || 'agriculture',
      estimatedCapital: parseFloat(estimatedCapital || '500000'),
      state: state || 'Uttar Pradesh',
      district: district || 'Lucknow',
      category: category || 'General',
      isWoman: !!isWoman
    });

    return NextResponse.json({
      topMatches: results.slice(0, 10),
      totalMatches: results.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
