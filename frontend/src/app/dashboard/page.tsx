'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { dispatchFavoritesUpdated, FAVORITES_STORAGE_KEY } from '@/lib/favoritesStorage';
import { updateProfil } from '@/services/auth';
import InstallButton from '@/components/InstallButton';
import { getMesCommandes } from '@/services/commandes';
import { getMesAvis, type AvisItem } from '@/services/avis';

type Section = 'commandes' | 'favoris' | 'profil' | 'avis';

type OrderRow = {
  backendId: string;
  id: string;
  date: string;
  total: string;
  statut: string;
  items: string;
};

type ReviewRow = {
  id: string;
  produit: string;
  note: number;
  texte: string;
  date: string;
  statut: string;
};

type FavItem = {
  id: string;
  nom: string;
  image: string;
};

const MOCK_FAVS: FavItem[] = [
  { id: '1', nom: 'Jollof rice au poulet', image: '/images/plats/1769702264382_Jollof_rice_au_poulet.jpg' },
  { id: '2', nom: 'Jus de Bissap', image: '/images/plats/1769702468458_Jus_de_bissap.jpg' },
  { id: '3', nom: 'Dibi agneau', image: '/images/plats/Dibi_agneau.png' },
];

function statusLabel(s: string) {
  switch (s) {
    case 'en_attente':
      return 'En attente';
    case 'confirmee':
      return 'Confirmée';
    case 'en_preparation':
      return 'En préparation';
    case 'prete':
      return 'Prête';
    case 'en_livraison':
      return 'En livraison';
    case 'livree':
      return 'Livrée';
    case 'annulee':
      return 'Annulée';
    case 'remboursee':
      return 'Remboursée';
    default:
      return s;
  }
}

function reviewStatusLabel(s: string) {
  switch (s) {
    case 'approuve':
      return 'Approuvé';
    case 'en_attente':
      return 'En attente';
    case 'rejete':
      return 'Rejeté';
    case 'signale':
      return 'Signalé';
    default:
      return s;
  }
}

