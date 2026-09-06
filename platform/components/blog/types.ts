import type { ContentItem, Media } from '@prisma/client';

export type ArticleWithRelations = ContentItem & {
  author: { id: string; name: string | null } | null;
  coverMedia: Media | null;
};
