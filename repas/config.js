// Réglages du repas : c'est le seul fichier à modifier.
 
// 1) Colle ici la config Firebase de tes apps Velox (projet cave-2004).
export const firebaseConfig = {
  apiKey: "AIzaSyC8OgrDoj-D5tpWDlIK7EmEiIM0_Bwuhig",
  authDomain: "cave-2004.firebaseapp.com",
  databaseURL: "https://cave-2004.firebaseapp.com",
  projectId: "cave-2004",
  appId: "1:142269678134:web:48805cde3f78a65531ce97",
};
 
// 2) Ce qui s'affiche sur le site (laisse "" pour ne rien afficher).
export const repas = {
  titre: "Repas entre amis",
  quand: "",   // ex. "Samedi 26 septembre, à partir de 19 h 30"
  ou: "",      // ex. "Chez moi, 3e étage"
  invitesAttendus: 4,
  boissons: ["Coca", "Ice tea", "Jus d’orange", "Eau pétillante", "Bière", "Vin rouge", "Vin blanc"],
};
 
// 3) L'affiche que reçoivent les invités, avec leur QR code posé dessus.
//    Mets l'image dans le même dossier que le site.
//    Tant qu'elle n'y est pas, le site crée une invitation simple à la place.
export const affiche = {
  image: "affiche.png",
  // Centre du QR code (en % de la largeur et de la hauteur) et sa taille (en % de la largeur)
  qr: { x: 50, y: 80, taille: 28 },
};
