# Velox Utils — 6 outils gratuits en une page

Une seule page `index.html`, zéro dépendance serveur, zéro donnée transmise (tout est
client-side). Couvre les idées utilitaires 3, 4, 8, 9, 14 et 15 de la liste initiale.

| Outil | Détail |
|---|---|
| **Facture** | Générateur pour micro-entrepreneurs : mentions légales auto (art. 293 B, indemnité 40 €, pénalités), multi-lignes, TVA 0/5,5/10/20 %, impression PDF navigateur |
| **QR code** | Couleurs personnalisées + logo au centre (correction d'erreur H), export PNG jusqu'à 1024 px |
| **Images WebP** | Compression locale avec curseur de qualité et % de gain affiché |
| **Cuisine** | Poids/volume/température (dont thermostat) + cups → grammes par ingrédient |
| **Palette** | Nuances, analogues, complémentaire/triadique depuis une couleur — clic pour copier |
| **Mots de passe** | Caractères aléatoires ou phrase de passe en mots français, entropie affichée, crypto.getRandomValues |

## Déployer

Pousser le dossier sur GitHub Pages (ex. `utils.veloxgestion.fr` ou un sous-dossier du site
principal). Aucune configuration : la page fonctionne telle quelle en ligne.

## Monétisation

C'est un **aimant à trafic SEO** (« facture auto entrepreneur gratuite », « générateur QR code
logo », « convertisseur cups grammes »…) : chaque outil porte le bandeau Velox qui renvoie
vers la suite payante. Options V2 : encart discret de parrainage, ou version « Pro » de la
facture (numérotation automatique + historique via Firebase).

## Note produit

Le minificateur CSS/JS (idée 12) a été volontairement écarté : un minificateur naïf casse
du code réel, et en faire un fiable = embarquer terser/csso, contraire au zéro-build.
