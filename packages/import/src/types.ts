/** Estimate */
export enum Estimate {
  NoEstimate = 0,
  Empty = 1, // For Epics
  XS = 2,
  S = 3,
  M = 4,
  L = 5,
  XL = 6,
}

// Projects
export enum Project {
  KOMBI = "f5758aef-d1bc-4833-b225-ea071ab25834",
  MODDEX_PHASE_1 = "756b0ced-9e63-4da4-8b4e-9cc0cbe00c96",
  MODDEX_PHASE_2 = "f8a837f0-1708-48c2-895f-15b79e9ce627",
  LEVELED_PLATFORMS = "694b8053-be7f-466a-aee0-a902b219ab9f",
  LEVELED_PLATFORMS_WORKSHOP = "aac7160f-2fc0-4ce9-9b83-1e7b5f4c563d",
}

// Milestone
// export enum ProjectMilestone {
//   // Kombi
//   KOMBI_Q4_2022 = '67635d43-4499-4db8-86b7-9e30aaeb8db4',
//   KOMBI_Q1_2023 = '514a664c-a2b7-48ed-996d-95effb839913',
//   KOMBI_Q2_2023 = 'b37af847-53c5-46e0-ac73-8f9ea5dde3b7',
//   KOMBI_Q3_2023 = 'cf1233d2-2193-4369-9f2a-db29d22e28fd',
//   KOMBI_Q4_2023 = '5e0313c0-18d1-4e37-a8e6-daa57377f1dc',
//   KOMBI_Q1_2024 = 'e633eb0b-48d1-4b0e-9d23-e44128edb4ca',
//   // // ROOFS
//   // ROOFS_Q4_2022 = '',
//   // ROOFS_Q1_2023 = '',
//   // ROOFS_Q2_2023 = '',
//   // ROOFS_Q3_2023 = '',
//   // ROOFS_Q4_2023 = '',
//   // ROOFS_Q1_2024 = '',
//   // // PORTAL
//   // PORTAL_Q4_2022 = '',
//   // PORTAL_Q1_2023 = '',
//   // PORTAL_Q2_2023 = '',
//   // PORTAL_Q3_2023 = '',
//   // PORTAL_Q4_2023 = '',
//   // PORTAL_Q1_2024 = '',
//   // Moddex
//   MODDEX_PHASE_1_Q4_2023 = '13e147f6-c6eb-4f39-8885-98ad7043ed5a',
//   MODDEX_PHASE_1_Q1_2024 = '08330e27-f59f-41f2-8b97-12f2e6f6a5d5',
//   // Moddex Phase 2
//   MODDEX_PHASE_2_Q4_2023 = 'b90e9a17-e66d-4341-8217-732498d5c434',
//   MODDEX_PHASE_2_Q1_2024 = '9a84e831-1301-4f2e-8efb-6ad39ea34258',
//   // Leveled Platforms
//   LEVELED_PLATFORMS_PHASE_1_Q4_2023 = 'c563878e-38a3-454c-8d09-8517d757f740',
//   LEVELED_PLATFORMS_PHASE_1_Q1_2024 = '9a0af8ce-a5e2-4e10-b2aa-c1b227fe20e7',
//   // Leveled Platforms Phase 2
//   LEVELED_PLATFORMS_PHASE_2_Q4_2023 = 'c7013364-f033-40cb-9249-a73696587f2b',
//   LEVELED_PLATFORMS_PHASE_2_Q1_2024 = 'f4f2934c-38f3-4112-b175-7d5dc4b93544',
// }

export enum Status {
  BACKLOG = "Backlog",
  TODO = "Todo",
  IN_PROGRESS = "In Progress",
  IN_REVIEW = "In Review",
  DONE = "Done",
  CUSTOMER_REVIEW = "Customer Review",
  CANCELED = "Canceled",
  DUPLICATE = "Duplicate",
}

/** Issue. */
export interface Issue {
  /** Issue title */
  title: string;
  /** Description in markdown */
  description?: string;
  /** Status */
  status?: string;
  /** Assigned user */
  assigneeId?: string;
  /** Issue's priority from 0-4, with 0 being the most important. Undefined for non-prioritized. */
  priority?: number;
  /** Issue's comments */
  comments?: Comment[];
  /** Issue's label IDs */
  labels?: string[];
  /** Link to original issue. */
  url?: string;
  /** When the issue was created. */
  createdAt?: Date;
  /** When the issue is due. This is a date string of the format yyyy-MM-dd. */
  dueDate?: Date;
  /** When the issue was completed. */
  completedAt?: Date;
  /** When the issue was started. */
  startedAt?: Date;
  originalId?: string;
  /** Estimate of the card effort. */
  estimate?: Estimate;
  /** Project ID of the card. */
  projectId?: Project;
  projectMilestoneId?: string;
}

/** Issue comment */
export interface Comment {
  /** Comment's body in markdown */
  body?: string;
  /** User who posted the comments */
  userId: string;
  /** When the comment was created. */
  createdAt?: Date;
}

export type IssueStatus = "backlog" | "unstarted" | "started" | "completed" | "canceled";

/** Import response. */
export interface ImportResult {
  issues: Issue[];
  statuses?: {
    [id: string]: {
      name: string;
      color?: string;
      type?: IssueStatus;
    };
  };
  users: {
    [id: string]: {
      name: string;
      email?: string;
      avatarUrl?: string;
    };
  };
  labels: {
    [id: string]: {
      name: string;
      color?: string;
      description?: string;
    };
  };
  /// A suffix to be appended to each resource URL (e.g. to authenticate requests)
  resourceURLSuffix?: string;
  subIssues?: { [key: string]: string[] };
}

/**
 * Generic importer interface.
 */
export interface Importer {
  // Import source name (e.g. 'GitHub')
  name: string;
  // Default team name (used in the prompt)
  defaultTeamName?: string;
  // Gets issues from import source
  import(): Promise<ImportResult>;
}

export interface ImportAnswers {
  // Linear's API key
  linearApiKey: string;
  // Import service type
  service: string;
}
