import { getRoomById, calculatePrice } from '../data/rooms';
import { createReservation, hasConflict, isValidReservation } from '../models/reservation';
import { addReservation, getUserName, loadReservations, saveUserName } from '../services/dataService';
import { formatDateForDisplay } from '../utils/dateUtils';
import { renderUserReservations } from './reservationsController';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your_publishable_key');

// DOM Elements
let bookingModalElement: HTMLElement;
let bookingFormElement: HTMLFormElement;
let roomIdInput: HTMLInputElement;
let userNameInput: HTMLInputElement;
let bookingDateInput: HTMLInputElement;
let startTimeInput: HTMLInputElement;
let endTimeInput: HTMLInputElement;
let validationMessageElement: HTMLElement;
let totalPriceElement: HTMLElement;

// Initialize modal controller
export function initModalController(): void {
  // Cache DOM Elements
  bookingModalElement = document.getElementById('bookingModal') as HTMLElement;
  bookingFormElement = document.getElementById('bookingForm') as HTMLFormElement;
  roomIdInput = document.getElementById('roomId') as HTMLInputElement;
  userNameInput = document.getElementById('userName') as HTMLInputElement;
  bookingDateInput = document.getElementById('bookingDate') as HTMLInputElement;
  startTimeInput = document.getElementById('startTime') as HTMLInputElement;
  endTimeInput = document.getElementById('endTime') as HTMLInputElement;
  validationMessageElement = document.getElementById('bookingValidationMessage') as HTMLElement;
  totalPriceElement = document.getElementById('totalPrice') as HTMLElement;
  
  // Set up event listeners
  bookingFormElement.addEventListener('submit', handleBookingSubmit);
  
  document.querySelectorAll('.cancel-booking').forEach(button => {
    button.addEventListener('click', closeModal);
  });
  
  // Set today as min value for booking date
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  bookingDateInput.min = `${today.getFullYear()}-${month}-${day}`;
  
  // Set business hours as min/max for time inputs
  startTimeInput.min = '08:00';
  startTimeInput.max = '17:00';
  endTimeInput.min = '09:00';
  endTimeInput.max = '18:00';
  
  // Add validation for time inputs (end time must be after start time)
  startTimeInput.addEventListener('change', validateTimeInputs);
  endTimeInput.addEventListener('change', validateTimeInputs);
  
  // Add listeners for price calculation
  [startTimeInput, endTimeInput].forEach(input => {
    input.addEventListener('change', updateTotalPrice);
  });
}

// Update total price display
function updateTotalPrice(): void {
  const roomId = parseInt(roomIdInput.value, 10);
  const room = getRoomById(roomId);
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  
  if (room && startTime && endTime) {
    const totalPrice = calculatePrice(room, startTime, endTime);
    totalPriceElement.textContent = `Total: ${totalPrice}Fcfa`;
  }
}

// Open the booking modal with pre-filled values
export function openBookingModal(
  roomId: number, 
  date: string = '', 
  startTime: string = '', 
  endTime: string = ''
): void {
  // Get room details
  const room = getRoomById(roomId);
  if (!room) return;
  
  // Reset form and validation message
  bookingFormElement.reset();
  validationMessageElement.innerHTML = '';
  validationMessageElement.className = 'validation-message';
  
  // Pre-fill the form
  roomIdInput.value = roomId.toString();
  
  // Pre-fill user name if available from localStorage
  const savedUserName = getUserName();
  if (savedUserName) {
    userNameInput.value = savedUserName;
  }
  
  // Pre-fill date and time if provided
  if (date) bookingDateInput.value = date;
  if (startTime) startTimeInput.value = startTime;
  if (endTime) endTimeInput.value = endTime;
  
  // Show modal with room name in title
  const modalTitle = bookingModalElement.querySelector('h2');
  if (modalTitle) {
    modalTitle.textContent = `Réserver ${room.name}`;
  }
  
  // Update total price
  updateTotalPrice();
  
  bookingModalElement.style.display = 'block';
}

// Close any open modal
export function closeModal(): void {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    (modal as HTMLElement).style.display = 'none';
  });
}

// Handle booking form submission
async function handleBookingSubmit(e: Event): Promise<void> {
  e.preventDefault();
  
  // Get form values
  const roomId = parseInt(roomIdInput.value, 10);
  const userName = userNameInput.value.trim();
  const date = bookingDateInput.value;
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  
  // Basic validation
  if (!roomId || !userName || !date || !startTime || !endTime) {
    showValidationMessage('Veuillez remplir tous les champs.', 'error');
    return;
  }
  
  try {
    const room = getRoomById(roomId);
    if (!room) throw new Error("Salle non trouvée");
    
    const totalPrice = calculatePrice(room, startTime, endTime);
    
    // Initialize Stripe payment
    const stripe = await stripePromise;
    if (!stripe) throw new Error("Erreur lors de l'initialisation du paiement");
    
    // Create a payment session (this would typically be done through your backend)
    // For demo purposes, we'll simulate a successful payment
    showValidationMessage('Traitement du paiement...', 'info');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Save the user name for future bookings
    saveUserName(userName);
    
    // Get existing reservations
    const reservations = loadReservations();
    
    // Create a new reservation
    const newReservation = createReservation(
      roomId,
      userName,
      date,
      startTime,
      endTime,
      reservations
    );
    
    // Add to reservations
    addReservation(newReservation);
    
    // Show success message
    showValidationMessage(
      `Réservation confirmée pour ${room.name} le ${formatDateForDisplay(date)} 
      de ${startTime.replace(':', 'h')} à ${endTime.replace(':', 'h')}.
      Montant payé: ${totalPrice}Fcfa`,
      'success'
    );
    
    // Update reservations display if visible
    const reservationsSection = document.getElementById('reservationsSection');
    if (reservationsSection && !reservationsSection.classList.contains('hidden')) {
      renderUserReservations();
    }
    
    // Clear form after 2 seconds and close modal
    setTimeout(() => {
      bookingFormElement.reset();
      closeModal();
    }, 2000);
    
  } catch (error) {
    showValidationMessage((error as Error).message, 'error');
  }
}

// Validate that end time is after start time
function validateTimeInputs(): void {
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  
  // Skip if either field is empty
  if (!startTime || !endTime) return;
  
  // Compare times
  if (startTime >= endTime) {
    endTimeInput.setCustomValidity('L\'heure de fin doit être après l\'heure de début');
    showValidationMessage('L\'heure de fin doit être après l\'heure de début', 'error');
  } else {
    endTimeInput.setCustomValidity('');
    validationMessageElement.innerHTML = '';
    validationMessageElement.className = 'validation-message';
  }
  
  // Update total price
  updateTotalPrice();
}

// Show validation message
function showValidationMessage(message: string, type: 'error' | 'success' | 'info'): void {
  validationMessageElement.textContent = message;
  validationMessageElement.className = `validation-message ${type}`;
}