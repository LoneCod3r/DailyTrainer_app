import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clsx } from '@/lib/clsx';
import { Container, Card, CardContent, Badge, Button, Alert } from '@/components/ui';
import { ProgressBar } from '@/components/practices/ProgressBar';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';
import { isAdmin } from '@/lib/permissions';
import { localize } from '@/modules/kuko-way/types';
import { getVisibleProgram } from '@/modules/programs/service';
import { countCompletedDays, getCurrentDay, getDayStates, isProgramComplete } from '@/modules/programs/progress';
import { getCompletedItemIds } from '@/modules/programs/progress.service';
import { hasProgramAccess } from '@/modules/commerce/entitlements.service';
import { getProgramProduct } from '@/modules/commerce/catalog';
import { PriceTag } from '@/components/commerce/PriceTag';
import { ComingSoonButton } from '@/components/commerce/ComingSoonButton';
import { features } from '@/lib/features';
import { BuyProgramButton } from '@/components/commerce/BuyProgramButton';
import { isProgramCheckoutAvailable, reconcileProgramPurchase } from '@/modules/commerce/checkout.service';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const program = getVisibleProgram(params.slug);
  return program ? { title: localize(program.title, getLocale()).value } : {};
}

// Program overview — public. Shows what the program is (documents, phases,
// days). Day states and the "continue" action appear only for viewers with
// access (server-checked via hasProgramAccess). Everyone else sees the
// price and either the Stripe TEST MODE purchase action (when
// isProgramCheckoutAvailable) or a calm, inert "Coming soon".
//
// After Stripe redirects back (?purchase=success&session_id=…), the page asks
// Stripe server-side whether that checkout was actually paid and settles it
// through the same rules as the webhook — the redirect alone grants nothing.
export default async function ProgramOverviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { purchase?: string; session_id?: string };
}) {
  const program = getVisibleProgram(params.slug);
  if (!program) notFound();

  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const t = getT(locale);
  const returnedFromPayment = searchParams.purchase === 'success';
  if (returnedFromPayment && session?.user && searchParams.session_id) {
    await reconcileProgramPurchase(session.user.id, searchParams.session_id);
  }
  const access = await hasProgramAccess(session?.user, program.slug);
  const checkoutOpen = isProgramCheckoutAvailable();
  const completed = access && session?.user ? await getCompletedItemIds(session.user.id, program.slug) : new Set<string>();
  const states = getDayStates(program, completed);
  const totalDays = states.size;
  const currentDay = getCurrentDay(program, completed);
  const complete = isProgramComplete(program, completed);
  const completedDays = countCompletedDays(program, completed);
  const title = localize(program.title, locale).value;
  const product = getProgramProduct(program.slug);
  const lengthLabel =
    program.lengthDays === 1 ? t('resetPrograms.oneDay') : t('resetPrograms.days', { count: program.lengthDays });

  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-8">
      <Link href="/practices/programs" className="text-sm font-medium text-link hover:underline">
        ← {t('resetPrograms.backToPrograms')}
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-clay">{lengthLabel}</span>
          {!program.published && <Badge tone="neutral">{t('resetPrograms.previewBadge')}</Badge>}
        </div>
        <h1 className="font-serif text-4xl text-ink-900 sm:text-5xl">{title}</h1>
        {product && <p className="text-lg text-ink-700">{localize(product.tagline, locale).value}</p>}
        {!program.published && <p className="text-sm text-ink-500">{t('resetPrograms.previewNote')}</p>}
      </header>

      {returnedFromPayment &&
        (access ? (
          <Alert tone="success" title={t('purchase.successTitle')} data-testid="purchase-success" />
        ) : (
          <Alert tone="info" title={t('purchase.pendingTitle')} data-testid="purchase-pending">
            {t('purchase.pendingDesc')}
          </Alert>
        ))}
      {searchParams.purchase === 'cancelled' && !access && (
        <Alert tone="info" title={t('purchase.cancelledTitle')} data-testid="purchase-cancelled">
          {t('purchase.cancelledDesc')}
        </Alert>
      )}

      {access ? (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {session?.user && isAdmin(session.user.role) && (
              <p className="text-sm text-ink-500">{t('resetPrograms.staffAccess')}</p>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink-900">{t('resetPrograms.yourProgress')}</span>
              <ProgressBar
                value={completedDays}
                max={totalDays}
                label={t('journey.daysCompleted', { count: completedDays, total: totalDays })}
              />
              <span className="text-sm text-ink-500">
                {t('journey.daysCompleted', { count: completedDays, total: totalDays })}
              </span>
            </div>
            <Link href={`/practices/programs/${program.slug}/day/${currentDay}`} className="w-fit">
              <Button size="lg" data-testid="program-continue">
                {complete
                  ? t('resetPrograms.reviewProgram')
                  : completedDays === 0
                    ? t('resetPrograms.beginDay', { day: currentDay })
                    : t('resetPrograms.continueDay', { day: currentDay })}{' '}
                →
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : checkoutOpen && product ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4" data-testid="program-purchase">
            <div className="flex flex-wrap items-center gap-3">
              <PriceTag product={product} locale={locale} t={t} size="lg" />
              <Badge tone="warning">{t('purchase.testModeBadge')}</Badge>
            </div>
            {session?.user ? (
              <BuyProgramButton programSlug={program.slug} describedBy="purchase-test-note" />
            ) : (
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/practices/programs/${program.slug}`)}`}>
                <Button size="lg">{t('purchase.loginToPurchase')} →</Button>
              </Link>
            )}
            <p id="purchase-test-note" className="text-sm text-ink-500">
              {t('purchase.testModeNote')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-sand-50">
          <CardContent className="flex flex-col gap-2" data-testid="program-not-available">
            {/* Price + an inactive action for review. Checkout is closed
                (features.programCheckout) — the button has no handler and
                cannot reach any payment route. */}
            {features.pricingPreview && product && (
              <div className="flex flex-col items-start gap-3 pb-2">
                <PriceTag product={product} locale={locale} t={t} size="lg" />
                <ComingSoonButton label={t('pricing.comingSoon')} describedBy="program-availability" />
              </div>
            )}
            <h2 className="text-lg font-semibold text-ink-900">{t('resetPrograms.notAvailableTitle')}</h2>
            <p id="program-availability" className="text-ink-700">
              {t('resetPrograms.notAvailableDesc')}
            </p>
            {!session?.user && (
              <p className="pt-1 text-sm text-ink-500">
                {t('resetPrograms.signInTitle')}{' '}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/practices/programs/${program.slug}`)}`}
                  className="font-medium text-link hover:underline"
                >
                  {t('resetPrograms.signInCta')}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {program.documents.map((doc) => (
        <section key={doc.key} className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl text-ink-900">{t(`resetPrograms.documents.${doc.key}` as DictKey)}</h2>
          {doc.body ? (
            doc.body.map((p, i) => (
              <p key={i} className="leading-relaxed text-ink-700">
                {localize(p, locale).value}
              </p>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-sand-300 p-4 text-sm text-ink-500" data-content-required="true">
              {t('resetPrograms.contentRequired')}
            </p>
          )}
        </section>
      ))}

      {program.phases.map((phase) => {
        const summary = phase.summary ? localize(phase.summary, locale) : undefined;
        return (
          <section key={phase.key} className="flex flex-col gap-4">
            {program.phases.length > 1 && (
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-clay">
                  {t('resetPrograms.dayLabel', { day: `${phase.days[0]?.day}–${phase.days[phase.days.length - 1]?.day}` })}
                </p>
                <h2 className="font-serif text-2xl text-ink-900 sm:text-3xl">{localize(phase.title, locale).value}</h2>
                {summary && <p className="mt-1 text-ink-700">{summary.value}</p>}
                {summary?.isFallback && <p className="text-xs italic text-ink-300">{t('language.contentInBulgarian')}</p>}
              </div>
            )}
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
              {phase.days.map((day) => {
                const state = states.get(day.day) ?? 'locked';
                const stateLabel = t(
                  state === 'completed'
                    ? 'resetPrograms.stateCompleted'
                    : state === 'available'
                      ? 'resetPrograms.stateAvailable'
                      : 'resetPrograms.stateLocked',
                );
                const tile = (
                  <span
                    className={clsx(
                      'flex h-full flex-col items-center gap-1 rounded-xl border p-3 text-center',
                      access && state === 'completed' && 'border-brand-600 bg-brand-tint',
                      access && state === 'available' && 'border-brand-600 bg-surface',
                      (!access || state === 'locked') && 'border-sand-200 bg-surface',
                    )}
                  >
                    <span className="text-sm font-semibold text-ink-900">{t('resetPrograms.dayLabel', { day: day.day })}</span>
                    {access && <span className="text-xs text-ink-500">{stateLabel}</span>}
                  </span>
                );
                return (
                  <li key={day.day} data-day-state={access ? state : undefined}>
                    {access && state !== 'locked' ? (
                      <Link href={`/practices/programs/${program.slug}/day/${day.day}`} className="block h-full hover:shadow-soft">
                        {tile}
                      </Link>
                    ) : (
                      tile
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <Disclaimer t={t} />
    </Container>
  );
}
