import { PageLoading } from '@/components/ui';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default function AppLoading() {
  const t = getT(getLocale());
  return <PageLoading label={t('common.loading')} />;
}
