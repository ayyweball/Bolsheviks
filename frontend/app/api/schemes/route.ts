import { NextResponse } from 'next/server';
import { backendApiClient } from '@/lib/api-client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const primaryType = searchParams.get('primary_type') || searchParams.get('type') || undefined;
    const actionability = searchParams.get('actionability') || undefined;
    const ministry = searchParams.get('ministry') || undefined;
    const sector = searchParams.get('sector') || undefined;
    const status = searchParams.get('status') || 'active';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 60;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;

    try {
      const programs = await backendApiClient.getPrograms({
        status,
        primary_type: primaryType,
        actionability_type: actionability,
        ministry,
        sector,
        limit,
        skip,
      });

      // Map to backwards-compatible scheme structure for existing UI components
      const mappedSchemes = programs.map((p) => ({
        id: p.id,
        programCode: p.program_code,
        name: p.program_name,
        ministry: p.owning_ministry,
        nodalAgency: p.nodal_agency,
        description: p.description || p.benefit_summary,
        benefitSummary: p.benefit_summary,
        benefitType: p.benefit_type,
        primaryType: p.primary_type,
        actionabilityType: p.actionability_type,
        officialPortalUrl: p.official_portal_url,
        sectors: p.sectors,
        status: p.status,
        loanMin: 50000,
        loanMax: p.benefit_headline_numeric || 1000000,
        interestRate: 8.5,
        tenure: 60,
        state: 'All India',
      }));

      return NextResponse.json({
        programs,
        schemes: mappedSchemes,
        count: programs.length,
        source: 'FastAPI (PostgreSQL goi_schemes)',
      });
    } catch (backendError) {
      console.warn('FastAPI getPrograms unreachable, falling back to local prisma:', backendError);
    }

    // Fallback if backend is unreachable
    const schemes = await prisma.scheme.findMany({
      orderBy: { loanMax: 'desc' },
    });

    return NextResponse.json({
      programs: schemes,
      schemes,
      count: schemes.length,
      source: 'Prisma SQLite Fallback',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
