import { LegalDocumentPage, legalDocumentMetadata } from '@/components/legal/LegalDocumentPage';

// Content and activation live in modules/legal (documents.ts, config.ts).
export function generateMetadata() {
  return legalDocumentMetadata('cookies');
}

export default function CookiesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <LegalDocumentPage id="cookies" searchParams={searchParams} />;
}
