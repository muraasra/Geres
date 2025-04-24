import { Room, roomsData, getRoomById } from '../data/rooms';
import { Reservation } from '../models/reservation';
import { 
  getWeekDates, 
  formatWeekRange, 
  getDayName, 
  formatDate, 
  addDays
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

// ✅ Initialisation du calendrier
export function initCalendarController(): void {
  // Cache DOM elements
  calendarGridElement = document.getElementById('calendarGrid') as HTMLElement;
  roomSelectorElement = document.getElementById('roomSelector') as HTMLSelectElement;
  currentWeekDisplayElement = document.getElementById('currentWeekDisplay') as HTMLElement;
  prevWeekButton = document.getElementById('prevWeek') as HTMLButtonElement;
  nextWeekButton = document.getElementById('nextWeek') as HTMLButtonElement;
  
  // Initialisation de la semaine actuelle
  currentWeekStart = new Date();
  weekDates = getWeekDates(currentWeekStart);

  // Initialiser la sélection des salles
  initializeRoomSelector();

  // Ajouter les événements
  setupEventListeners();

  // Afficher le calendrier
  renderCalendar();
}

// ✅ Initialisation de la sélection des salles
function initializeRoomSelector(): void {
  while (roomSelectorElement.options.length > 1) {
    roomSelectorElement.remove(1);
  }

  roomsData.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id.toString();
    option.textContent = room.name;
    roomSelectorElement.appendChild(option);
  });
}

// ✅ Gestion des événements
function setupEventListeners(): void {
  roomSelectorElement.addEventListener('change', () => {
    selectedRoomId = roomSelectorElement.value === 'all' ? null : parseInt(roomSelectorElement.value, 10);
    renderCalendar();
  });

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

// ✅ Récupération des réservations via `json-server`
async function fetchReservations(): Promise<Reservation[]> {
  try {
    const response = await fetch('http://localhost:5001/reservations');
    if (!response.ok) throw new Error('Erreur lors de la récupération des réservations.');
    return await response.json();
  } catch (error) {
    console.error('❌ Erreur lors du chargement des réservations:', error);
    return [];
  }
}

// ✅ Affichage du calendrier
export async function renderCalendar(): Promise<void> {
  try {
    // Récupérer toutes les réservations en temps réel
    const allReservations = await fetchReservations();

    // Filtrer les réservations par salle si une est sélectionnée
    const filteredReservations = selectedRoomId 
      ? allReservations.filter(r => r.roomId === selectedRoomId)
      : allReservations;

    // Affichage du calendrier
    currentWeekDisplayElement.textContent = formatWeekRange(weekDates);

    let calendarHTML = `
      <table>
        <thead>
          <tr>
            <th>Heure</th>
            ${weekDates.map(date => `
              <th>${getDayName(date)}<br>${formatDate(date)}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;

      calendarHTML += `<tr><td class="calendar-time-slot">${timeString}</td>`;

      weekDates.forEach(date => {
        const dateString = formatDate(date);
        const nextHourString = `${(hour + 1).toString().padStart(2, '0')}:00`;

        const slotReservations = filteredReservations.filter(r => 
          r.date === dateString && 
          timeToMinutes(r.startTime) < timeToMinutes(nextHourString) &&
          timeToMinutes(r.endTime) > timeToMinutes(timeString)
        );

        calendarHTML += slotReservations.length > 0
          ? `<td class="calendar-slot calendar-slot-booked">${renderReservationsInSlot(slotReservations, hour)}</td>`
          : `<td class="calendar-slot calendar-slot-available">
                <button class="btn-book-slot" 
                        data-date="${dateString}" 
                        data-start-time="${timeString}" 
                        data-end-time="${nextHourString}">+</button>
             </td>`;
      });

      calendarHTML += `</tr>`;
    }

    calendarHTML += `</tbody></table>`;

    calendarGridElement.innerHTML = calendarHTML;

    document.querySelectorAll('.btn-book-slot').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const date = target.dataset.date || '';
        const startTime = target.dataset.startTime || '';
        const endTime = target.dataset.endTime || '';

        if (selectedRoomId) {
          openBookingModal(selectedRoomId, date, startTime, endTime);
        } else {
          alert('Veuillez sélectionner une salle spécifique pour réserver ce créneau.');
        }
      });
    });

  } catch (error) {
    console.error('❌ Erreur lors du rendu du calendrier:', error);
  }
}

// ✅ Conversion des heures en minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// ✅ Affichage des réservations dans un créneau
function renderReservationsInSlot(reservations: Reservation[], slotHour: number): string {
  return reservations.map(reservation => {
    const room = getRoomById(reservation.roomId);
    const roomName = room ? room.name : 'Salle inconnue';
    return `<div class="calendar-booking">${roomName} - ${reservation.userName}</div>`;
  }).join('');
}
