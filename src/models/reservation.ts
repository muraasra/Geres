export interface Reservation {
  id: number;
  roomId: number;
  userName: string;
  date: string; // Format : YYYY-MM-DD
  startTime: string; // Format : HH:MM
  endTime: string; // Format : HH:MM
  createdAt: string; // Chaîne ISO
}

// Fonctions de validation
export async function isValidReservation(reservation: Reservation): Promise<boolean> {
  try {
      // 1️⃣ Vérifier que tous les champs requis existent
      if (!reservation.roomId || !reservation.userName || !reservation.date || 
          !reservation.startTime || !reservation.endTime) {
          alert("⛔ Tous les champs sont obligatoires !");
          return false;
      }

      // 2️⃣ Vérifier que l'heure de début est avant l'heure de fin
      const startDateTime = new Date(`${reservation.date}T${reservation.startTime}`);
      const endDateTime = new Date(`${reservation.date}T${reservation.endTime}`);
      if (startDateTime >= endDateTime) {
          alert("⛔ L'heure de début doit être avant l'heure de fin !");
          return false;
      }

      // 3️⃣ Vérifier que la date n'est pas dans le passé
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reservationDate = new Date(reservation.date);
      reservationDate.setHours(0, 0, 0, 0);
      if (reservationDate < today) {
          alert("⛔ Impossible de réserver une date passée !");
          return false;
      }

      // 4️⃣ Vérifier si une réservation existe exactement au même créneau
      const response = await fetch('http://localhost:5001/reservations');
      if (!response.ok) throw new Error('Erreur lors de la récupération des réservations.');

      const existingReservations: Reservation[] = await response.json();

      const conflict = existingReservations.some(r =>
          r.roomId === reservation.roomId &&
          r.date === reservation.date &&
          r.startTime === reservation.startTime && // Vérification stricte
          r.endTime === reservation.endTime        // Vérification stricte
      );

      if (conflict) {
          alert("⛔ Ce créneau est déjà pris ! Choisissez une autre heure.");
          return false;
      }

      return true; // ✅ La réservation est valide
  } catch (error) {
      alert(`❌ Une erreur est survenue lors de la vérification de la réservation car la salle est deja prise par moi !!!`);
      console.error('❌ Erreur lors de la vérification de la réservation:', error);
      return false;
  }
}




export function hasConflict(
  reservations: Reservation[], 
  newReservation: Reservation
): boolean {
  // Ignore la comparaison avec elle-même (pour l'édition)
  const existingReservations = reservations.filter(r => r.id !== newReservation.id);
  
  return existingReservations.some(existing => {
    // Vérifie uniquement les réservations pour la même salle et la même date
    if (existing.roomId !== newReservation.roomId || existing.date !== newReservation.date) {
      return false;
    }
    
    // Analyse les heures en tant qu'objets Date pour une comparaison plus facile
    const existingStart = new Date(`${existing.date}T${existing.startTime}`);
    const existingEnd = new Date(`${existing.date}T${existing.endTime}`);
    const newStart = new Date(`${newReservation.date}T${newReservation.startTime}`);
    const newEnd = new Date(`${newReservation.date}T${newReservation.endTime}`);
    
    // Vérifie les chevauchements
    // Cas 1 : La nouvelle réservation commence pendant une réservation existante
    // Cas 2 : La nouvelle réservation se termine pendant une réservation existante
    // Cas 3 : La nouvelle réservation contient complètement une réservation existante
    // Cas 4 : La nouvelle réservation est complètement contenue dans une réservation existante
    return (
      (newStart >= existingStart && newStart < existingEnd) || 
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd) ||
      (newStart >= existingStart && newEnd <= existingEnd)
    );
  });
}

// Fonction pour générer un ID unique pour les nouvelles réservations
export function generateReservationId(existingReservations: Reservation[]): number {
  if (existingReservations.length === 0) {
    return 1;
  }
  return Math.max(...existingReservations.map(r => r.id)) + 1;
}

// Fonction pour créer une nouvelle réservation
export function createReservation(
  roomId: number,
  userName: string,
  date: string,
  startTime: string,
  endTime: string,
  existingReservations: Reservation[]
): Reservation {
  const newReservation: Reservation = {
    id: generateReservationId(existingReservations),
    roomId,
    userName,
    date,
    startTime,
    endTime,
    createdAt: new Date().toISOString()
  };
  
  if (!isValidReservation(newReservation)) {
    throw new Error("Données de réservation invalides");
  }
  
  if (hasConflict(existingReservations, newReservation)) {
    throw new Error("Cette réservation entre en conflit avec une réservation existante");
  }
  
  return newReservation;
}