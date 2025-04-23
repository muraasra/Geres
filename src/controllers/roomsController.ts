import { Room, equipmentList, roomsData, getRoomById, getRoomEquipment, addRoom } from '../data/rooms';
import { filterRooms, loadReservations } from '../services/dataService';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/dateUtils';
import { openBookingModal, closeModal } from './modalController';

// DOM Elements
let roomsListElement: HTMLElement;
let capacityFilterElement: HTMLInputElement;
let dateFilterElement: HTMLInputElement;
let equipmentFiltersElement: HTMLElement;
let btnApplyFilters: HTMLButtonElement;
let btnResetFilters: HTMLButtonElement;
let roomDetailsContentElement: HTMLElement;
let roomDetailsModalElement: HTMLElement;
let addRoomModalElement: HTMLElement;
let addRoomFormElement: HTMLFormElement;

// State
let filteredRooms: Room[] = [];
let selectedEquipmentIds: number[] = [];

// Initialize the rooms controller
export function initRoomsController(): void {
  // Cache DOM elements
  roomsListElement = document.getElementById('roomsList') as HTMLElement;
  capacityFilterElement = document.getElementById('capacityFilter') as HTMLInputElement;
  dateFilterElement = document.getElementById('dateFilter') as HTMLInputElement;
  equipmentFiltersElement = document.getElementById('equipmentFilters') as HTMLElement;
  btnApplyFilters = document.getElementById('btnApplyFilters') as HTMLButtonElement;
  btnResetFilters = document.getElementById('btnResetFilters') as HTMLButtonElement;
  roomDetailsContentElement = document.getElementById('roomDetailsContent') as HTMLElement;
  roomDetailsModalElement = document.getElementById('roomDetailsModal') as HTMLElement;
  addRoomModalElement = document.getElementById('addRoomModal') as HTMLElement;
  addRoomFormElement = document.getElementById('addRoomForm') as HTMLFormElement;
  
  // Initialize filters
  initializeFilters();
  
  // Set initial state
  filteredRooms = [...roomsData];
  
  // Event listeners
  setupEventListeners();
  
  // Render the rooms
  renderRooms(filteredRooms);
}

// Initialize filter inputs
function initializeFilters(): void {
  // Set default value for date filter to today
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  dateFilterElement.value = `${today.getFullYear()}-${month}-${day}`;
  
  // Create equipment filter checkboxes
  equipmentFiltersElement.innerHTML = '';
  
  equipmentList.forEach(equipment => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = equipment.id.toString();
    checkbox.dataset.equipmentId = equipment.id.toString();
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(equipment.name));
    
    equipmentFiltersElement.appendChild(label);
  });
}

// Setup event listeners
function setupEventListeners(): void {
  btnApplyFilters.addEventListener('click', applyFilters);
  btnResetFilters.addEventListener('click', resetFilters);
  
  // Add Room form submission
  addRoomFormElement.addEventListener('submit', handleAddRoomSubmit);
  
  // Close modals when clicking the close button or outside the modal
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => closeModal());
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === roomDetailsModalElement || e.target === addRoomModalElement) {
      closeModal();
    }
  });
  
  // Add Room button
  document.getElementById('btnAddRoom')?.addEventListener('click', () => {
    addRoomModalElement.style.display = 'block';
  });
}

// Handle Add Room form submission
function handleAddRoomSubmit(e: Event): void {
  e.preventDefault();
  
  const formData = new FormData(e.target as HTMLFormElement);
  const equipmentIds = Array.from(formData.getAll('equipment')).map(Number);
  
  const newRoom = {
    name: formData.get('name') as string,
    capacity: parseInt(formData.get('capacity') as string, 10),
    description: formData.get('description') as string,
    image: formData.get('image') as string,
    equipmentIds,
    pricePerHour: parseInt(formData.get('pricePerHour') as string, 10)
  };
  
  addRoom(newRoom);
  renderRooms(roomsData);
  closeModal();
  (e.target as HTMLFormElement).reset();
}

// Apply filters
function applyFilters(): void {
  const minCapacity = parseInt(capacityFilterElement.value, 10) || 0;
  const date = dateFilterElement.value || null;
  
  // Get selected equipment IDs
  selectedEquipmentIds = Array.from(
    document.querySelectorAll<HTMLInputElement>('#equipmentFilters input:checked')
  ).map(input => parseInt(input.dataset.equipmentId || '0', 10));
  
  // Apply filters
  filteredRooms = filterRooms(roomsData, minCapacity, date, selectedEquipmentIds);
  
  // Render filtered rooms
  renderRooms(filteredRooms);
}

