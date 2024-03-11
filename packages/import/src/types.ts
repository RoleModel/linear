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
  MODDEX = "756b0ced-9e63-4da4-8b4e-9cc0cbe00c96",
  LEVELED_PLATFORMS = "694b8053-be7f-466a-aee0-a902b219ab9f",
}

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
