import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBusinessPlanAI } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      businessType,
      subType,
      experienceLevel,
      targetMarket,
      currentIncome,
      estimatedCapital,
      existingDebt,
      additionalContext,
      businessId: existingBusinessId
    } = body;

    if (!businessType || !estimatedCapital) {
      return NextResponse.json({ error: 'Business type and capital are required' }, { status: 400 });
    }

    // 1. Get or create Business record
    let businessId = existingBusinessId;
    if (!businessId) {
      const newBus = await prisma.business.create({
        data: {
          userId: user.id,
          type: businessType,
          description: subType ? `${businessType} - ${subType}` : businessType,
          estimatedCapital: parseFloat(estimatedCapital),
          targetMonthlyIncome: currentIncome ? parseFloat(currentIncome) * 1.5 : null,
        }
      });
      businessId = newBus.id;
    }

    // 2. Call Claude AI Business Plan generator service
    const planResult = await generateBusinessPlanAI({
      businessType,
      subType,
      experienceLevel: experienceLevel || 'Beginner',
      targetMarket: targetMarket || 'Local Village / District',
      currentIncome: currentIncome ? parseFloat(currentIncome) : 0,
      estimatedCapital: parseFloat(estimatedCapital),
      existingDebt: existingDebt ? parseFloat(existingDebt) : 0,
      state: user.state || 'Uttar Pradesh',
      district: user.district || 'Lucknow',
      additionalContext,
      language: user.language || 'en'
    });

    // 3. Save Advisory record in database
    const advisory = await prisma.advisory.create({
      data: {
        businessId,
        userId: user.id,
        type: 'business_plan',
        planJson: JSON.stringify(planResult),
        status: 'active'
      }
    });

    return NextResponse.json({
      plan_id: advisory.id,
      businessId,
      advisory,
      ...planResult
    });
  } catch (error: any) {
    console.error('Error generating business plan:', error);
    return NextResponse.json({ error: error.message || 'Error generating plan' }, { status: 500 });
  }
}
