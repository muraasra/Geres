import { getRoomById } from '../data/rooms';
import { Reservation } from '../models/reservation';
import { formatDateForDisplay, formatTimeForDisplay, isDateInPast } from '../utils/dateUtils';

// DOM Elements
let userReservationsListElement: HTMLElement;

// Fetch reservations from API
async function fetchReservations(): Promise<Reservation[]> {
  const response = await fetch('http://localhost:5001/reservations');
  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }
  return response.json();
}

// Initialize the reservations controller
export async function initReservationsController(): Promise<void> {
  // Cache DOM elements
  userReservationsListElement = document.getElementById('userReservationsList') as HTMLElement;

  // Render user reservations
  await renderUserReservations();
}

// Render user reservations
export async function renderUserReservations(): Promise<void> {
  try {
    // Get all reservations
    const reservations = await fetchReservations();

    // Sort reservations by date (upcoming first)
    reservations.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA > dateB) return 1;
      if (dateA < dateB) return -1;

      const timeA = a.startTime;
      const timeB = b.startTime;
      if (timeA > timeB) return 1;
      if (timeA < timeB) return -1;

      return 0;
    });

    // Group reservations by past and future
    const pastReservations = reservations.filter(r => isDateInPast(r.date));
    const upcomingReservations = reservations.filter(r => !isDateInPast(r.date));

    // Generate HTML
    let html = '';

    // Upcoming reservations
    if (upcomingReservations.length > 0) {
      html += `
        <div class="reservations-group">
          <h3>Réservations à venir</h3>
          <div class="reservations-list">
            ${upcomingReservations.map(reservation => renderReservationCard(reservation, false)).join('')}
          </div>
        </div>
      `;
    }

    // Past reservations
    if (pastReservations.length > 0) {
      html += `
        <div class="reservations-group">
          <h3>Réservations passées</h3>
          <div class="reservations-list">
            ${pastReservations.map(reservation => renderReservationCard(reservation, true)).join('')}
          </div>
        </div>
      `;
    }

    // No reservations message
    if (reservations.length === 0) {
      html = `
        <div class="no-reservations">
          <p>Vous n'avez pas encore de réservations.</p>
        </div>
      `;
    }

    // Set HTML
    userReservationsListElement.innerHTML = html;

    // Add event listeners for delete buttons
    document.querySelectorAll('.btn-delete-reservation').forEach(button => {
      button.addEventListener('click', async (e) => {
        const reservationId = parseInt((e.currentTarget as HTMLElement).dataset.reservationId || '0', 10);
        if (confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) {
          await deleteReservation(reservationId);
          await renderUserReservations(); // Re-render list
        }
      });
    });
  } catch (error) {
    console.error('Error rendering reservations:', error);
    userReservationsListElement.innerHTML = `
      <div class="error-message">
        <p>Une erreur s'est produite lors du chargement des réservations.</p>
      </div>
    `;
  }
}

// Render a single reservation card
function renderReservationCard(reservation: Reservation, isPast: boolean): string {
  const room = getRoomById(reservation.roomId);
  const roomName = room ? room.name : 'Salle inconnue';

  return `
    <div class="reservation-card ${isPast ? 'reservation-past' : ''}">
      <div class="reservation-header">
        <div>
          <h4 class="reservation-title">${roomName}</h4>
          <p class="reservation-date">${formatDateForDisplay(reservation.date)}</p>
        </div>
      </div>
      <p class="reservation-time">${formatTimeForDisplay(reservation.startTime)} - ${formatTimeForDisplay(reservation.endTime)}</p>
      <p class="reservation-user">Réservé par: ${reservation.userName}</p>
      <p class="reservation-phone">Téléphone: ${reservation.phoneNumber || 'Non disponible'}</p>
      ${!isPast ? `
        <div class="reservation-actions">
          <button class="btn-secondary btn-delete-reservation" data-reservation-id="${reservation.id}">
            Annuler
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// Delete reservation (mock implementation)
async function deleteReservation(reservationId: number): Promise<void> {
  await fetch(`http://localhost:5001/reservations/${reservationId}`, { method: 'DELETE' });
}