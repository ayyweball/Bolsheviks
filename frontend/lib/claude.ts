import Anthropic from '@anthropic-ai/sdk';

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new Anthropic({
    apiKey: apiKey.trim(),
    defaultHeaders: {
      'anthropic-beta': 'prompt-caching-2024-07-31'
    }
  });
}

// System Prompt
const BASE_SYSTEM_PROMPT = `You are an expert hyper-local business advisor specializing in rural micro-entrepreneurship in India and Ministry of Social Justice and Empowerment (MoSJE) concessional loan schemes.
You have deep expertise in:
- MoSJE schemes (NBCFDC, NSFDC, NSKFDC Micro Finance & Term Loans): 10% Beneficiary Margin Money Contribution vs 90% State Channelizing Agency (SCA) Concessional Loan
- Indian government schemes (MUDRA Shishu/Kishor/Tarun, PM SVANidhi, PMEGP, Stand-Up India, NABARD, State schemes)
- Rural market dynamics, local supply chains, seasonal agricultural trends, livestock management, and small retail operations
- Micro-finance, EMI structuring, debt-to-income analysis, credit risk, and bank pre-approval requirements
- State-specific regulations, FSSAI, Udyam Registration, Trade Licenses, DIC procedures

IMPORTANT: Always deliver realistic, quantitative, highly actionable guidance customized for the user's specific state, district, and business domain.
Return output in strictly valid JSON without markdown wrapping.`;

export interface BusinessPlanInput {
  businessType: string;
  subType?: string;
  experienceLevel: string;
  targetMarket: string;
  currentIncome: number;
  estimatedCapital: number;
  existingDebt?: number;
  state: string;
  district: string;
  additionalContext?: string;
  language?: string;
}

export interface FinancialInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingLoans: { name: string; emi: number }[];
  creditHistory: string;
  loanNeeded: number;
  purpose: string;
  preferredTenure: number;
  collateralAvailable: string[];
  state: string;
  district: string;
}

