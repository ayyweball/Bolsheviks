import { backendApiClient, RecommendationRequest, ProgramRecommendationItem } from './api-client';
import { prisma } from './prisma';

export interface SchemeSearchInput {
  businessType: string;
  estimatedCapital: number;
  state?: string;
  district?: string;
  category?: string;
  isWoman?: boolean;
}

export interface SchemeMatchResult {
  scheme: any;
  rank?: number;
  eligibilityScore: number;
  recommendationScore: number;
  approvalProbability: number;
  fitCategory: string;
  eligibilityStatus: string;
  scoringBreakdown?: any;
  recommendationDrivers: string[];
  cautionaryNotes: string[];
  recommendedAmount: number;
  hyperLocalInsight: string;
}

/**
 * Replaces heuristic scoring with the authoritative FastAPI Recommendation Engine (100-pt scoring system).
 * Fallback to local database only if FastAPI core is unreachable.
 */
export async function findMatchingSchemes(input: SchemeSearchInput): Promise<SchemeMatchResult[]> {
  try {
    const recReq: RecommendationRequest = {
      profile: {
        sector: input.businessType,
        state: input.state || 'Uttar Pradesh',
        district: input.district || 'Lucknow',
        social_category: input.category || 'General',
        gender: input.isWoman ? 'Female' : 'Male',
        investment_in_plant: input.estimatedCapital,
        annual_turnover: input.estimatedCapital * 1.5,
        is_new_business: true,
      },
      target_financing_need: input.estimatedCapital,
      top_k: 12,
    };

    const response = await backendApiClient.getRecommendations(recReq);

    if (response?.recommendations && response.recommendations.length > 0) {
      return response.recommendations.map((item: ProgramRecommendationItem) => {
        const score = item.recommendation_score;
        return {
          scheme: {
            id: item.program_id,
            code: item.program_code,
            name: item.program_name,
            ministry: item.primary_type,
            description: item.benefit_summary || `Government assistance programme under ${item.program_name}.`,
            loanMin: 50000,
            loanMax: 1000000,
            interestRate: 8.5,
            tenure: 60,
            state: input.state || 'All India',
            officialPortalUrl: item.official_portal_url,
            actionabilityType: item.actionability_type,
            eligibility: {
              keyPoints: item.recommendation_drivers.length > 0 
                ? item.recommendation_drivers 
                : [`Verified ${item.eligibility_status} status`, `Scored ${item.fit_category.replace('_', ' ')}`],
            },
          },
          rank: item.rank,
          eligibilityScore: Number((score / 100).toFixed(2)),
          recommendationScore: score,
          approvalProbability: Math.round(score),
          fitCategory: item.fit_category,
          eligibilityStatus: item.eligibility_status,
          scoringBreakdown: item.scoring_breakdown,
          recommendationDrivers: item.recommendation_drivers,
          cautionaryNotes: item.cautionary_notes,
          recommendedAmount: input.estimatedCapital,
          hyperLocalInsight: item.cautionary_notes.length > 0
            ? item.cautionary_notes.join(' • ')
            : `Authoritative recommendation for ${input.district || 'target district'}, ${input.state || 'State'} (Rank #${item.rank}, ${item.fit_category.replace('_', ' ')}).`,
        };
      });
    }
  } catch (error) {
    console.warn('FastAPI recommendation service unavailable, evaluating fallback schemes:', error);
  }

  // Graceful fallback to local seed schemes if backend is offline
  const schemes = await prisma.scheme.findMany({
    where: {
      OR: [
        { state: 'all' },
        { state: input.state || 'all' },
      ],
    },
  });

  return schemes.map((scheme) => {
    let score = 0.5;
    if (input.estimatedCapital >= scheme.loanMin && input.estimatedCapital <= scheme.loanMax) score += 0.3;
    const finalScore = Math.min(0.98, Math.max(0.60, Number(score.toFixed(2))));
    const recAmount = Math.min(scheme.loanMax, Math.max(scheme.loanMin, input.estimatedCapital));

    return {
      scheme,
      eligibilityScore: finalScore,
      recommendationScore: Math.round(finalScore * 100),
      approvalProbability: Math.round(finalScore * 100),
      fitCategory: finalScore > 0.8 ? 'STRONG_FIT' : 'MODERATE_FIT',
      eligibilityStatus: 'Eligible',
      recommendationDrivers: ['Statutory loan range alignment'],
      cautionaryNotes: [],
      recommendedAmount: recAmount,
      hyperLocalInsight: `Local DIC & bank branch coverage available in ${input.district || 'district'}.`,
    };
  });
}
