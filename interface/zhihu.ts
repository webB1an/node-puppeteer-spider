export interface BadgeV2 {
  detail_badges: any[];
  icon: string;
  merged_badges: any[];
  night_icon: string;
  title: string;
}

export interface Author {
  avatar_url: string;
  avatar_url_template: string;
  badge: any[];
  badge_v2: BadgeV2;
  gender: number;
  headline: string;
  id: string;
  is_advertiser: boolean;
  is_org: boolean;
  is_privacy: boolean;
  name: string;
  type: string;
  url: string;
  url_token: string;
  user_type: string;
}

export interface Relationship {
}

export interface Question {
  created: number;
  id: number;
  question_type: string;
  relationship: Relationship;
  title: string;
  type: string;
  updated_time: number;
  url: string;
}

export interface Relationship2 {
  upvoted_followees: any[];
}

export interface AnswerList {
  answer_type: string;
  author: Author;
  comment_count: number;
  created_time: number;
  extras: string;
  id: number;
  is_collapsed: boolean;
  is_copyable: boolean;
  is_normal: boolean;
  question: Question;
  relationship: Relationship2;
  type: string;
  updated_time: number;
  url: string;
  voteup_count: number;
}

export interface Paging {
  is_end: boolean;
  is_start: boolean;
  next: string;
  previous: string;
  totals: number;
}

export interface ZhihuAnswer {
  data: Datum[];
  paging: Paging;
  read_count: number;
}
