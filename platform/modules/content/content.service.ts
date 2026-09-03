import { prisma } from '@/lib/prisma';
import type { ContentStatus, ContentType } from '@prisma/client';

// Minimal content foundation (Prompt2 §6). Deliberately does not implement
// the full CMS (categories, tags, gallery, reading time, scheduling worker,
// ...) described in Prompt.docx §2 — that belongs to a future Blog module.

export async function listPublishedContent(params: { type?: ContentType; limit?: number } = {}) {
  return prisma.contentItem.findMany({
    where: { status: 'PUBLISHED', ...(params.type ? { type: params.type } : {}) },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: params.limit ?? 10,
    include: { coverMedia: true, author: { select: { id: true, name: true } } },
  });
}

export async function getFeaturedContent() {
  return prisma.contentItem.findFirst({
    where: { status: 'PUBLISHED', featured: true },
    orderBy: { publishedAt: 'desc' },
    include: { coverMedia: true, author: { select: { id: true, name: true } } },
  });
}

export async function getPinnedAnnouncements(limit = 5) {
  return prisma.contentItem.findMany({
    where: { status: 'PUBLISHED', type: 'ANNOUNCEMENT', pinned: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

export async function createContentItem(data: {
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  status?: ContentStatus;
  authorId?: string;
}) {
  return prisma.contentItem.create({ data });
}
