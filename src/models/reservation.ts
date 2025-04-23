export interface Reservation {
  id: number;
  roomId: number;
  userName: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM
  endTime: string; // Format: HH:MM
  createdAt: string; // ISO string
}

// Validation functions
export function isValidReservation(reservation: Reservation): boolean {
  // Check if all required fields exist
  if (!reservation.roomId || !reservation.userName || !reservation.date || 
      !reservation.startTime || !reservation.endTime) {
    return false;
  }

  // Check if start time is before end time
  const startDateTime = new Date(`${reservation.date}T${reservation.startTime}`);
  const endDateTime = new Date(`${reservation.date}T${reservation.endTime}`);
  if (startDateTime >= endDateTime) {
    return false;
  }

  // Check if date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reservationDate = new Date(reservation.date);
  reservationDate.setHours(0, 0, 0, 0);
  if (reservationDate < today) {
    return false;
  }

  return true;
}

export function hasConflict(
  reservations: Reservation[], 
  newReservation: Reservation
): boolean {
  // Skip comparing with itself (for editing)
  const existingReservations = reservations.filter(r => r.id !== newReservation.id);
  
  return existingReservations.some(existing => {
    // Only check reservations for the same room and date
    if (existing.roomId !== newReservation.roomId || existing.date !== newReservation.date) {
      return false;
    }
    
    // Parse times as Date objects for easier comparison
    const existingStart = new Date(`${existing.date}T${existing.startTime}`);
    const existingEnd = new Date(`${existing.date}T${existing.endTime}`);
    const newStart = new Date(`${newReservation.date}T${newReservation.startTime}`);
    const newEnd = new Date(`${newReservation.date}T${newReservation.endTime}`);
    
    // Check for overlap
    // Case 1: New reservation starts during an existing reservation
    // Case 2: New reservation ends during an existing reservation
    // Case 3: New reservation completely contains an existing reservation
    // Case 4: New reservation is completely contained within an existing reservation
    return (
      (newStart >= existingStart && newStart < existingEnd) || 
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd) ||
      (newStart >= existingStart && newEnd <= existingEnd)
    );
  });
}

// Function to generate a unique ID for new reservations
export function generateReservationId(existingReservations: Reservation[]): number {
  if (existingReservations.length === 0) {
    return 1;
  }
  return Math.max(...existingReservations.map(r => r.id)) + 1;
}

// Function to create a new reservation
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
    throw new Error("Invalid reservation data");
  }
  
  if (hasConflict(existingReservations, newReservation)) {
    throw new Error("This reservation conflicts with an existing booking");
  }
  
  return newReservation;
}