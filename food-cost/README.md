# Velox Food Cost — MVP (sessions 10 à 15)

Fiches techniques et coût matière pour restaurants indépendants : mercuriale avec
rendements, calcul du food cost %, prix de vente conseillé, dashboard de rentabilité,
alertes de hausse de prix, impression de fiches pro.

## Fichiers

| Fichier | Rôle |
|---|---|
| `app.html` | Application complète (auth, mercuriale, fiches, dashboard) |
| `index.html` | Landing de vente (page d'accueil du produit) |
| `firebase-config.js` | **À compléter** : colle ton bloc firebaseConfig (cave-2004) |
| `database.rules.json` | Règle de sécurité RTDB **à fusionner** |

## Mise en route (10 min)

1. **Config** : colle tes valeurs Firebase dans `firebase-config.js` (mêmes que Velox Gestion).
2. **Règles** : console Firebase → Realtime Database → Règles.
   ⚠️ **NE PAS écraser** l'existant : ajoute le nœud `foodcost` de `database.rules.json`
   **dans** ton objet `rules` actuel, à côté des nœuds de Velox Gestion / Velox Menu.
3. **Déploiement** : pousse le dossier sur GitHub Pages, ouvre `app.html`, crée un compte.
4. **Premier test réel** : saisis 5 ingrédients de ta cuisine + 1 plat que tu connais bien,
   et compare le food cost calculé à ton intuition. C'est ton produit : éprouve-le au travail.

## Logique de calcul (embarquée)

- Prix net d'un ingrédient = prix d'achat ÷ rendement (0,80 = 20 % de perte à l'épluchage).
- Coût matière/portion = Σ (quantité × prix net) ÷ portions produites.
- Prix HT = prix TTC ÷ (1 + TVA) — taux gérés : 5,5 / 10 / 20 %.
- Food cost % = coût portion ÷ prix HT. Code couleur : ≤ 30 % vert, 30–35 % orange, > 35 % rouge.
- Prix conseillé TTC = (coût portion ÷ ratio cible) × (1 + TVA).
- Alertes : déclenchées quand le dernier prix saisi d'un ingrédient dépasse le précédent de +10 %,
  avec le nombre de fiches impactées.
- Allergènes des fiches : hérités automatiquement des ingrédients.

## Monétisation

Essai 14 jours puis **15 €/mois** (ou 150 €/an) — activation manuelle au début, comme
Velox Menu : Stripe Payment Link + flag dans la base. Bundle « Velox Resto » 19 €/mois
avec Velox Menu pour l'upsell croisé.

## Notes v1

- Impression des fiches : mise en page print du navigateur (propre et sans dépendance).
  Export PDF direct (jsPDF) prévu en V2 si besoin.
- L'historique de prix se remplit à chaque modification du prix d'achat d'un ingrédient.
- V2 : photos, mercuriale partagée multi-utilisateurs, import CSV fournisseurs.