// 1. Business Plan Generator Service
export async function generateBusinessPlanAI(input: BusinessPlanInput) {
  const anthropic = getAnthropicClient();
  if (anthropic) {
    try {
      console.log('🤖 Invoking Claude 3.5 Sonnet for Business Plan Generation...');
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.3,
        system: BASE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate a complete rural business plan advisory for:
Business Type: ${input.businessType} (${input.subType || 'General'})
Experience Level: ${input.experienceLevel}
Target Market: ${input.targetMarket}
Current Monthly Income: ₹${input.currentIncome}
Required Initial Capital: ₹${input.estimatedCapital}
Existing Debt: ₹${input.existingDebt || 0}
Location: ${input.district}, ${input.state}
Context: ${input.additionalContext || 'None'}
Language: ${input.language || 'en'}

Respond ONLY with JSON matching this structure:
{
  "feasibilityScore": number (0-100),
  "executiveSummary": "string",
  "marketAnalysis": {
    "demand": "Strong" | "Moderate" | "Growing",
    "competition": "Low" | "Medium" | "High",
    "growthPotential": "string",
    "targetCustomers": "string"
  },
  "financialProjections": {
    "breakEvenMonth": number,
    "month6": { "revenue": number, "expenses": number, "netProfit": number },
    "month12": { "revenue": number, "expenses": number, "netProfit": number }
  },
  "actionTimeline": [
    { "month": 1, "title": "string", "description": "string", "completed": boolean }
  ],
  "requiredPermits": ["string"],
  "risks": [
    { "risk": "string", "impact": "High" | "Medium" | "Low", "mitigation": "string" }
  ],
  "relevantSchemesPreview": ["string"]
}`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(text);
    } catch (err) {
      console.error('⚠️ Claude API call error, falling back to mock generator:', err);
    }
  }

  // Fallback intelligent mock generator
  const isAgri = input.businessType.toLowerCase().includes('agri') || input.businessType.toLowerCase().includes('farm') || input.businessType.toLowerCase().includes('dairy');
  const cap = input.estimatedCapital || 500000;
  const feasibility = Math.min(95, Math.max(65, Math.floor(75 + (input.currentIncome > 0 ? 10 : 0) - (input.existingDebt || 0) / 50000)));

  return {
    feasibilityScore: feasibility,
    executiveSummary: `Solid feasibility for ${input.businessType} micro-enterprise in ${input.district}, ${input.state}. High demand driven by regional market dynamics and favorable government scheme coverage (MoSJE / MUDRA / PMEGP).`,
    marketAnalysis: {
      demand: isAgri ? "Strong" : "Growing",
      competition: "Moderate",
      growthPotential: `High potential in rural ${input.district} area due to direct producer-to-consumer demand and state subsidies.`,
      targetCustomers: isAgri ? "Local dairy co-operatives, village traders, and regional Mandi buyers" : "Hyper-local households, small businesses, and nearby weekly markets (Haat)."
    },
    financialProjections: {
      breakEvenMonth: Math.round(cap / 60000),
      month6: {
        revenue: Math.round(cap * 0.22),
        expenses: Math.round(cap * 0.14),
        netProfit: Math.round(cap * 0.08)
      },
      month12: {
        revenue: Math.round(cap * 0.38),
        expenses: Math.round(cap * 0.22),
        netProfit: Math.round(cap * 0.16)
      }
    },
    actionTimeline: [
      { month: 1, title: "Registration & Site Setup", description: "Complete Udyam registration and secure site/lease.", completed: true },
      { month: 2, title: "Equipment Purchase & Loan Sanction", description: `Apply for MoSJE / MUDRA / PMEGP loan of ₹${cap} at local bank branch.`, completed: false },
      { month: 3, title: "Operational Trial Run", description: "Procure raw materials, inventory, or livestock and begin trial operations.", completed: false },
      { month: 4, title: "Local Commercial Launch", description: "Establish sales agreements with local traders and retail outlets.", completed: false },
      { month: 5, title: "Optimization & Quality Control", description: "Streamline daily operational costs and maintain cash reserve.", completed: false },
      { month: 6, title: "Target Income Milestone", description: "Achieve stable monthly net profit target.", completed: false }
    ],
    requiredPermits: [
      "Udyam Micro Registration (Free Online)",
      "Local Gram Panchayat / DIC Trade License",
      isAgri ? "FSSAI Basic Food License" : "Basic Shop & Establishment License",
      "PAN & Bank Current Account"
    ],
    risks: [
      { risk: "Seasonal cash flow fluctuations", impact: "Medium", mitigation: "Maintain 2 months operating expense reserve in bank account." },
      { risk: "Raw material cost surge", impact: "Medium", mitigation: "Form cooperative buying ties with regional suppliers in " + input.district + "." },
      { risk: "Loan repayment delay", impact: "High", mitigation: "Select 60-month balanced EMI structure under MoSJE/MUDRA scheme." }
    ],
    relevantSchemesPreview: [
      "MoSJE Micro Finance Scheme (10% Margin Money : 90% SCA Loan)",
      "Pradhan Mantri MUDRA Yojana (Kishor / Tarun)",
      "PMEGP 35% Margin Money Subsidy",
      "UP Mukhya Mantri Yuva Swarozgar Yojana"
    ]
  };
}

// 2. Financial Advisor Service
export async function generateFinancialAdviceAI(input: FinancialInput) {
  const anthropic = getAnthropicClient();
  const existingEmiTotal = input.existingLoans?.reduce((acc, curr) => acc + curr.emi, 0) || 0;
  const netAvailableIncome = input.monthlyIncome - input.monthlyExpenses - existingEmiTotal;
  const dti = Math.min(100, Math.round(((existingEmiTotal) / (input.monthlyIncome || 1)) * 100));
  const maxAffordableEMI = Math.max(2000, Math.round(netAvailableIncome * 0.5));
  const amount = input.loanNeeded || 300000;

  if (anthropic) {
    try {
      console.log('🤖 Invoking Claude 3.5 Sonnet for Financial Advisory...');
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.2,
        system: BASE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze micro-finance loan structuring for:
Monthly Income: ₹${input.monthlyIncome}
Monthly Expenses: ₹${input.monthlyExpenses}
Existing EMIs: ₹${existingEmiTotal}
Required Loan: ₹${amount}
Purpose: ${input.purpose}
Credit History: ${input.creditHistory}
Location: ${input.district}, ${input.state}

Respond ONLY with valid JSON structure:
{
  "debtToIncomeRatio": number,
  "affordableEMI": number,
  "creditAssessment": "Low Risk" | "Moderate Risk" | "High Risk",
  "structures": {
    "conservative": { "tenureMonths": 48, "interestRate": number, "monthlyEMI": number, "totalInterest": number, "feasibility": "string" },
    "balanced": { "tenureMonths": 60, "interestRate": number, "monthlyEMI": number, "totalInterest": number, "feasibility": "string" },
    "extended": { "tenureMonths": 72, "interestRate": number, "monthlyEMI": number, "totalInterest": number, "feasibility": "string" }
  },
  "preApprovalChecklist": ["string"],
  "nextSteps": ["string"]
}`
          }
        ]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(text);
    } catch (e) {
      console.error('⚠️ Claude financial API error, using mock fallback:', e);
    }
  }

  // Exact interest & EMI calculation fallback
  const calcEmi = (p: number, rYear: number, nMonths: number) => {
    const r = rYear / (12 * 100);
    const emi = (p * r * Math.pow(1 + r, nMonths)) / (Math.pow(1 + r, nMonths) - 1);
    return Math.round(emi);
  };

  const emi48 = calcEmi(amount, 9.5, 48);
  const emi60 = calcEmi(amount, 9.0, 60);
  const emi72 = calcEmi(amount, 9.5, 72);

  return {
    debtToIncomeRatio: dti,
    affordableEMI: maxAffordableEMI,
    creditAssessment: dti < 35 ? "Low Risk" : dti < 55 ? "Moderate Risk" : "High Risk",
    structures: {
      conservative: {
        tenureMonths: 48,
        interestRate: 9.5,
        monthlyEMI: emi48,
        totalInterest: (emi48 * 48) - amount,
        feasibility: emi48 <= maxAffordableEMI ? "Highly Affordable" : "Requires income boost"
      },
      balanced: {
        tenureMonths: 60,
        interestRate: 9.0,
        monthlyEMI: emi60,
        totalInterest: (emi60 * 60) - amount,
        feasibility: "Recommended (Lowest Interest Rate)"
      },
      extended: {
        tenureMonths: 72,
        interestRate: 9.5,
        monthlyEMI: emi72,
        totalInterest: (emi72 * 72) - amount,
        feasibility: "Lowest Monthly Outflow"
      }
    },
    preApprovalChecklist: [
      "Aadhaar Card & PAN Card copy",
      "Bank Account Statement for last 6 months",
      "Proof of Business Location (Gram Panchayat letter / lease / electricity bill)",
      "Udyam Registration Certificate",
      "Project Cost Estimate / Quotation for equipment"
    ],
    nextSteps: [
      `Visit local bank branch in ${input.district} with completed pre-approval checklist.`,
      `Request MoSJE / MUDRA Kishor / Tarun scheme application form for ₹${amount.toLocaleString('en-IN')}.`,
      "Submit project report and financial projections generated by UnnatE."
    ]
  };
}

