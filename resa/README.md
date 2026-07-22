# Velox Résa — réservations sans commission (site 2 de la liste)

Réservation en ligne pour petits restos, branchée sur l'écosystème Velox Menu :
même compte, même restaurant, même projet Firebase. Zéro commission par couvert.

## Fichiers

| Fichier | Rôle |
|---|---|
| `admin.html` | Demandes du jour (confirmer/refuser/annuler), agenda, réglages des services |
| `reserver.html` | Parcours client : date → service → couverts → créneau → coordonnées |
| `firebase-config.js` | **À compléter** (même bloc que Velox Menu) |
| `database.rules.json` | Règles **complètes** menu + résa — remplace celles de Velox Menu |

## Mise en route

1. Colle ton `firebaseConfig` dans `firebase-config.js`.
2. **Règles** : ce fichier est le successeur de celui de Velox Menu (il ajoute `resaDemandes`
   et les compteurs). Fusionne UNE fois ce jeu complet dans la console, à côté des nœuds
   Velox Gestion / foodcost. Point important : les coordonnées clients (`resaDemandes`)
   sont **création publique, lecture réservée au restaurateur** — jamais lisibles en ligne.
3. Déploie le dossier (GitHub Pages). Ouvre `admin.html` avec ton compte Velox Menu,
   onglet Réglages : capacités, horaires des deux services, jours fermés → **Enregistrer**
   avec « Réservations activées » coché.
4. Le bouton « 🗓 Réserver » apparaît automatiquement sur ton menu public
   (velox-menu/index.html mis à jour dans son zip — redéploie-le aussi).

## Comment ça marche

- Capacité par **service** (midi/soir) : un compteur public de couverts par date/service
  permet d'afficher « complet » sans jamais exposer les réservations elles-mêmes.
- Confirmation automatique (défaut) ou validation manuelle de chaque demande.
- Refuser/annuler libère les couverts du compteur.
- Délai minimum paramétrable (ex. pas de résa en ligne moins de 2 h avant).

## Limites v1 (assumées et documentées)

- Pas de notification : le restaurateur consulte l'admin (pastille orange = demandes en
  attente). V2 : mail/SMS via un petit Worker.
- Compteur incrémenté côté client : une collision de dernière seconde reste possible sur
  un service presque plein — le parcours revérifie juste avant l'envoi, et le restaurateur
  garde la main (annulation + rappel du client). Suffisant pour un indépendant.
- Anti-spam basique (validation de structure côté règles). V2 : rate limiting via Worker.

## Monétisation

Inclus dans **Velox Menu Pro (9 €/mois)** comme argument massue face aux plateformes à
commission — ou vendu seul au même prix. Phrase de vente : « TheFork vous prend 2 € par
couvert ; ici c'est 9 € par mois, point. »
