/**
 * Traducteur d'interface FR → EN.
 *
 * Les textes de l'application sont écrits en français ; en anglais, chaque texte affiché est remplacé par sa traduction
 * (dictionnaire exact, puis modèles à variables « {0} »). Les contenus venant de la base de données (noms de plats,
 * descriptions, messages des clients) restent tels quels.
 */

export type Langue = 'fr' | 'en';
type Dictionnaire = Record<string, string>;

const ENTITES: [RegExp, string][] = [
  [/&apos;|&#39;|&rsquo;/g, "'"],
  [/&quot;/g, '"'],
  [/&nbsp;| | /g, ' '],
  [/[’‘]/g, "'"],
];

/** Clé de recherche : apostrophes uniformisées, espaces réduits. */
export function normaliser(texte: string): string {
  let t = texte;
  for (const [re, par] of ENTITES) t = t.replace(re, par);
  return t.replace(/\s+/g, ' ').trim();
}

type Modele = { re: RegExp; cible: string };

let exact = new Map<string, string>();
let modeles: Modele[] = [];

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Charge un dictionnaire (clés françaises → traductions). */
export function chargerDictionnaire(d: Dictionnaire): void {
  exact = new Map();
  modeles = [];
  for (const [fr, en] of Object.entries(d)) {
    const cle = normaliser(fr);
    if (/\{\d+\}/.test(cle)) {
      // Modèle court (ex. « {0} commande{1} ») : les variables restent des mots courts, pour ne jamais « avaler » une phrase entière
      const court = cle.replace(/\{\d+\}/g, '').length < 14;
      const variable = court ? '(\\S{0,16})' : '(.+?)';
      const motif = cle
        .split(/(\{\d+\})/)
        .map((p) => (/^\{\d+\}$/.test(p) ? variable : echapper(p)))
        .join('');
      modeles.push({ re: new RegExp(`^${motif}$`), cible: en });
    } else exact.set(cle, en);
  }
  // Les modèles les plus longs (donc les plus précis) passent en premier
  modeles.sort((a, b) => b.re.source.length - a.re.source.length);
}

/** Traduction d'un texte déjà normalisé, ou null si inconnu. */
export function traduireCle(cle: string): string | null {
  const direct = exact.get(cle);
  if (direct !== undefined) return direct;
  for (const m of modeles) {
    const r = m.re.exec(cle);
    if (r) return m.cible.replace(/\{(\d+)\}/g, (_, i) => r[Number(i) + 1] ?? '');
  }
  return null;
}

/** Traduit un texte en conservant les espaces de début et de fin. */
export function traduireTexte(texte: string): string | null {
  const cle = normaliser(texte);
  if (!cle) return null;
  const t = traduireCle(cle);
  if (t === null || t === cle) return null;
  const debut = /^\s*/.exec(texte)?.[0] ?? '';
  const fin = /\s*$/.exec(texte)?.[0] ?? '';
  return `${debut}${t}${fin}`;
}

// ───────────── Application au document ─────────────

const ATTRIBUTS = ['placeholder', 'title', 'aria-label', 'alt', 'aria-description'] as const;
const IGNORES = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'CANVAS']);

const originauxTexte = new WeakMap<Text, string>();
const traduitsTexte = new WeakMap<Text, string>();
const originauxAttr = new WeakMap<Element, Record<string, string>>();

function ignore(el: Element | null, pourAttribut = false): boolean {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const balise = n.tagName.toUpperCase();
    // Le contenu d'un <textarea> est une saisie de l'utilisateur ; son placeholder, lui, se traduit
    const baliseIgnoree = IGNORES.has(balise) && !(pourAttribut && balise === 'TEXTAREA');
    if (baliseIgnoree || n.getAttribute?.('translate') === 'no' || n.classList?.contains('notranslate')) return true;
  }
  return false;
}

function traduireNoeud(node: Text): void {
  const parent = node.parentElement;
  if (!parent || ignore(parent)) return;
  const actuel = node.data;
  // Texte qu'on vient d'écrire nous-mêmes : rien à faire
  if (traduitsTexte.get(node) === actuel) return;
  const t = traduireTexte(actuel);
  if (t !== null) {
    originauxTexte.set(node, actuel);
    traduitsTexte.set(node, t);
    node.data = t;
  } else {
    // React a remplacé le texte par autre chose : l'ancien original n'est plus valable
    originauxTexte.delete(node);
    traduitsTexte.delete(node);
  }
}

