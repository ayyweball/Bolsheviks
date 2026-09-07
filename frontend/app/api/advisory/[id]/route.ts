import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    const advisory = await prisma.advisory.findUnique({
      where: { id: params.id },
      include: {
        business: true,
        schemeMatches: true,
        reports: true,
      },
    });

    if (!advisory) {
      const report = await prisma.report.findUnique({
        where: { id: params.id },
      });
      if (report) {
        const parsedPlan = typeof report.jsonData === 'string' ? JSON.parse(report.jsonData) : report.jsonData;
        return NextResponse.json({
          advisory: {
            id: report.id,
            planJson: parsedPlan,
            businessId: report.businessId,
            userId: report.userId,
            status: 'active',
          }
        });
      }
      return NextResponse.json({ error: 'Advisory not found' }, { status: 404 });
    }

    // Allow owner or public demo records
    if (user && advisory.userId !== user.id && advisory.userId !== 'demo-user') {
      // If signed in under different user, allow read-only advisory access if matching
    }

    const parsedPlan = typeof advisory.planJson === 'string' ? JSON.parse(advisory.planJson) : advisory.planJson;
    const parsedFinancial = typeof advisory.financialJson === 'string' ? JSON.parse(advisory.financialJson) : advisory.financialJson;

    return NextResponse.json({
      advisory: {
        ...advisory,
        planJson: parsedPlan,
        financialJson: parsedFinancial,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.planJson !== undefined) {
      updateData.planJson = typeof body.planJson === 'string' ? body.planJson : JSON.stringify(body.planJson);
    }
    if (body.financialJson !== undefined) {
      updateData.financialJson = typeof body.financialJson === 'string' ? body.financialJson : JSON.stringify(body.financialJson);
    }
    const updated = await prisma.advisory.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({ success: true, advisory: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.advisory.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
