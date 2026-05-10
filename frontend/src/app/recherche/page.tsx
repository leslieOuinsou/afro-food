import { Suspense } from 'react';
import RechercheSearch from './RechercheClient';

function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--ivory)] px-6 py-12">
      <div className="mx-auto max-w-[900px] animate-pulse space-y-4">
        <div className="h-12 rounded-2xl bg-[var(--wood)]/10" />
        <div className="h-5 w-48 rounded bg-[var(--wood)]/10" />
        <div className="h-10 w-full max-w-md rounded-full bg-[var(--wood)]/10" />
      </div>
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <RechercheSearch />
    </Suspense>
  );
}
