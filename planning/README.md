# Velox Planning — planning d'équipe & heures sup (utilitaire 20 de la liste)

Grille hebdomadaire pour l'équipe d'un restaurant, avec le calcul des heures
supplémentaires **directement sur le planning** grâce au moteur Velox Paie
(`paie-engine.js`, 23/23 tests, conventions HCR et légale).

## Fichiers

| Fichier | Rôle |
|---|---|
| `app.html` | Application complète : Planning / Équipe / Récap paie |
| `paie-engine.js` | Moteur de calcul partagé avec Velox Paie API (copie identique) |
| `firebase-config.js` | **À compléter** (même bloc que les autres apps Velox) |
| `database.rules.json` | Nœud `planning` **à fusionner** dans tes règles existantes |

## Mise en route

1. Colle ton `firebaseConfig`, fusionne le nœud `planning` dans les règles
   (à côté de `restaurants`, `foodcost`, `resaDemandes`… — ne rien écraser).
2. Déploie sur GitHub Pages, connecte-toi (même compte que les autres outils).
3. Onglet **Équipe** : nom de l'établissement (pour l'impression), convention
   (HCR par défaut), puis tes membres avec leur contrat 35/37/39 h et, si tu veux
   le chiffrage en euros, leur taux horaire brut.
4. Onglet **Planning** : « + » dans une case pour créer un service, clic sur un
   créneau pour le modifier. Un service 18:30 → 00:30 est géré (fin après minuit).

## Ce que fait le moteur sur la grille

- Total hebdo par employé, pauses non payées déduites.
- Badge automatique : heures sup incluses au contrat (vert), heures **hors contrat
  à payer** (orange), dépassement des 48 h légales (rouge).
- Onglet **Récap paie** : ventilation par tranche de majoration (10/20/50 % en HCR),
  équivalent heures payées, et brut estimé des heures sup à payer si le taux horaire
  est renseigné. Indicatif — ne remplace pas le logiciel de paie.
- « Copier la semaine précédente » : le planning type se duplique en un clic.
- 🖨 Impression A4 paysage propre pour l'affichage en salle/cuisine.

## Limites v1

- Pas d'espace salarié (lecture seule) ni de gestion des absences/CP — V2.
- Récap à la semaine (les mois à cheval se lisent semaine par semaine).

## Monétisation

Vendu seul 9 €/mois, ou futur bundle « Velox Équipe » avec la Paie API.
Argument de vente : « votre planning connaît la convention HCR — plus d'erreur
de majoration entre la 39ᵉ et la 44ᵉ heure. »
