import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { backendApiClient, DPRRequest } from '@/lib/api-client';
import { resolvePrimaryBusiness } from '@/lib/business-resolver';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    let primaryBiz: any = null;
    if (user) {
      try {
        primaryBiz = await resolvePrimaryBusiness(user.id);
      } catch (err) {
        console.warn('Could not resolve primary business for DPR:', err);
      }
    }

    // 1. Resolve Location (Strictly from input or profile; ZERO silent Varanasi fallback)
    const resolvedDistrict = body.district_name || body.district || primaryBiz?.district || user?.district;
    const resolvedState = body.state_name || body.state || primaryBiz?.state || user?.state;

    if (!resolvedDistrict) {
      return NextResponse.json(
        { error: 'Target district is required. Please set your district in your business profile or request payload.' },
        { status: 400 }
      );
    }

    // 2. Resolve Business Identity (Strictly from input or profile; ZERO silent Handloom fallback)
    const resolvedBusinessType = body.business_type || primaryBiz?.type || primaryBiz?.activity || primaryBiz?.sector;
    if (!resolvedBusinessType) {
      return NextResponse.json(
        { error: 'Business type or trade title is required. Please specify business type in your profile or request payload.' },
        { status: 400 }
      );
    }

    // 3. Financial Inputs
    const rawCapital = body.estimated_capital ?? body.project_cost ?? body.investmentInPlant ?? primaryBiz?.projectCost ?? primaryBiz?.estimatedCapital;
    const resolvedCapital = Number(rawCapital);
    if (isNaN(resolvedCapital) || resolvedCapital <= 0) {
      return NextResponse.json(
        { error: 'Estimated capital or project cost must be a valid positive number.' },
        { status: 400 }
      );
    }

    const rawIncome = body.current_income ?? body.annual_turnover ?? primaryBiz?.annualTurnover ?? (primaryBiz?.monthlyIncome ? primaryBiz.monthlyIncome * 12 : undefined);
    const resolvedIncome = rawIncome != null && !isNaN(Number(rawIncome)) ? Number(rawIncome) : undefined;

    // 4. User Promoter Contribution (Preserve exact user entry; do NOT overwrite or fabricate)
    const rawUserPromoter = body.user_promoter_contribution ?? body.promoter_contribution ?? body.promoterContribution ?? primaryBiz?.promoterContribution;
    const userPromoterContrib = rawUserPromoter != null && rawUserPromoter !== '' && !isNaN(Number(rawUserPromoter))
      ? Number(rawUserPromoter)
      : undefined;

    // 5. Enterprise Lifecycle Attributes
    const resolvedSector = body.sector || primaryBiz?.sector || undefined;
    const resolvedActivity = body.activity || body.sub_type || primaryBiz?.activity || undefined;
    const resolvedStage = body.stage || primaryBiz?.stage || (primaryBiz?.isNewBusiness === false ? 'Expansion' : (primaryBiz?.isNewBusiness === true ? 'Greenfield / New Venture' : undefined));
    const promoterName = body.promoter_name || user?.name || 'Entrepreneur';
    const projectName = body.project_name || primaryBiz?.name || `${resolvedBusinessType} Enterprise`;

    const dprPayload: DPRRequest = {
      user_id: user?.id,
      business_id: body.business_id || body.businessId || primaryBiz?.id,
      project_name: projectName,
      promoter_name: promoterName,
      business_type: resolvedBusinessType,
      sub_type: body.sub_type || resolvedActivity,
      sector: resolvedSector,
      activity: resolvedActivity,
      stage: resolvedStage,
      user_promoter_contribution: userPromoterContrib,
      target_market: body.target_market,
      experience_level: body.experience_level,
      estimated_capital: resolvedCapital,
      current_income: resolvedIncome,
      existing_debt: body.existing_debt != null ? Number(body.existing_debt) : (primaryBiz?.existingDebt != null ? Number(primaryBiz.existingDebt) : undefined),
      district_name: resolvedDistrict,
      state_name: resolvedState,
      lg_dt_code: body.lg_dt_code,
      location_type: body.location_type || (primaryBiz?.isRural ?? body.is_rural ? 'RURAL' : 'URBAN'),
      category: body.category || body.social_category || user?.socialCategory || 'GENERAL',
      gender: body.gender || user?.gender || 'MALE',
      education_level: body.education_level || 'GRADUATE',
      is_differently_abled: body.is_differently_abled ?? user?.isDifferentlyAbled ?? false,
      is_ex_serviceman: body.is_ex_serviceman ?? user?.isExServiceman ?? false,
      selected_program_code: body.selected_program_code || body.programCode,
      qualitative_overrides: body.qualitative_overrides,
    };

    const dpr = await backendApiClient.generateDPR(dprPayload);

    // Persist to Advisory or Report store for seamless page reloads and report sharing
    try {
      if (body.advisoryId) {
        await prisma.advisory.update({
          where: { id: body.advisoryId },
          data: { planJson: JSON.stringify(dpr) },
        }).catch(() => null);
      }
      if (user && primaryBiz?.id) {
        await prisma.report.upsert({
          where: { id: dpr.report_id },
          create: {
            id: dpr.report_id,
            businessId: primaryBiz.id,
            userId: user.id,
            advisoryId: body.advisoryId || undefined,
            jsonData: JSON.stringify(dpr),
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
          update: {
            jsonData: JSON.stringify(dpr),
          },
        }).catch(() => null);
      }
    } catch (saveErr) {
      console.warn('Could not persist DPR to database:', saveErr);
    }

    return NextResponse.json(dpr);
  } catch (error: any) {
    console.error('Error generating structured DPR in /api/advisory/dpr:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate structured Detailed Project Report' },
      { status: 500 }
    );
  }
}
