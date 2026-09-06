import { prisma } from '@/lib/prisma';
import type { ContentStatus, ContentType } from '@prisma/client';

// Minimal content foundation (Prompt2 §6), extended Day 3 with the read
// accessors the Blog module needs (by-slug, categories, related). Still
// deliberately not a full CMS (tags, gallery, reading time, scheduling
// worker, ...) — that stays out of scope until it's actually needed.

export async function listPublishedContent(params: { type?: ContentType; category?: string; limit?: number } = {}) {
  return prisma.contentItem.findMany({
    where: {
      status: 'PUBLISHED',
      ...(params.type ? { type: params.type } : {}),
      ...(params.category ? { category: params.category } : {}),
    },
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

export async function getContentBySlug(slug: string) {
  return prisma.contentItem.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { coverMedia: true, author: { select: { id: true, name: true } } },
  });
}

// Small, flexible category list — derived from what's actually published
// rather than a hardcoded taxonomy, so it never claims a category exists
// when nothing is tagged with it.
export async function listContentCategories(type: ContentType = 'ARTICLE'): Promise<string[]> {
  const rows = await prisma.contentItem.findMany({
    where: { status: 'PUBLISHED', type, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return rows.map((r) => r.category).filter((c): c is string => Boolean(c)).sort();
}

// Same category first, newest first; falls back to latest-others when the
// article has no category or nothing else shares it — never a random or
// invented relationship.
export async function getRelatedContent(item: { id: string; category: string | null }, limit = 3) {
  if (item.category) {
    const sameCategory = await prisma.contentItem.findMany({
      where: { status: 'PUBLISHED', type: 'ARTICLE', category: item.category, id: { not: item.id } },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { coverMedia: true, author: { select: { id: true, name: true } } },
    });
    if (sameCategory.length >= limit) return sameCategory;
    const rest = await prisma.contentItem.findMany({
      where: { status: 'PUBLISHED', type: 'ARTICLE', id: { notIn: [item.id, ...sameCategory.map((c) => c.id)] } },
      orderBy: { publishedAt: 'desc' },
      take: limit - sameCategory.length,
      include: { coverMedia: true, author: { select: { id: true, name: true } } },
    });
    return [...sameCategory, ...rest];
  }
  return prisma.contentItem.findMany({
    where: { status: 'PUBLISHED', type: 'ARTICLE', id: { not: item.id } },
    orderBy: { publishedAt: 'desc' },
    take: limit,
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