function traduireAttributs(el: Element): void {
  if (ignore(el, true)) return;
  for (const nom of ATTRIBUTS) {
    const val = el.getAttribute(nom);
    if (!val) continue;
    const mem = originauxAttr.get(el) ?? {};
    // Valeur déjà traduite par nous
    if (mem[`t:${nom}`] === val) continue;
    const t = traduireTexte(val);
    if (t !== null) {
      mem[nom] = val;
      mem[`t:${nom}`] = t;
      originauxAttr.set(el, mem);
      el.setAttribute(nom, t);
    }
  }
}

function parcourir(racine: Node): void {
  if (racine.nodeType === Node.TEXT_NODE) {
    traduireNoeud(racine as Text);
    return;
  }
  if (racine.nodeType !== Node.ELEMENT_NODE) return;
  const el = racine as Element;
  traduireAttributs(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) traduireNoeud(n as Text);
    else traduireAttributs(n as Element);
    n = walker.nextNode();
  }
}

function restaurer(racine: Node): void {
  const walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      const orig = originauxTexte.get(t);
      if (orig !== undefined && traduitsTexte.get(t) === t.data) t.data = orig;
      originauxTexte.delete(t);
      traduitsTexte.delete(t);
    } else {
      const el = n as Element;
      const mem = originauxAttr.get(el);
      if (mem) {
        for (const nom of ATTRIBUTS) {
          if (mem[nom] !== undefined && el.getAttribute(nom) === mem[`t:${nom}`]) el.setAttribute(nom, mem[nom]);
        }
        originauxAttr.delete(el);
      }
    }
    n = walker.nextNode();
  }
}

let titreOriginal = '';
let dernierTitreTraduit = '';

/** Titre de l'onglet : « Page | Afro-food », « Produit — 12,00 € »… chaque morceau est traduit. */
function traduireTitre(): void {
  const titre = document.title;
  if (titre === dernierTitreTraduit) return; // c'est déjà notre traduction
  titreOriginal = titre;
  const morceaux = titre.split(/( \| | — )/);
  const t = morceaux.map((m) => (/^( \| | — )$/.test(m) ? m : (traduireCle(normaliser(m)) ?? m))).join('');
  dernierTitreTraduit = t;
  if (t !== titre) document.title = t;
}

let observateur: MutationObserver | null = null;
let observateurTitre: MutationObserver | null = null;
let enAttente = false;
const aTraiter = new Set<Node>();

function planifier(): void {
  if (enAttente) return;
  enAttente = true;
  requestAnimationFrame(() => {
    enAttente = false;
    if (!observateur) return;
    observateur.disconnect();
    for (const n of aTraiter) if (n.isConnected) parcourir(n);
    aTraiter.clear();
    traduireTitre();
    observer();
  });
}

function observer(): void {
  observateur?.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRIBUTS],
  });
}

/** Active la traduction anglaise sur tout le document et sur les contenus ajoutés ensuite. */
export function activerTraduction(): void {
  if (observateur) return;
  observateur = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach((n) => aTraiter.add(n));
      else if (m.type === 'characterData') aTraiter.add(m.target);
      else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) aTraiter.add(m.target);
    }
    if (aTraiter.size) planifier();
  });
  document.documentElement.lang = 'en';
  parcourir(document.body);
  traduireTitre();
  observer();
  // Les changements de page (navigation) renouvellent le titre : on le traduit à chaque fois
  observateurTitre = new MutationObserver(() => traduireTitre());
  observateurTitre.observe(document.head, { subtree: true, childList: true, characterData: true });
}

/** Revient au français : textes et attributs d'origine rétablis. */
export function desactiverTraduction(): void {
  observateur?.disconnect();
  observateur = null;
  observateurTitre?.disconnect();
  observateurTitre = null;
  if (titreOriginal && document.title === dernierTitreTraduit) document.title = titreOriginal;
  dernierTitreTraduit = '';
  aTraiter.clear();
  restaurer(document.body);
  document.documentElement.lang = 'fr';
}
