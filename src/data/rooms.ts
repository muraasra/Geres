// data.ts
import equipmentData from './equipement.json';
import importedRoomsData from './rooms.json';

// Define types for our data
export interface Equipment {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  equipmentIds: number[];
  image: string;
  description: string;
  pricePerHour: number;
}

// Type assertion for our imported JSON data
export const equipmentList: Equipment[] = equipmentData;
export const roomsData: Room[] = importedRoomsData["rooms"].map((room: any) => ({
  ...room,
  id: typeof room.id === 'string' ? parseInt(room.id, 10) : room.id,
}));

// Helper function to get equipment name by ID
export function getEquipmentById(id: number): Equipment | undefined {
  return equipmentList.find(item => item.id === id);
}

// Helper function to get equipment names for a room
export function getRoomEquipment(room: Room): Equipment[] {
  return room.equipmentIds.map(id => {
    const equipment = getEquipmentById(id);
    if (!equipment) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    return equipment;
  });
}

// Helper function to get a room by ID
export function getRoomById(id: number): Room | undefined {
  return roomsData.find(room => room.id === id);
}

// Function to add a new room
export async function addRoom(room: Omit<Room, 'id'>): Promise<Room> {
  try {
      const response = await fetch('http://localhost:5000/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(room),
      });

      if (!response.ok) {
          throw new Error(`Erreur lors de la sauvegarde: ${response.statusText}`);
      }

      return await response.json();
  } catch (error) {
      console.error('❌ Erreur lors de l’ajout de la salle:', error);
      throw error;
  }
}


// Function to calculate total price for a booking
export function calculatePrice(room: Room, startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return room.pricePerHour * hours;
}