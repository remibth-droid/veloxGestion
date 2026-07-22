/* ============================================================
   Velox Paie API — moteur de calcul v1.0.0
   Module pur (zéro dépendance, zéro DOM) : fonctionne dans
   Node, le navigateur (ES module) et Cloudflare Workers.
   Règles : Code du travail + convention collective HCR.
   ============================================================ */

export const VERSION = '1.0.0';

export const DISCLAIMER =
  'Résultats indicatifs fondés sur les règles générales du Code du travail et de la convention collective HCR. Ne constitue pas un conseil juridique ou comptable.';

/* ---------- Barèmes de majoration des heures supplémentaires ---------- */

export const BAREMES = {
  legal: {
    label: 'Régime légal (Code du travail)',
    // De la 36e à la 43e heure : +25 %. Au-delà : +50 %.
    tranches: [
      { jusqua: 43, taux: 0.25 },
      { jusqua: Infinity, taux: 0.50 }
    ],
    contingentAnnuel: 220
  },
  hcr: {
    label: 'Convention collective HCR (hôtels, cafés, restaurants)',
    // 36e-39e : +10 %. 40e-43e : +20 %. Dès la 44e : +50 %.
    tranches: [
      { jusqua: 39, taux: 0.10 },
      { jusqua: 43, taux: 0.20 },
      { jusqua: Infinity, taux: 0.50 }
    ],
    contingentAnnuel: 360
  }
};

const BASE_LEGALE = 35;

/* ---------- Utilitaires ---------- */

const r2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

function assertNombre(v, nom, { min = 0, max = Infinity, entier = false } = {}) {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`Paramètre « ${nom} » invalide : nombre attendu.`);
  }
  if (v < min || v > max) {
    throw new Error(`Paramètre « ${nom} » hors limites (${min} à ${max}).`);
  }
  if (entier && !Number.isInteger(v)) {
    throw new Error(`Paramètre « ${nom} » invalide : entier attendu.`);
  }
}

function parseDateISO(s, nom) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Paramètre « ${nom} » invalide : date au format AAAA-MM-JJ attendue.`);
  }
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Paramètre « ${nom} » invalide : date inexistante.`);
  }
  return d;
}

const iso = (d) => d.toISOString().slice(0, 10);
const plusJours = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

/* ============================================================
   1. HEURES SUPPLÉMENTAIRES
   ============================================================ */

/**
 * Décompose une semaine de travail en tranches de majoration.
 * @param {object} p
 * @param {number} p.heures        Heures effectuées dans la semaine
 * @param {number} p.contratHebdo  Durée contractuelle (35, 37 ou 39 h en HCR)
 * @param {string} p.convention    'hcr' ou 'legal'
 */