// Reset filters
function resetFilters(): void {
  capacityFilterElement.value = '1';
  dateFilterElement.value = '';
  
  // Uncheck all equipment checkboxes
  document.querySelectorAll<HTMLInputElement>('#equipmentFilters input').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  selectedEquipmentIds = [];
  filteredRooms = [...roomsData];
  
  // Render all rooms
  renderRooms(filteredRooms);
}

// Render rooms list
export function renderRooms(rooms: Room[]): void {
  if (!roomsListElement) return;
  
  roomsListElement.innerHTML = '';
  
  if (rooms.length === 0) {
    roomsListElement.innerHTML = `
      <div class="no-results">
        <p>Aucune salle ne correspond à vos critères. Veuillez modifier vos filtres.</p>
      </div>
    `;
    return;
  }
  
  rooms.forEach(room => {
    const roomCard = document.createElement('div');
    roomCard.className = 'room-card';
    
    // Get equipment names for this room
    const roomEquipment = getRoomEquipment(room);
    
    roomCard.innerHTML = `
      <img src="${room.image}" alt="${room.name}" class="room-image">
      <div class="room-info">
        <h3 class="room-name">${room.name}</h3>
        <p class="room-capacity">Capacité: ${room.capacity} personnes</p>
        <p class="room-price">${room.pricePerHour}Fcfa/heure</p>
        <div class="room-equipment">
          ${roomEquipment.map(eq => `<span class="equipment-tag">${eq.name}</span>`).join('')}
        </div>
        <div class="room-actions">
          <button class="btn-secondary view-details" data-room-id="${room.id}">Voir détails</button>
          <button class="btn-primary book-room" data-room-id="${room.id}">Réserver</button>
        </div>
      </div>
    `;
    
    roomsListElement.appendChild(roomCard);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.view-details').forEach(button => {
    button.addEventListener('click', (e) => {
      const roomId = parseInt((e.currentTarget as HTMLElement).dataset.roomId || '0', 10);
      openRoomDetailsModal(roomId);
    });
  });
  
  document.querySelectorAll('.book-room').forEach(button => {
    button.addEventListener('click', (e) => {
      const roomId = parseInt((e.currentTarget as HTMLElement).dataset.roomId || '0', 10);
      openBookingModal(roomId);
    });
  });
}

// Open room details modal
function openRoomDetailsModal(roomId: number): void {
  const room = getRoomById(roomId);
  if (!room) return;
  
  const roomEquipment = getRoomEquipment(room);
  const reservations = loadReservations().filter(r => r.roomId === roomId);
  
  roomDetailsContentElement.innerHTML = `
    <div class="room-details">
      <div class="room-details-header">
        <img src="${room.image}" alt="${room.name}" class="room-details-image">
        <div class="room-details-info">
          <h2 class="room-details-name">${room.name}</h2>
          <p class="room-details-capacity">Capacité: ${room.capacity} personnes</p>
          <p class="room-details-price">${room.pricePerHour}Fcfa/heure</p>
          <div class="room-details-equipment">
            <h3>Équipements:</h3>
            <div class="room-equipment">
              ${roomEquipment.map(eq => `<span class="equipment-tag">${eq.name}</span>`).join('')}
            </div>
          </div>
          <div class="room-details-actions">
            <button class="btn-primary book-room-details" data-room-id="${room.id}">Réserver cette salle</button>
          </div>
        </div>
      </div>
      
      <div class="room-details-description">
        <p>${room.description}</p>
      </div>
      
      ${reservations.length > 0 ? `
        <div class="room-upcoming-reservations">
          <h3>Réservations à venir:</h3>
          <ul class="reservations-list">
            ${reservations.map(res => `
              <li class="reservation-item">
                ${formatDateForDisplay(res.date)} • 
                ${formatTimeForDisplay(res.startTime)} - ${formatTimeForDisplay(res.endTime)} • 
                ${res.userName}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add event listener to booking button in modal
  const bookButton = roomDetailsContentElement.querySelector('.book-room-details');
  if (bookButton) {
    bookButton.addEventListener('click', () => {
      closeModal(); // Close details modal
      openBookingModal(roomId); // Open booking modal
    });
  }
  
  // Display the modal
  roomDetailsModalElement.style.display = 'block';
}