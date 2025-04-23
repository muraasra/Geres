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

// Create a list of possible equipment
export const equipmentList: Equipment[] = [
  { id: 1, name: "Projecteur" },
  { id: 2, name: "Tableau blanc" },
  { id: 3, name: "Écran TV" },
  { id: 4, name: "Système de visioconférence" },
  { id: 5, name: "WiFi haut débit" },
  { id: 6, name: "Climatisation" },
  { id: 7, name: "Tables modulables" },
  { id: 8, name: "Paperboard" }
];

// Create sample room data
export const roomsData: Room[] = [
  {
    id: 1,
    name: "Salle Alpha",
    capacity: 20,
    equipmentIds: [1, 2, 5, 6],
    image: "https://images.pexels.com/photos/416320/pexels-photo-416320.jpeg",
    description: "Grande salle lumineuse idéale pour les réunions d'équipe ou les présentations clients.",
    pricePerHour: 5000
  },
  {
    id: 2,
    name: "Salle Bêta",
    capacity: 8,
    equipmentIds: [2, 5, 8],
    image: "https://images.pexels.com/photos/260928/pexels-photo-260928.jpeg",
    description: "Salle de taille moyenne parfaite pour les réunions intimes ou les entretiens.",
    pricePerHour: 30000
  },
  {
    id: 3,
    name: "Salle Gamma",
    capacity: 30,
    equipmentIds: [1, 3, 4, 5, 6, 7],
    image: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg",
    description: "Notre plus grande salle, équipée de technologies de pointe pour des conférences et formations.",
    pricePerHour: 8000
  },
  {
    id: 4,
    name: "Salle Delta",
    capacity: 6,
    equipmentIds: [5, 6],
    image: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg",
    description: "Petite salle confortable pour des réunions de travail ou des appels privés.",
    pricePerHour: 25000
  },
  {
    id: 5,
    name: "Salle Epsilon",
    capacity: 12,
    equipmentIds: [1, 2, 4, 5, 8],
    image: "https://images.pexels.com/photos/1181395/pexels-photo-1181395.jpeg",
    description: "Salle polyvalente équipée pour les présentations et les ateliers créatifs.",
    pricePerHour: 4500
  },
  {
    id: 6,
    name: "Salle Zêta",
    capacity: 15,
    equipmentIds: [1, 2, 3, 5, 6],
    image: "https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg",
    description: "Espace moderne et épuré pour des réunions professionnelles efficaces.",
    pricePerHour: 55000
  }
];

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
export function addRoom(room: Omit<Room, 'id'>): Room {
  const newRoom: Room = {
    ...room,
    id: Math.max(...roomsData.map(r => r.id)) + 1
  };
  roomsData.push(newRoom);
  return newRoom;
}

// Function to calculate total price for a booking
export function calculatePrice(room: Room, startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return room.pricePerHour * hours;
}