export function calculerHeuresSup({ heures, contratHebdo = 35, convention = 'hcr' } = {}) {
  assertNombre(heures, 'heures', { min: 0, max: 90 });
  assertNombre(contratHebdo, 'contratHebdo', { min: 35, max: 39 });
  const bareme = BAREMES[convention];
  if (!bareme) {
    throw new Error(`Convention inconnue : « ${convention} ». Valeurs possibles : ${Object.keys(BAREMES).join(', ')}.`);
  }

  const alertes = [];
  if (heures > 48) {
    alertes.push('Durée maximale hebdomadaire légale dépassée (48 h) : situation illégale sauf dérogation exceptionnelle.');
  }

  const heuresMax = Math.max(heures, BASE_LEGALE);

  // Points de découpe : base légale, fin de contrat, bornes de tranches, total effectué.
  const bornes = new Set([BASE_LEGALE, contratHebdo, heuresMax]);
  for (const t of bareme.tranches) {
    if (t.jusqua < heuresMax) bornes.add(t.jusqua);
  }
  const points = [...bornes]
    .filter((b) => b >= BASE_LEGALE && b <= heuresMax)
    .sort((a, b) => a - b);

  const tranches = [];
  let majorationTotale = 0;
  let majorationHorsContrat = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const de = points[i];
    const a = points[i + 1];
    const nb = Math.min(a, heures) - de;
    if (nb <= 1e-9) continue;

    const taux = (bareme.tranches.find((t) => a <= t.jusqua + 1e-9) ?? bareme.tranches.at(-1)).taux;
    const incluseContrat = a <= contratHebdo + 1e-9;
    const majoration = nb * taux;

    majorationTotale += majoration;
    if (!incluseContrat) majorationHorsContrat += majoration;

    tranches.push({
      de: r2(de),
      a: r2(Math.min(a, heures)),
      heures: r2(nb),
      taux,
      incluseContrat,
      note: incluseContrat
        ? `Heures structurelles déjà rémunérées dans le salaire de base (contrat ${contratHebdo} h).`
        : 'Heures à payer en plus du salaire de base.'
    });
  }

  const heuresSupTotal = r2(Math.max(0, heures - BASE_LEGALE));
  const heuresSupHorsContrat = r2(Math.max(0, heures - contratHebdo));

  return {
    convention,
    conventionLabel: bareme.label,
    contratHebdo,
    heures,
    heuresNormales: r2(Math.min(heures, BASE_LEGALE)),
    heuresSupTotal,
    heuresSupHorsContrat,
    tranches,
    majorationTotale: r2(majorationTotale),
    // Équivalent en « heures payées » : heures sup + leurs majorations.
    equivalentHeuresPayees: r2(heuresSupTotal + majorationTotale),
    equivalentHeuresPayeesHorsContrat: r2(heuresSupHorsContrat + majorationHorsContrat),
    alertes
  };
}

/**
 * Convertit un résultat d'heures sup en montants bruts (€).
 */
export function chiffrerHeuresSup(resultat, tauxHoraireBrut) {
  assertNombre(tauxHoraireBrut, 'tauxHoraireBrut', { min: 0, max: 1000 });
  return {
    tauxHoraireBrut,
    brutHeuresSupTotal: r2(resultat.equivalentHeuresPayees * tauxHoraireBrut),
    brutHeuresSupHorsContrat: r2(resultat.equivalentHeuresPayeesHorsContrat * tauxHoraireBrut)
  };
}

/**
 * Calcul sur plusieurs semaines + suivi du contingent annuel.
 * @param {object} p
 * @param {Array<{heures:number,label?:string}>} p.semaines
 */
export function calculerHeuresSupMulti({ semaines, contratHebdo = 35, convention = 'hcr' } = {}) {
  if (!Array.isArray(semaines) || semaines.length === 0) {
    throw new Error('Paramètre « semaines » invalide : tableau non vide attendu.');
  }
  if (semaines.length > 53) {
    throw new Error('Paramètre « semaines » invalide : 53 semaines maximum.');
  }

  const resultats = semaines.map((s, i) => ({
    semaine: s?.label ?? `S${i + 1}`,
    ...calculerHeuresSup({ heures: s?.heures, contratHebdo, convention })
  }));

  const somme = (cle) => r2(resultats.reduce((acc, x) => acc + x[cle], 0));
  const cumul = {
    heuresTravaillees: somme('heures'),
    heuresSupTotal: somme('heuresSupTotal'),
    heuresSupHorsContrat: somme('heuresSupHorsContrat'),
    majorationTotale: somme('majorationTotale'),
    equivalentHeuresPayees: somme('equivalentHeuresPayees'),
    equivalentHeuresPayeesHorsContrat: somme('equivalentHeuresPayeesHorsContrat')
  };

  const bareme = BAREMES[convention];
  const alertes = [];

  if (cumul.heuresSupTotal > bareme.contingentAnnuel) {
    alertes.push(`Contingent annuel d’heures supplémentaires dépassé (${cumul.heuresSupTotal} h pour un plafond de ${bareme.contingentAnnuel} h).`);
  }
  if (semaines.length >= 12) {
    const moyenne = cumul.heuresTravaillees / semaines.length;
    if (moyenne > 44) {
      alertes.push(`Moyenne hebdomadaire de ${r2(moyenne)} h sur la période : le plafond légal est de 44 h en moyenne sur 12 semaines.`);
    }
  }

  return {
    convention,
    conventionLabel: bareme.label,
    contratHebdo,
    nbSemaines: semaines.length,
    resultats,
    cumul,
    contingent: {
      plafondAnnuel: bareme.contingentAnnuel,
      utiliseSurPeriode: cumul.heuresSupTotal,
      note: 'Simplification : toutes les heures au-delà de 35 h sont imputées au contingent (les heures compensées en repos n’y entrent normalement pas).'
    },
    alertes
  };
}

