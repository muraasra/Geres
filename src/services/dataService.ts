import { Room, roomsData } from '../data/rooms';
import { Reservation } from '../models/reservation';

// Local Storage Keys
const RESERVATIONS_KEY = 'room_reservations';
const USER_NAME_KEY = 'user_name';

// Functions to interact with localStorage for reservations
export function loadReservations(): Reservation[] {
  const storedData = localStorage.getItem(RESERVATIONS_KEY);
  if (!storedData) {
    return [];
  }
  
  try {
    return JSON.parse(storedData) as Reservation[];
  } catch (error) {
    console.error('Failed to parse reservations from localStorage:', error);
    return [];
  }
}

export function saveReservations(reservations: Reservation[]): void {
  try {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  } catch (error) {
    console.error('Failed to save reservations to localStorage:', error);
  }
}
export async function addReservation(reservation: Omit<Reservation, 'id'>): Promise<Reservation | null> {
  try {
      // 1️⃣ Récupérer toutes les réservations existantes
      const existingReservationsResponse = await fetch('http://localhost:5001/reservations');
      if (!existingReservationsResponse.ok) throw new Error('Erreur lors de la récupération des réservations.');

      const existingReservations: Reservation[] = await existingReservationsResponse.json();

      // 2️⃣ Vérifier si une réservation existe déjà pour le même créneau
      const conflict = existingReservations.some(r =>
          r.roomId === reservation.roomId &&
          r.date === reservation.date &&
          timeToMinutes(r.startTime) < timeToMinutes(reservation.endTime) &&
          timeToMinutes(r.endTime) > timeToMinutes(reservation.startTime)
      );

      if (conflict) {
          alert("⛔ Cette salle est déjà réservée pour ce créneau. Veuillez choisir un autre horaire.");
          return null; // Annule la réservation
      }

      // 3️⃣ Envoi de la réservation à `json-server` pour sauvegarde
      const response = await fetch('http://localhost:5001/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservation),
      });

      if (!response.ok) {
          throw new Error(`Erreur lors de la sauvegarde: ${response.statusText}`);
      }

      // 4️⃣ Récupération de la réservation confirmée par le serveur
      const savedReservation = await response.json();

      // 5️⃣ Ajout de la réservation dans `localStorage`
      saveReservationLocally(savedReservation);

      return savedReservation;
  } catch (error) {
      alert(`❌ Une erreur est survenue lors de l'ajout de la réservation car une reservation existe deja un creneau`);
      console.error('❌ Erreur lors de l’ajout de la réservation:', error);
      return null;
  }
}


// ✅ Fonction utilitaire pour convertir une heure en minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// ✅ Fonction pour sauvegarder la réservation dans `localStorage`
function saveReservationLocally(reservation: Reservation): void {
  try {
      const storedData = localStorage.getItem('reservations');
      const reservations: Reservation[] = storedData ? JSON.parse(storedData) : [];
      reservations.push(reservation);

      localStorage.setItem('reservations', JSON.stringify(reservations));
      console.log('✅ Réservation ajoutée à localStorage.');
  } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde dans localStorage:', error);
  }
}


// ✅ Fonction pour sauvegarder la réservation dans `localStorage`




export async function updateReservation(updatedReservation: Reservation): Promise<void> {
  try {
      const response = await fetch(`http://localhost:5001/reservations/${updatedReservation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error(`Erreur lors de la mise à jour: ${response.statusText}`);
  } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la réservation:', error);
  }
}

export async function deleteReservation(id: number): Promise<void> {
  try {
      const response = await fetch(`http://localhost:5001/reservations/${id}`, {
          method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Erreur lors de la suppression: ${response.statusText}`);

      console.log(`✅ Réservation ${id} supprimée avec succès.`);
  } catch (error) {
      console.error('❌ Erreur lors de la suppression de la réservation:', error);
  }
}


// Functions for user name persistence
export function saveUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name);
}

export function getUserName(): string {
  return localStorage.getItem(USER_NAME_KEY) || '';
}

// Functions for filtering rooms
export function filterRooms(
  rooms: Room[], 
  minCapacity: number = 0, 
  date: string | null = null, 
  selectedEquipmentIds: number[] = []
): Room[] {
  // Apply capacity filter
  let filtered = rooms.filter(room => room.capacity >= minCapacity);
  
  // Apply equipment filter if any equipment is selected
  if (selectedEquipmentIds.length > 0) {
    filtered = filtered.filter(room => 
      selectedEquipmentIds.every(equipId => room.equipmentIds.includes(equipId))
    );
  }
  
  // Apply date filter to check availability
  if (date) {
    const reservations = loadReservations();
    const reservationsOnDate = reservations.filter(r => r.date === date);
    
    // Rooms with all-day booking should be excluded
    const fullyBookedRoomIds = new Set<number>();
    
    // Check each room to see if it has availability on this date
    filtered = filtered.filter(room => {
      // If room is already identified as fully booked, exclude it
      if (fullyBookedRoomIds.has(room.id)) {
        return false;
      }
      
      // If there are no reservations for this room on this date, include it
      const roomReservations = reservationsOnDate.filter(r => r.roomId === room.id);
      if (roomReservations.length === 0) {
        return true;
      }
      
      // Check if there's at least one time slot available
      // This is a simplified check - a more complete version would check specific time slots
      const isFullyBooked = roomReservations.some(r => 
        r.startTime === '08:00' && r.endTime === '18:00'
      );
      
      if (isFullyBooked) {
        fullyBookedRoomIds.add(room.id);
        return false;
      }
      
      return true;
    });
  }
  
  return filtered;
}

// Function to get reservations for a specific room
export async function getReservationsForRoom(roomId: number): Promise<Reservation[]> {
  try {
      const response = await fetch('http://localhost:5001/reservations');
      if (!response.ok) throw new Error('Erreur lors de la récupération des réservations.');

      const reservations: Reservation[] = await response.json();
      return reservations.filter(r => r.roomId === roomId);
  } catch (error) {
      console.error('❌ Erreur lors de la récupération des réservations:', error);
      return [];
  }
}


// Function to get reservations for a specific date
export async function getReservationsForDate(date: string): Promise<Reservation[]> {
  try {
      const response = await fetch('http://localhost:5001/reservations');
      if (!response.ok) throw new Error('Erreur lors de la récupération des réservations.');

      const reservations: Reservation[] = await response.json();
      return reservations.filter(r => r.date === date);
  } catch (error) {
      console.error('❌ Erreur lors de la récupération des réservations:', error);
      return [];
  }
}


// Function to initialize sample data if needed
export function initializeData(): void {
  // Check if reservations already exist
  const existingReservations = loadReservations();
  
  // Only initialize if no data exists
  if (existingReservations.length === 0) {
    // Create some sample reservations
    const sampleReservations: Reservation[] = [
      {
        id: 1,
        roomId: 1,
        userName: "Jean Dupont",
        date: "2025-03-15",
        startTime: "09:00",
        endTime: "11:00",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        roomId: 2,
        userName: "Marie Martin",
        date: "2025-03-15",
        startTime: "14:00",
        endTime: "16:00",
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        roomId: 3,
        userName: "Pierre Leclerc",
        date: "2025-03-16",
        startTime: "10:00",
        endTime: "12:00",
        createdAt: new Date().toISOString()
      }
    ];
    
    saveReservations(sampleReservations);
  }
}