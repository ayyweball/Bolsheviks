import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { backendApiClient, FinancialStructuringRequest } from '@/lib/api-client';

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();

    // If unauthenticated, ensure a demo guest user exists for public evaluation
    if (!user) {
      user = await prisma.user.upsert({
        where: { phone: '9999999999' },
        update: {},
        create: {
          phone: '9999999999',
          name: 'Demo Entrepreneur',
          language: 'en',
          state: 'Uttar Pradesh',
          district: 'Lucknow',
        },
      });
    }

    const body = await req.json();
    const {
      businessId,
      monthlyIncome,
      monthlyExpenses,
      existingLoans,
      creditHistory,
      loanNeeded,
      purpose,
      preferredTenure,
      collateralAvailable,
      programId,
      programCode,
    } = body;

    if (!monthlyIncome || !loanNeeded) {
      return NextResponse.json({ error: 'Monthly income and loan amount are required' }, { status: 400 });
    }

    const amount = parseFloat(loanNeeded.toString());
    const income = parseFloat(monthlyIncome.toString());
    const expenses = parseFloat((monthlyExpenses || 0).toString());
    const existingLoansList = Array.isArray(existingLoans) ? existingLoans : [];
    const totalExistingEmi = existingLoansList.reduce(
      (acc: number, curr: any) => acc + (parseFloat(curr?.emi?.toString() || '0') || 0),
      0
    );

    let financialResult: any;

    try {
      // 1. Authoritative Call to FastAPI Backend Core
      const structReq: FinancialStructuringRequest = {
        program_id: programId ? parseInt(programId.toString()) : undefined,
        program_code: programCode || undefined,
        project_cost: amount * 1.15, // Standard baseline with margin
        requested_loan_amount: amount,
        monthly_income: income,
        monthly_expenses: expenses,
        existing_monthly_emi: totalExistingEmi,
        preferred_tenure_months: preferredTenure ? parseInt(preferredTenure.toString()) : 60,
        applicant_social_category: 'General',
        is_new_business: true,
      };

      const structResp = await backendApiClient.getFinancialStructuring(structReq);

      const conservativeScenario = structResp.loan_scenarios.find(s => s.scenario_type === 'CONSERVATIVE')
        || structResp.loan_scenarios[0];
      const balancedScenario = structResp.loan_scenarios.find(s => s.scenario_type === 'BALANCED' || s.is_recommended)
        || structResp.loan_scenarios[1]
        || structResp.loan_scenarios[0];
      const extendedScenario = structResp.loan_scenarios.find(s => s.scenario_type === 'EXTENDED')
        || structResp.loan_scenarios[2]
        || structResp.loan_scenarios[structResp.loan_scenarios.length - 1];

      financialResult = {
        debtToIncomeRatio: Number(structResp.debt_health.existing_dti_pct.toFixed(1)),
        affordableEMI: Math.round(structResp.debt_health.affordable_emi_cap),
        creditAssessment: `${structResp.debt_health.dti_health_category.replace(/_/g, ' ')} Risk`,
        structures: {
          conservative: {
            tenureMonths: conservativeScenario ? conservativeScenario.tenure_months : 48,
            interestRate: conservativeScenario?.annual_interest_rate_pct ?? 9.0,
            monthlyEMI: Math.round(conservativeScenario?.monthly_emi ?? 0),
            totalInterest: Math.round(conservativeScenario?.total_interest_payable ?? 0),
            feasibility: conservativeScenario?.is_affordable ? 'Highly Affordable' : 'Requires Surplus Adjustment',
          },
          balanced: {
            tenureMonths: balancedScenario ? balancedScenario.tenure_months : 60,
            interestRate: balancedScenario?.annual_interest_rate_pct ?? 9.0,
            monthlyEMI: Math.round(balancedScenario?.monthly_emi ?? 0),
            totalInterest: Math.round(balancedScenario?.total_interest_payable ?? 0),
            feasibility: balancedScenario?.is_affordable ? 'Recommended (Balanced Cashflow)' : 'Elevated DTI',
          },
          extended: {
            tenureMonths: extendedScenario ? extendedScenario.tenure_months : 72,
            interestRate: extendedScenario?.annual_interest_rate_pct ?? 9.0,
            monthlyEMI: Math.round(extendedScenario?.monthly_emi ?? 0),
            totalInterest: Math.round(extendedScenario?.total_interest_payable ?? 0),
            feasibility: extendedScenario?.is_affordable ? 'Lowest Monthly Outflow' : 'Extended Liability',
          },
        },
        preApprovalChecklist: structResp.statutory_checklist && structResp.statutory_checklist.length > 0
          ? structResp.statutory_checklist
          : [
              'Detailed Project Report (DPR)',
              'Udyam Registration Certificate',
              'Aadhaar Card & PAN Card Copy',
              'Last 6 Months Bank Statement',
              'Proof of Business Premises (Lease/Electricity Bill)',
            ],
        capitalBreakdown: structResp.capital_structure,
        statutoryConstraints: structResp.financial_constraints,
        warnings: structResp.warnings,
        disclaimer: structResp.disclaimer,
        programName: structResp.program_name,
        source: 'FastAPI Backend Core (Deterministic Financial Structuring)',
      };
    } catch (backendError) {
      console.warn('FastAPI financial structuring unreachable, using fallback math:', backendError);

      const netSurplus = income - expenses - totalExistingEmi;
      const dti = Math.min(100, Math.round((totalExistingEmi / (income || 1)) * 100));
      const calcEmi = (p: number, rYear: number, nMonths: number) => {
        const r = rYear / (12 * 100);
        return Math.round((p * r * Math.pow(1 + r, nMonths)) / (Math.pow(1 + r, nMonths) - 1));
      };

      const emi48 = calcEmi(amount, 9.5, 48);
      const emi60 = calcEmi(amount, 9.0, 60);
      const emi72 = calcEmi(amount, 9.5, 72);

      financialResult = {
        debtToIncomeRatio: dti,
        affordableEMI: Math.max(2000, Math.round(netSurplus * 0.5)),
        creditAssessment: dti < 35 ? 'Low Risk' : dti < 55 ? 'Moderate Risk' : 'High Risk',
        structures: {
          conservative: {
            tenureMonths: 48,
            interestRate: 9.5,
            monthlyEMI: emi48,
            totalInterest: emi48 * 48 - amount,
            feasibility: 'Highly Affordable',
          },
          balanced: {
            tenureMonths: 60,
            interestRate: 9.0,
            monthlyEMI: emi60,
            totalInterest: emi60 * 60 - amount,
            feasibility: 'Recommended (Balanced Structure)',
          },
          extended: {
            tenureMonths: 72,
            interestRate: 9.5,
            monthlyEMI: emi72,
            totalInterest: emi72 * 72 - amount,
            feasibility: 'Lowest Monthly Outflow',
          },
        },
        preApprovalChecklist: [
          'Aadhaar Card & PAN Card copy',
          'Bank Account Statement for last 6 months',
          'Proof of Business Location (Gram Panchayat letter / lease / electricity bill)',
          'Udyam Registration Certificate',
          'Project Cost Estimate / Quotation for equipment',
        ],
        source: 'Local Fallback Math',
      };
    }

    // Link or create business record in Prisma
    let busId = businessId;
    if (!busId) {
      const bus = await prisma.business.create({
        data: {
          userId: user.id,
          type: purpose || 'services',
          estimatedCapital: amount,
          targetMonthlyIncome: income,
        },
      });
      busId = bus.id;
    }

    // Save Advisory entity
    const advisory = await prisma.advisory.create({
      data: {
        businessId: busId,
        userId: user.id,
        type: 'financial',
        financialJson: JSON.stringify(financialResult),
        status: 'active',
      },
    });

    return NextResponse.json({
      advisoryId: advisory.id,
      businessId: busId,
      advisory,
      ...financialResult,
    });
  } catch (error: any) {
    console.error('Error in financial advisory handler:', error);
    return NextResponse.json({ error: error.message || 'Error generating financial advice' }, { status: 500 });
  }
}