/* ============================================================
   2. CONGÉS PAYÉS — ACQUISITION
   ============================================================ */

/**
 * Nombre de mois de travail effectif entre deux dates (fin incluse).
 * Approximation transparente : mois civils entiers + fraction en 30e.
 */
export function moisEntre(debutStr, finStr) {
  const debut = parseDateISO(debutStr, 'debut');
  const fin = parseDateISO(finStr, 'fin');
  if (fin < debut) throw new Error('La date de fin est antérieure à la date de début.');

  const finP = plusJours(fin, 1); // période inclusive
  let mois = (finP.getUTCFullYear() - debut.getUTCFullYear()) * 12 + (finP.getUTCMonth() - debut.getUTCMonth());
  let frac;
  if (finP.getUTCDate() >= debut.getUTCDate()) {
    frac = (finP.getUTCDate() - debut.getUTCDate()) / 30;
  } else {
    mois -= 1;
    frac = (30 - (debut.getUTCDate() - finP.getUTCDate())) / 30;
  }
  return Math.max(0, mois + Math.min(frac, 0.999));
}

/**
 * Jours de congés payés acquis.
 * 2,5 jours ouvrables (ou 25/12 jours ouvrés) par mois, plafond 30/25,
 * arrondi au jour supérieur (art. L3141-7).
 * @param {object} p — fournir soit { debut, fin }, soit { moisTravailles }.
 */
export function calculerAcquisitionCP({ debut, fin, moisTravailles = null, methode = 'ouvrables' } = {}) {
  if (!['ouvrables', 'ouvres'].includes(methode)) {
    throw new Error('Paramètre « methode » invalide : « ouvrables » ou « ouvres » attendu.');
  }

  const alertes = [];
  let mois;
  if (moisTravailles != null) {
    assertNombre(moisTravailles, 'moisTravailles', { min: 0, max: 12 });
    mois = moisTravailles;
  } else {
    if (!debut || !fin) {
      throw new Error('Fournir « debut » et « fin » (AAAA-MM-JJ) ou « moisTravailles ».');
    }
    mois = moisEntre(debut, fin);
    if (mois > 12) {
      mois = 12;
      alertes.push('Période supérieure à 12 mois : plafonnée à une période de référence complète.');
    }
  }

  const plafond = methode === 'ouvrables' ? 30 : 25;
  const tauxMensuel = plafond / 12; // 2,5 j ouvrables ou ≈ 2,08 j ouvrés
  const joursBruts = mois * tauxMensuel;
  const joursAcquis = Math.min(plafond, Math.ceil(joursBruts - 1e-9));

  return {
    methode,
    mois: r2(mois),
    tauxMensuel: r2(tauxMensuel),
    joursBruts: r2(joursBruts),
    joursAcquis,
    plafond,
    alertes,
    note: 'Arrondi au nombre entier supérieur conformément à l’article L3141-7 du Code du travail. Période de référence par défaut : 1er juin – 31 mai.'
  };
}

/* ============================================================
   3. CONGÉS PAYÉS — INDEMNITÉ (1/10e vs maintien de salaire)
   ============================================================ */

