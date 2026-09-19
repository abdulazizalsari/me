export type CmsContentType =
  | "homepage"
  | "service"
  | "course"
  | "project"
  | "article"
  | "cv"
  | "education"
  | "qualification"
  | "experience"
  | "skill"
  | "navigation"
  | "footer"
  | "cta"
  | "contact"
  | "consultation"
  | "form"
  | "whatsapp"
  | "integration"
  | "seo"
  | "privacy";
export type CmsStatus = "draft" | "published" | "scheduled" | "archived";

export type CmsContentSeed = {
  type: CmsContentType;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  bodyAr?: string;
  bodyEn?: string;
  category?: string;
  status: CmsStatus;
  sortOrder: number;
  meta?: Record<string, unknown>;
};

export type CmsContentItem = CmsContentSeed & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CmsMediaAsset = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  isProtected: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
  publicFormats: string[];
  altAr: string;
  altEn: string;
};

export type CmsUser = {
  id: string;
  email: string;
  role: "admin";
  createdAt: string;
};

export type CmsRevision = {
  id: string;
  contentId: string;
  snapshot: CmsContentItem;
  createdAt: string;
};

export type CmsActivityLog = {
  id: string;
  event: string;
  createdAt: string;
};

export type CmsRedirect = {
  id: string;
  oldUrl: string;
  newUrl: string;
  statusCode: 301 | 302 | 410;
  active: boolean;
  createdAt: string;
};

export type CmsFormSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  status: "new" | "in_progress" | "done" | "archived";
  notes: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CmsNotFoundHit = {
  id: string;
  path: string;
  referrer: string;
  userAgent: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
};
