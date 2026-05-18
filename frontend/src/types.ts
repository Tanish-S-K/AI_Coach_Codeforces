export interface TagStat {
  tag: string;
  count: number;
}

export interface SkillMetric {
  skill: string;
  score: number;
  related_tags: string[];
}

export interface ProblemSummary {
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  wrong_submissions: number;
  total_submissions: number;
  first_ac_offset_mins?: number;
}

export interface ContestInsight {
  contest_id: number;
  contest_name: string;
  date: string;
  division: string;
  rank: number;
  old_rating: number;
  new_rating: number;
  delta: number;
  problems_attempted: number;
  problems_solved: number;
  problems_upsolved: number;
  accuracy_ratio: string;
  accuracy_percent: number;
  wrong_submissions: number;
  avg_solved_rating: number | null;
  first_ac_offset_mins: number | null;
  last_ac_offset_mins: number | null;
  solved_tags: string[];
  pressure_score: number;
  efficiency_score: number;
  headline: string;
  strengths: string[];
  issues: string[];
  solved_problems: ProblemSummary[];
  unsolved_problems: ProblemSummary[];
  upsolved_problems: ProblemSummary[];
}

export interface WeeklyProgress {
  label: string;
  count: number;
}

export interface RatingPoint {
  contest_id: number;
  contest_name: string;
  date: string;
  rank: number;
  old_rating: number;
  new_rating: number;
  delta: number;
  division: string;
}

export interface TrainingPlan {
  weekly_focus: string[];
  drills: string[];
  milestones: string[];
  next_tag_targets: string[];
}

export interface AIReportPayload {
  provider: string;
  status: string;
  report: string;
  error?: string;
}

export interface DeepAnalysis {
  profile: {
    handle: string;
    rating: number;
    max_rating: number;
    rank: string;
    max_rank: string;
    avatar: string;
    registration_time: string;
    days_on_site: number;
    friend_of_count: number;
    organization: string;
    country: string;
    strengths: string[];
    focus_areas: string[];
    tag_mastery: TagStat[];
  };
  overview: {
    rating_trend_5: number;
    rating_trend_20: number;
    average_weekly_solves: number;
    active_weeks: number;
    solved_this_year: number;
    average_problem_rating: number;
    hardest_solved: number;
    contests_played: number;
    coach_score: number;
  };
  rating_history: RatingPoint[];
  weekly_progress: WeeklyProgress[];
  recent_contests: ContestInsight[];
  skill_map: SkillMetric[];
  training_plan: TrainingPlan;
  ai_report: AIReportPayload;
}