/**
 * Compare la règle du dixième et le maintien de salaire,
 * et retourne le montant le plus favorable (obligation légale).
 * @param {object} p
 * @param {number} p.remunerationBrutePeriode  Brut total de la période de référence
 * @param {number} p.salaireMensuelBrut        Salaire brut mensuel actuel
 * @param {number} p.joursPris                 Jours de congés pris
 * @param {string} p.methode                   'ouvrables' (base 30, diviseur 26) ou 'ouvres' (base 25, diviseur 21,67)
 * @param {number} [p.diviseurMaintien]        Surcharge du diviseur de maintien
 */
export function calculerIndemniteCP({
  remunerationBrutePeriode,
  salaireMensuelBrut,
  joursPris,
  methode = 'ouvrables',
  diviseurMaintien = null
} = {}) {
  if (!['ouvrables', 'ouvres'].includes(methode)) {
    throw new Error('Paramètre « methode » invalide : « ouvrables » ou « ouvres » attendu.');
  }
  assertNombre(remunerationBrutePeriode, 'remunerationBrutePeriode', { min: 0, max: 10_000_000 });
  assertNombre(salaireMensuelBrut, 'salaireMensuelBrut', { min: 0, max: 1_000_000 });

  const base = methode === 'ouvrables' ? 30 : 25;
  assertNombre(joursPris, 'joursPris', { min: 0.5, max: base });

  const div = diviseurMaintien ?? (methode === 'ouvrables' ? 26 : 21.67);
  assertNombre(div, 'diviseurMaintien', { min: 1, max: 31 });

  const indemniteDixieme = r2((remunerationBrutePeriode / 10) * (joursPris / base));
  const indemniteMaintien = r2((salaireMensuelBrut / div) * joursPris);
  const plusFavorable = indemniteDixieme >= indemniteMaintien ? 'dixieme' : 'maintien';

  return {
    methode,
    joursPris,
    base,
    diviseurMaintien: div,
    indemniteDixieme,
    indemniteMaintien,
    plusFavorable,
    montantDu: Math.max(indemniteDixieme, indemniteMaintien),
    ecart: r2(Math.abs(indemniteDixieme - indemniteMaintien)),
    note: 'L’employeur doit appliquer le montant le plus favorable au salarié (art. L3141-24).'
  };
}

/* ============================================================
   4. JOURS FÉRIÉS (métropole / Alsace-Moselle)
   ============================================================ */

/** Dimanche de Pâques (algorithme de Meeus/Butcher, calendrier grégorien). */
export function paques(annee) {
  assertNombre(annee, 'annee', { min: 1900, max: 2200, entier: true });
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour));
}

export function joursFeries(annee, zone = 'metropole') {
  if (!['metropole', 'alsace-moselle'].includes(zone)) {
    throw new Error('Paramètre « zone » invalide : « metropole » ou « alsace-moselle » attendu.');
  }
  const P = paques(annee);
  const F = (mois, jour, nom) => ({ date: iso(new Date(Date.UTC(annee, mois - 1, jour))), nom, fixe: true });
  const M = (d, nom) => ({ date: iso(d), nom, fixe: false });

  const liste = [
    F(1, 1, 'Jour de l’an'),
    M(plusJours(P, 1), 'Lundi de Pâques'),
    F(5, 1, 'Fête du Travail'),
    F(5, 8, 'Victoire 1945'),
    M(plusJours(P, 39), 'Ascension'),
    M(plusJours(P, 50), 'Lundi de Pentecôte'),
    F(7, 14, 'Fête nationale'),
    F(8, 15, 'Assomption'),
    F(11, 1, 'Toussaint'),
    F(11, 11, 'Armistice 1918'),
    F(12, 25, 'Noël')
  ];

  if (zone === 'alsace-moselle') {
    liste.push(M(plusJours(P, -2), 'Vendredi saint'), F(12, 26, 'Saint-Étienne'));
  }

  liste.sort((x, y) => x.date.localeCompare(y.date));
  return liste;
}

export function estFerie(dateStr, zone = 'metropole') {
  const d = parseDateISO(dateStr, 'date');
  const trouve = joursFeries(d.getUTCFullYear(), zone).find((j) => j.date === dateStr);
  return trouve ? { ferie: true, ...trouve } : { ferie: false, date: dateStr };
}
