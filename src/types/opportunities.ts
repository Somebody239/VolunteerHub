export type OpportunityQuestionType = "short_text" | "long_text" | "single_select" | "multi_select";

export interface OpportunityQuestion {
  id?: string;
  opportunity_id?: string;
  prompt: string;
  field_type: OpportunityQuestionType;
  is_required: boolean;
  help_text?: string | null;
  options?: string[] | null;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface OpportunityDetails {
  isVirtual?: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  meetingPoint?: string;
  scheduleNotes?: string;
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  supportNotes?: string;
  safetyNotes?: string;
  additionalNotes?: string;
}

export interface OpportunityResponse {
  question_id?: string;
  prompt?: string;
  answer?: string | string[];
}

export interface ApplicationAnswersV2 {
  version: 2;
  responses: OpportunityResponse[];
  submitted_at: string;
  metadata?: Record<string, unknown>;
}

export type ApplicationAnswers = ApplicationAnswersV2 | Record<string, any> | null;

