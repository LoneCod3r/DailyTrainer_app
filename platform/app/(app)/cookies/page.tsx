import { LegalDocumentPage, legalDocumentMetadata } from '@/components/legal/LegalDocumentPage';

// Content and activation live in modules/legal (documents.ts, config.ts).
export function generateMetadata() {
  return legalDocumentMetadata('cookies');
}

export default function CookiesPage() {
  return <LegalDocumentPage id="cookies" />;
}
