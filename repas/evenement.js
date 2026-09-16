// Réglages de la soirée : titre, date, lieu, boissons et affiche.
// config.js ne sert plus qu'à la connexion Firebase : n'y touche pas.

export const repas = {
  titre: "Cacamaillère de Margoat",
  date: "Dimanche 20 septembre",
  heure: "à partir de 19 h 30",
  lieu: "2 place Champgil",
  invitesAttendus: 10,
  boissons: ["Cocktail fraise", "Rosé", "Bière", "Vin rouge", "Champagne", "Soft", "Eau pétillante"],
};

// L'affiche que reçoivent les invités, avec leur QR code posé dans le cadre pointillé.
export const affiche = {
  image: "affiche.jpg",
  // Centre du QR (en % de la largeur et de la hauteur), taille (en % de la largeur) et couleurs
  qr: { x: 51.33, y: 58.76, taille: 36, couleur: "#3B3230", fond: "#FFFBF2" },
};
