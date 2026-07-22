# Velox Avis — entonnoir d'avis clients (site 13 de la liste)

Le client scanne le QR avec l'addition, note son repas d'un tap. Note haute → grand bouton
« Laisser un avis Google » ; note basse → formulaire privé lu uniquement par le patron.
**Les deux chemins restent toujours accessibles quelle que soit la note** : seul l'accent
change. C'est volontaire — le « filtrage » pur (cacher Google aux mécontents) est interdit
par les règles Google sur les avis et peut faire supprimer vos avis. Cette version obtient
le même effet, proprement.

## Fichiers

| Fichier | Rôle |
|---|---|
| `avis.html` | Page publique (`avis.html?r=slug`) : étoiles → aiguillage adaptatif |
| `admin.html` | Retours privés (à traiter/traité), stats des notes, réglages + QR chevalet A6 |
| `firebase-config.js` | **À compléter** (même bloc que les autres apps Velox) |
| `database.rules.json` | **Jeu complet consolidé de toute la suite Velox** — voir ci-dessous |

## Règles de sécurité — fichier maître

Ce `database.rules.json` regroupe désormais **tous** les nœuds de la suite :
`restaurants` (menu + résa + avis), `resaDemandes`, `avisPrives`, `foodcost`, `planning`,
`slugs`, `users`. Colle-le une fois dans la console **en conservant à côté tes nœuds
Velox Gestion existants**. C'est le fichier de référence à partir de maintenant.

Points de sécurité : les retours privés (`avisPrives`) sont en **création publique,
lecture réservée au restaurateur** — jamais visibles en ligne. Les compteurs d'étoiles
(`avis/stats`) sont anonymes et agrégés (aucun texte, aucun contact).

## Mise en route

1. `firebase-config.js` + règles maîtres (voir ci-dessus), déploiement GitHub Pages.
2. `admin.html` → Réglages : coche « activée », colle ton lien Google
   (fiche Google Business → « Demander des avis » → lien court), enregistre.
3. Imprime le chevalet A6 et pose-le près de la caisse — ou glisse le QR avec l'addition,
   c'est le moment où le taux de scan est le plus haut.

## Ce que tu vois côté admin

- **Retours** : chaque message privé avec note, date, contact cliquable, statut
  À traiter / Traité (pastille orange sur l'onglet).
- **Stats** : nombre de notes, moyenne, % de 4-5★, répartition en barres — chaque tap
  d'étoile compte, même sans message ensuite.

## Monétisation

Add-on naturel de Velox Menu (inclus dans Pro, ou +4 €/mois seul). Phrase de vente :
« Les clients mécontents vous le disent à vous d'abord — et les contents le disent à Google. »

## Limites v1

Pas de notification (consultez la pastille) ; anti-spam basique côté règles. V2 : alerte
mail via Worker, réponse au client depuis l'admin.
