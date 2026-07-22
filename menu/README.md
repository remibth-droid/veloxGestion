# Velox Menu — MVP (sessions 4 à 9)

SaaS de menus digitaux pour restaurants : éditeur de carte, menu du jour, QR code,
FR/EN, filtre allergènes, thèmes, freemium 15 plats / Pro 9 €/mois.

## Fichiers

| Fichier | Rôle |
|---|---|
| `admin.html` | Application restaurateur (auth, carte, menu du jour, QR, Pro) |
| `index.html` | Menu public (`index.html?r=slug-du-resto`) — sans `?r`, redirige vers la landing |
| `vente.html` | Landing de vente (hero, tarifs, FAQ, SEO) — crée un resto « demo » pour le bouton de démo |
| `firebase-config.js` | **À compléter** : colle ton bloc firebaseConfig (cave-2004) |
| `database.rules.json` | Règles de sécurité RTDB **à fusionner** |

## Mise en route (15 min)

1. **Config** : ouvre `firebase-config.js` et colle les valeurs de ton projet
   (console Firebase → Paramètres → Tes applis). Le même bloc que Velox Gestion.
2. **Règles** : console Firebase → Realtime Database → Règles.
   ⚠️ **NE PAS écraser** les règles existantes de Velox Gestion : ajoute les nœuds
   `restaurants`, `slugs`, `users` de `database.rules.json` **dans** ton objet `rules`
   existant, à côté de tes nœuds actuels.
3. **Auth** : vérifie que la connexion E-mail/Mot de passe est activée
   (Authentication → Sign-in method) — déjà le cas sur cave-2004.
4. **Déploiement** : pousse le dossier sur un repo GitHub Pages
   (ex. `menu.veloxgestion.fr` via CNAME, ou `remibth-droid.github.io/velox-menu/`).
5. **Test** : ouvre `admin.html`, crée un compte, crée ton resto, ajoute 2 plats,
   scanne le QR depuis ton téléphone.

## Freemium & paiement

- Gratuit : 15 plats max + mention « Créé avec Velox Menu » sur le menu public.
- Pro : remplace `PAYMENT_LINK` dans `admin.html` par ton Stripe Payment Link
  (ou Lemon Squeezy). **Activation manuelle** au début : à réception du paiement,
  passe `restaurants/<id>/profil/pro` à `true` dans la console RTDB.
  (Plus tard : webhook Stripe → Cloudflare Worker pour automatiser.)

## Notes techniques

- La limite de 15 plats est appliquée côté client (suffisant en MVP ; un tricheur
  motivé n'y gagne que des plats, pas ton argent).
- Compteur de scans : écriture publique limitée au nœud `stats/scans/<date>`,
  validée comme nombre — pas d'accès au reste.
- Le slug est immuable en v1 (le QR imprimé ne doit jamais casser).
- Photos des plats, multi-établissements, export PDF : voir V2 du cahier des charges.
