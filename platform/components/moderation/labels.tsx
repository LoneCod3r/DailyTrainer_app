import type { ReportReason, ReportResolution, ReportTargetType } from '@prisma/client';

export const REASON_LABEL: Record<ReportReason, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  INAPPROPRIATE: 'Inappropriate content',
  OTHER: 'Other',
};

export const RESOLUTION_LABEL: Record<ReportResolution, string> = {
  NONE: 'No action',
  WARNED: 'Warning recorded',
  CONTENT_HIDDEN: 'Content hidden',
  CONTENT_REMOVED: 'Content removed',
  USER_SUSPENDED: 'Member suspended',
};

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  DISCUSSION: 'Discussion',
  DISCUSSION_REPLY: 'Reply',
};
