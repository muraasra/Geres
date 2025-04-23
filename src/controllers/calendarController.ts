import { Room, roomsData, getRoomById } from '../data/rooms';
import { Reservation } from '../models/reservation';
import { loadReservations } from '../services/dataService';
import { 
  getWeekDates, 
  formatWeekRange, 
  getDayName, 
  formatDate, 
  addDays,
  calculateTimePercentage,
  calculateDurationPercentage
} from '../utils/dateUtils';
import { openBookingModal } from './modalController';

// DOM Elements
let calendarGridElement: HTMLElement;
let roomSelectorElement: HTMLSelectElement;
let currentWeekDisplayElement: HTMLElement;
let prevWeekButton: HTMLButtonElement;
let nextWeekButton: HTMLButtonElement;

// State
let currentWeekStart: Date;
let weekDates: Date[];
let selectedRoomId: number | null = null;

// Initialize the calendar controller
export function initCalendarController(): void {
  // Cache DOM elements
  calendarGridElement = document.getElementById('calendarGrid') as HTMLElement;
  roomSelectorElement = document.getElementById('roomSelector') as HTMLSelectElement;
  currentWeekDisplayElement = document.getElementById('currentWeekDisplay') as HTMLElement;
  prevWeekButton = document.getElementById('prevWeek') as HTMLButtonElement;
  nextWeekButton = document.getElementById('nextWeek') as HTMLButtonElement;
  
  // Set initial state - current week
  currentWeekStart = new Date();
  weekDates = getWeekDates(currentWeekStart);
  
  // Initialize room selector
  initializeRoomSelector();
  
  // Event listeners
  setupEventListeners();
  
  // Render the calendar for the current week
  renderCalendar();
}

// Initialize room selector dropdown
function initializeRoomSelector(): void {
  // Clear existing options except the "All rooms" option
  while (roomSelectorElement.options.length > 1) {
    roomSelectorElement.remove(1);
  }
  
  // Add room options
  roomsData.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id.toString();
    option.textContent = room.name;
    roomSelectorElement.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners(): void {
  // Room selector change
  roomSelectorElement.addEventListener('change', () => {
    selectedRoomId = roomSelectorElement.value === 'all' ? null : parseInt(roomSelectorElement.value, 10);
    renderCalendar();
  });
  
  // Week navigation
  prevWeekButton.addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    weekDates = getWeekDates(currentWeekStart);
    renderCalendar();
  });
  
  nextWeekButton.addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    weekDates = getWeekDates(currentWeekStart);
    renderCalendar();
  });
}

// Render the calendar view
export function renderCalendar(): void {
  // Display current week range
  currentWeekDisplayElement.textContent = formatWeekRange(weekDates);
  
  // Get all reservations
  const allReservations = loadReservations();
  
  // Filter reservations for the selected room (if any)
  const filteredReservations = selectedRoomId 
    ? allReservations.filter(r => r.roomId === selectedRoomId)
    : allReservations;
  
  // Prepare calendar content
  let calendarHTML = `
    <table>
      <thead>
        <tr>
          <th>Heure</th>
          ${weekDates.map(date => `
            <th>
              ${getDayName(date)}<br>
              ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
  `;
  
  // Generate time slots (8:00 to 18:00, hourly)
  const startHour = 8;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    calendarHTML += `
      <tr>
        <td class="calendar-time-slot">${timeString}</td>
    `;
    
    // For each day of the week
    weekDates.forEach(date => {
      const dateString = formatDate(date);
      const nextHourString = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Find reservations for this time slot and day
      const slotReservations = filteredReservations.filter(r => {
        return r.date === dateString && 
               timeToMinutes(r.startTime) < timeToMinutes(nextHourString) &&
               timeToMinutes(r.endTime) > timeToMinutes(timeString);
      });
      
      // Render cell with reservations
      if (slotReservations.length > 0) {
        calendarHTML += `
          <td class="calendar-slot calendar-slot-booked">
            ${renderReservationsInSlot(slotReservations, hour)}
          </td>
        `;
      } else {
        // Empty slot with option to book
        calendarHTML += `
          <td class="calendar-slot calendar-slot-available">
            <button class="btn-book-slot" 
                    data-date="${dateString}" 
                    data-start-time="${timeString}" 
                    data-end-time="${nextHourString}">+</button>
          </td>
        `;
      }
    });
    
    calendarHTML += `</tr>`;
  }
  
  calendarHTML += `
      </tbody>
    </table>
  `;
  
  // Set HTML and add event listeners
  calendarGridElement.innerHTML = calendarHTML;
  
  // Add event listeners for booking buttons
  document.querySelectorAll('.btn-book-slot').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const date = target.dataset.date || '';
      const startTime = target.dataset.startTime || '';
      const endTime = target.dataset.endTime || '';
      
      // If a specific room is selected, use it, otherwise, go to room selection
      if (selectedRoomId) {
        openBookingModal(selectedRoomId, date, startTime, endTime);
      } else {
        // Show message or redirect to room selection first
        alert('Veuillez sélectionner une salle spécifique pour réserver ce créneau.');
      }
    });
  });
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Render reservations within a time slot
function renderReservationsInSlot(reservations: Reservation[], slotHour: number): string {
  const slotStart = slotHour * 60; // Start of the current hour in minutes
  const slotEnd = (slotHour + 1) * 60; // End of the current hour in minutes
  
  return reservations.map(reservation => {
    const room = getRoomById(reservation.roomId);
    const roomName = room ? room.name : 'Salle inconnue';
    
    // Calculate the reservation's position relative to the hour slot
    const reservationStart = timeToMinutes(reservation.startTime);
    const reservationEnd = timeToMinutes(reservation.endTime);
    
    // Calculate positioning percentages within the hour
    const topPosition = Math.max(0, ((reservationStart - slotStart) / 60) * 100);
    const height = Math.min(100, ((Math.min(reservationEnd, slotEnd) - Math.max(reservationStart, slotStart)) / 60) * 100);
    
    return `
      <div class="calendar-booking" style="top: ${topPosition}%; height: ${height}%;">
        ${roomName} - ${reservation.userName}
      </div>
    `;
  }).join('');
}