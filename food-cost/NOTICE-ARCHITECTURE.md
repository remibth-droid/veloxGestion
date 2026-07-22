# Suite Velox — architecture Firebase (à lire une fois)

Ces apps sont branchées sur ton projet Firebase existant (cave-2004) et
cohabitent avec Velox Gestion **sans rien casser**.

## Les règles de sécurité — UNE SEULE FOIS

Chaque dossier contient le MÊME fichier `database.rules.json` : c'est le
**fichier maître fusionné**. Il reprend l'intégralité de tes règles Velox
Gestion actuelles + ajoute les nœuds de la suite. Tu le colles **une seule
fois** dans la console (Realtime Database → Règles → tout remplacer par ce
fichier → Publier). Comme il contient déjà tes règles existantes, tu ne perds
rien.

⚠️ Vérifie juste, après avoir collé, que tes fonctionnalités Velox Gestion
marchent encore (connexion, cave, ventes). Si tu avais modifié tes règles
depuis la copie que tu m'as donnée, redonne-moi la version à jour.

## Où vivent les données

- **Privé** (lisible par le patron connecté, ou son employé lié) :
  `users/{uid}/velox_menu_admin`, `velox_resa_admin`, `velox_avis_admin`,
  `velox_cout`, `velox_planning`.
- **Public** (lisible par les clients sans compte — obligatoire pour les
  menus/résa scannés) : `vitrines/{uid}/...` et `slugs/{slug}` → uid.
  Zéro donnée sensible : ni téléphone client, ni retour privé, ni chiffre
  d'affaires n'y figurent.
- **Boîtes de dépôt** : `resaDemandes/{uid}` et `avisPrives/{uid}` — le client
  y ÉCRIT sa demande, seul le patron les LIT.

## Un seul compte pour tout

Le compte du patron EST le restaurant (restoId = uid). Tu crées ton resto une
fois dans Velox Menu (admin), et Résa, Avis, Food-Cost, Planning s'y branchent
automatiquement avec le même identifiant. Le slug public (ex. "chez-marcel")
pointe vers ton uid.

## Déploiement (rappel)

Chaque dossier va dans un sous-dossier du repo veloxgestion, comme /utils/ :
/menu/, /resa/, /avis/, /food-cost/, /planning/. Renomme le dossier
velox-XXX en XXX avant de le glisser dans GitHub.