function statusClass(s: string) {
  switch (s) {
    case 'en_attente':
      return 'bg-[color:rgba(194,97,15,.18)] text-[var(--ochre)] border-[var(--ochre)]/25';
    case 'confirmee':
      return 'bg-[color:rgba(194,97,15,.10)] text-[var(--ochre)] border-[var(--ochre)]/20';
    case 'en_preparation':
      return 'bg-[color:rgba(139,58,42,.12)] text-[var(--brick)] border-[var(--brick)]/25';
    case 'prete':
      return 'bg-[color:rgba(139,58,42,.16)] text-[var(--brick)] border-[var(--brick)]/30';
    case 'en_livraison':
      return 'bg-[color:rgba(44,26,14,.08)] text-[var(--wood)] border-[var(--wood)]/15';
    case 'livree':
      return 'bg-[color:rgba(44,26,14,.08)] text-[var(--wood)] border-[var(--wood)]/15';
    case 'annulee':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'remboursee':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return '';
  }
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  return (
    <span className="text-[var(--ochre)]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

const navItems: { id: Section; label: string }[] = [
  { id: 'commandes', label: 'Mes commandes' },
  { id: 'favoris', label: 'Favoris' },
  { id: 'profil', label: 'Mon profil' },
  { id: 'avis', label: 'Mes avis' },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logout, refresh } = useAuth();
  const [section, setSection] = useState<Section>('commandes');
  const [hydrated, setHydrated] = useState(false);

  const [profil, setProfil] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
  });
  const [profilSaving, setProfilSaving] = useState(false);
  const [profilMessage, setProfilMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [favoris, setFavoris] = useState<FavItem[]>(MOCK_FAVS);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'commandes' || t === 'favoris' || t === 'profil' || t === 'avis') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSection(t);
    }
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FavItem[];
        if (Array.isArray(parsed) && parsed.length > 0) setFavoris(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoris));
      dispatchFavoritesUpdated();
    } catch {}
  }, [hydrated, favoris]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfil({
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || '',
    });
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!hydrated || !user) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrdersLoading(true);
    setOrdersError('');
    getMesCommandes({ limite: 20 })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setOrdersError(res.message || 'Impossible de charger vos commandes.');
          setOrders([]);
          return;
        }
        const list = res.data?.commandes || [];
        const mapped: OrderRow[] = list.map((cmd) => {
          const dateRaw = cmd.dates?.commande || cmd.createdAt || new Date().toISOString();
          const date = new Date(dateRaw).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const total = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cmd.montants.total || 0);
          const items = (cmd.articles || [])
            .slice(0, 3)
            .map((a) => `${a.informationsPlat?.nom || 'Plat'} ×${a.quantite}`)
            .join(', ');
          return {
            backendId: cmd._id,
            id: cmd.numeroCommande || cmd._id,
            date,
            total,
            statut: cmd.statut,
            items: items || '—',
          };
        });
        setOrders(mapped);
      })
      .catch((err) => {
        if (cancelled) return;
        setOrdersError(err instanceof Error ? err.message : 'Impossible de charger vos commandes.');
        setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviewsLoading(true);
    setReviewsError('');
    getMesAvis({ limite: 20, tri: 'recent' })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setReviewsError(res.message || 'Impossible de charger vos avis.');
          setReviews([]);
          return;
        }
        const list = res.data?.avis || [];
        const mapped: ReviewRow[] = list.map((a: AvisItem) => ({
          id: a._id,
          produit: a.plat?.nom || 'Plat',
          note: a.note || 0,
          texte: a.commentaire || '',
          date: new Date(a.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          statut: a.statut || 'en_attente',
        }));
        setReviews(mapped);
      })
      .catch((err) => {
        if (cancelled) return;
        setReviewsError(err instanceof Error ? err.message : 'Impossible de charger vos avis.');
        setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const removeFav = (id: string) => setFavoris((f) => f.filter((x) => x.id !== id));

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
        <Header />
        <main className="flex-grow py-16 text-center text-sm text-[var(--wood)]/60">
          {authLoading ? 'Chargement de votre espace…' : 'Redirection…'}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow py-10 lg:py-12">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 lg:flex-row lg:gap-10 lg:px-12">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-[280px]">
            <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur">
              <p className="font-title text-xl">Mon espace</p>
              <p className="mt-1 text-xs text-[var(--wood)]/65">Tableau de bord client</p>

              <nav className="mt-8 space-y-1" aria-label="Navigation compte">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      router.replace(`/dashboard?tab=${item.id}`, { scroll: false });
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      section === item.id
                        ? 'bg-[color:rgba(194,97,15,.14)] text-[var(--wood)] ring-1 ring-[var(--ochre)]/25'
                        : 'text-[var(--wood)]/75 hover:bg-white/50'
                    }`}
                  >
                    {item.label}
                    <span className="text-[var(--wood)]/35">→</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[var(--brick)]/25 bg-[color:rgba(139,58,42,.08)] px-4 py-3 text-left text-sm font-semibold text-[var(--brick)] hover:bg-[color:rgba(139,58,42,.12)]"
                >
                  Déconnexion
                  <span aria-hidden>↩</span>
                </button>
              </nav>
              <Link
                href="/fidelite"
                className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--wood)]/75 transition hover:bg-white/50"
              >
                Ma fidélité
                <span aria-hidden="true">★</span>
              </Link>
            </div>
          </aside>

          {/* Zone principale */}
          <div className="min-w-0 flex-1">
            {/* Commandes */}
            {section === 'commandes' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-title text-4xl tracking-tight">Tableau de bord</h1>
                  <p className="mt-2 text-sm text-[var(--wood)]/70">Vos commandes récentes et leur statut.</p>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur">
                  <div className="border-b border-[var(--wood)]/10 px-6 py-4">
                    <h2 className="font-title text-2xl">Commandes récentes</h2>
                  </div>
                  {ordersLoading ? (
                    <p className="px-6 py-4 text-sm text-[var(--wood)]/70">Chargement des commandes…</p>
                  ) : null}
                  {ordersError ? (
                    <p className="px-6 py-4 text-sm text-red-700">{ordersError}</p>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-[var(--paper)]/80 text-[var(--wood)]/70">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Commande</th>
                          <th className="px-6 py-3 font-semibold">Date</th>
                          <th className="px-6 py-3 font-semibold">Articles</th>
                          <th className="px-6 py-3 font-semibold">Total</th>
                          <th className="px-6 py-3 font-semibold">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-t border-[var(--wood)]/10">
                            <td className="px-6 py-4 font-mono text-[var(--wood)]">
                              <Link href={`/commande/${o.backendId}`} className="hover:underline">
                                {o.id}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-[var(--wood)]/80">{o.date}</td>
                            <td className="max-w-[240px] px-6 py-4 text-[var(--wood)]/80">{o.items}</td>
                            <td className="px-6 py-4 font-semibold">{o.total}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(o.statut)}`}
                              >
                                {statusLabel(o.statut)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!ordersLoading && orders.length === 0 && (
                          <tr className="border-t border-[var(--wood)]/10">
                            <td className="px-6 py-6 text-sm text-[var(--wood)]/70" colSpan={5}>
                              Aucune commande pour le moment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Favoris */}
            {section === 'favoris' && (
              <div className="space-y-6">
                <h1 className="font-title text-4xl tracking-tight">Favoris</h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favoris.map((f) => (
                    <article
                      key={f.id}
                      className="overflow-hidden rounded-[24px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur"
                    >
                      <div className="h-36 overflow-hidden">
                        <img src={f.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <Link href={`/produit/${f.id}`} className="font-semibold text-[var(--wood)] hover:underline">
                          {f.nom}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFav(f.id)}
                          className="text-xs font-semibold text-[var(--brick)] hover:underline"
                        >
                          Retirer
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {favoris.length === 0 && (
                  <p className="text-sm text-[var(--wood)]/65">Aucun favori pour le moment.</p>
                )}
              </div>
            )}

            {/* Profil */}
            {section === 'profil' && (
              <div className="space-y-6">
                <h1 className="font-title text-4xl tracking-tight">Mon profil</h1>
                <form
                  className="max-w-xl space-y-4 rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur lg:p-8"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setProfilMessage(null);
                    setProfilSaving(true);
                    const res = await updateProfil({
                      prenom: profil.prenom.trim(),
                      nom: profil.nom.trim(),
                      telephone: profil.telephone.trim(),
                    });
                    setProfilSaving(false);
                    if (res.success && res.data?.user) {
                      setProfilMessage({ type: 'ok', text: 'Profil enregistré.' });
                      await refresh();
                    } else {
                      setProfilMessage({
                        type: 'err',
                        text: res.message || 'Impossible d’enregistrer le profil.',
                      });
                    }
                  }}
                >
                  {profilMessage ? (
                    <p
                      role="status"
                      className={
                        profilMessage.type === 'ok'
                          ? 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'
                          : 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900'
                      }
                    >
                      {profilMessage.text}
                    </p>
                  ) : null}
                  <label className="block text-xs font-semibold text-[var(--wood)]/80">
                    Prénom
                    <input
                      value={profil.prenom}
                      onChange={(e) => setProfil((p) => ({ ...p, prenom: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[var(--wood)]/80">
                    Nom
                    <input
                      value={profil.nom}
                      onChange={(e) => setProfil((p) => ({ ...p, nom: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[var(--wood)]/80">
                    Email
                    <input
                      type="email"
                      readOnly
                      value={profil.email}
                      title="Pour modifier l’e-mail, contactez le support."
                      className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--wood)]/10 bg-[var(--paper)]/80 px-4 py-3 text-sm text-[var(--wood)]/70 outline-none"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-[var(--wood)]/50">
                      L’e-mail ne peut pas être modifié depuis cette page.
                    </span>
                  </label>
                  <label className="block text-xs font-semibold text-[var(--wood)]/80">
                    Téléphone
                    <input
                      value={profil.telephone}
                      onChange={(e) => setProfil((p) => ({ ...p, telephone: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={profilSaving}
                    className="mt-4 rounded-full bg-[var(--ochre)] px-8 py-3 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {profilSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </form>
                <div className="max-w-xl space-y-3 rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur lg:p-8">
                  <h2 className="font-title text-2xl tracking-tight">Application</h2>
                  <InstallButton />
                </div>
              </div>
            )}

            {/* Avis */}
            {section === 'avis' && (
              <div className="space-y-6">
                <h1 className="font-title text-4xl tracking-tight">Mes avis</h1>
                {reviewsLoading ? <p className="text-sm text-[var(--wood)]/70">Chargement de vos avis…</p> : null}
                {reviewsError ? <p className="text-sm text-red-700">{reviewsError}</p> : null}
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-[24px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--wood)]">{r.produit}</p>
                        <div className="flex items-center gap-3">
                          <Stars value={r.note} />
                          <span className="rounded-full border border-[var(--wood)]/15 bg-white/50 px-3 py-1 text-xs font-semibold text-[var(--wood)]/70">
                            {reviewStatusLabel(r.statut)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[var(--wood)]/75">{r.texte}</p>
                      <p className="mt-2 text-xs text-[var(--wood)]/50">{r.date}</p>
                    </li>
                  ))}
                </ul>
                {!reviewsLoading && reviews.length === 0 ? (
                  <p className="text-sm text-[var(--wood)]/70">Vous n&apos;avez pas encore publié d&apos;avis.</p>
                ) : null}
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow py-16 text-center text-sm text-[var(--wood)]/60">Chargement…</main>
      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