// 3. AI Chat Assistant Service
export async function getAdvisorChatResponse(messages: { role: string; content: string }[], userContext: any) {
  const anthropic = getAnthropicClient();
  if (anthropic) {
    try {
      console.log('🤖 Invoking Claude Haiku for AI Chat Advisor...');
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.5,
        system: `You are UnnatE's friendly rural AI business advisor. Speak simply, empathetically, and clearly in ${userContext.language === 'hi' ? 'Hindi' : 'English'}. Answer the user's specific question accurately with practical steps for Indian micro-entrepreneurs in ${userContext.district || 'rural India'}.`,
        messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return text;
    } catch (e) {
      console.error('⚠️ Claude chat API call error:', e);
    }
  }

  // Smart fallback chat responses
  const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

  if (lastUserMsg.includes('yes') || lastUserMsg.includes('ha') || lastUserMsg.includes('ha') || lastUserMsg.includes('tell') || lastUserMsg.includes('guide')) {
    return userContext.language === 'hi'
      ? "मुद्रा और MoSJE योजना आवेदन के 4 मुख्य चरण हैं:\n1. Udyam पोर्टल पर निःशुल्क ऑनलाइन पंजीकरण करें।\n2. निकटतम बैंक या SCA कार्यालय में आधार, पैन और 6 महीने का बैंक स्टेटमेंट जमा करें।\n3. UnnatE द्वारा बनाई गई DPR (प्रोजेक्ट रिपोर्ट) साथ संलग्न करें।\n4. बैंक अधिकारी द्वारा 7-14 दिनों में ऋण स्वीकृत कर दिया जाता है।"
      : "Here are the 4 main steps to apply for MUDRA & MoSJE schemes:\n1. Complete free Udyam online registration.\n2. Visit your local bank branch with Aadhaar, PAN, and 6-month bank statement.\n3. Attach your UnnatE AI-generated DPR project report.\n4. Loan sanction letter is issued within 7-14 business days.";
  }

  if (lastUserMsg.includes('mudra') || lastUserMsg.includes('scheme') || lastUserMsg.includes('loan') || lastUserMsg.includes('subsidy')) {
    return userContext.language === 'hi'
      ? "मुद्रा (MUDRA) और MoSJE योजनाओं के तहत आप ₹50,000 से ₹10 लाख तक का रियायती/बिना गारंटी का ऋण ले सकते हैं। आपको आधार, पैन और 6 महीने का बैंक स्टेटमेंट चाहिए। क्या आप आवेदन के चरण जानना चाहते हैं?"
      : "Under MUDRA & MoSJE schemes, you can apply for collateral-free/concessional loans up to ₹10 Lakhs. You will need Aadhaar, PAN, and a 6-month bank statement. Would you like me to guide you through the step-by-step application process?";
  }

  return userContext.language === 'hi'
    ? `नमस्ते! मैं आपका UnnatE AI सलाहकार हूँ। मैं आपकी सहायता कैसे कर सकता हूँ? आप मुझसे ऋण दरों, सरकारी सब्सिडी (MoSJE/MUDRA), या बिज़नेस प्लान के बारे में पूछ सकते हैं।`
    : `Hello! I am your UnnatE AI business advisor. How can I assist you today with your business plan, MoSJE 10% margin money rules, or MUDRA loan application steps?`;
}
