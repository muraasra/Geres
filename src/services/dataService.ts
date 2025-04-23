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

export function addReservation(reservation: Reservation): void {
  const reservations = loadReservations();
  reservations.push(reservation);
  saveReservations(reservations);
}

export function updateReservation(updatedReservation: Reservation): void {
  const reservations = loadReservations();
  const index = reservations.findIndex(r => r.id === updatedReservation.id);
  
  if (index !== -1) {
    reservations[index] = updatedReservation;
    saveReservations(reservations);
  }
}

export function deleteReservation(id: number): void {
  const reservations = loadReservations();
  const filteredReservations = reservations.filter(r => r.id !== id);
  
  if (filteredReservations.length < reservations.length) {
    saveReservations(filteredReservations);
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
export function getReservationsForRoom(roomId: number): Reservation[] {
  const reservations = loadReservations();
  return reservations.filter(r => r.roomId === roomId);
}

// Function to get reservations for a specific date
export function getReservationsForDate(date: string): Reservation[] {
  const reservations = loadReservations();
  return reservations.filter(r => r.date === date);
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