import { initRoomsController } from './roomsController';
import { initCalendarController } from './calendarController';
import { initReservationsController } from './reservationsController';

// DOM Elements
let btnShowRooms: HTMLButtonElement;
let btnShowCalendar: HTMLButtonElement;
let btnShowReservations: HTMLButtonElement;
let roomsSection: HTMLElement;
let calendarSection: HTMLElement;
let reservationsSection: HTMLElement;
let filterSection: HTMLElement;

// Initialize the navigation controller
export function initNavigationController(): void {
  // Cache DOM elements
  btnShowRooms = document.getElementById('btnShowRooms') as HTMLButtonElement;
  btnShowCalendar = document.getElementById('btnShowCalendar') as HTMLButtonElement;
  btnShowReservations = document.getElementById('btnShowReservations') as HTMLButtonElement;
  roomsSection = document.getElementById('roomsSection') as HTMLElement;
  calendarSection = document.getElementById('calendarSection') as HTMLElement;
  reservationsSection = document.getElementById('reservationsSection') as HTMLElement;
  filterSection = document.getElementById('filterSection') as HTMLElement;
  
  // Set up event listeners
  setupNavigationEvents();
  
  // Initialize section controllers
  initRoomsController();
  initCalendarController();
  initReservationsController();
}

// Setup navigation events
function setupNavigationEvents(): void {
  btnShowRooms.addEventListener('click', () => showSection('rooms'));
  btnShowCalendar.addEventListener('click', () => showSection('calendar'));
  btnShowReservations.addEventListener('click', () => showSection('reservations'));
}

// Show selected section and hide others
export function showSection(sectionName: 'rooms' | 'calendar' | 'reservations'): void {
  // Reset active states
  btnShowRooms.classList.remove('active');
  btnShowCalendar.classList.remove('active');
  btnShowReservations.classList.remove('active');
  
  // Hide all sections
  roomsSection.classList.add('hidden');
  calendarSection.classList.add('hidden');
  reservationsSection.classList.add('hidden');
  
  // Show filter section only for rooms
  filterSection.classList.toggle('hidden', sectionName !== 'rooms');
  
  // Show the selected section and set active button
  switch (sectionName) {
    case 'rooms':
      roomsSection.classList.remove('hidden');
      btnShowRooms.classList.add('active');
      break;
    case 'calendar':
      calendarSection.classList.remove('hidden');
      btnShowCalendar.classList.add('active');
      break;
    case 'reservations':
      reservationsSection.classList.remove('hidden');
      btnShowReservations.classList.add('active');
      // Refresh reservations list when showing
      initReservationsController();
      break;
  }
}