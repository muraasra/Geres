import { initModalController } from './controllers/modalController';
import { initNavigationController } from './controllers/navigationController';
import { initializeData } from './services/dataService';

// Initialize the application
function initApp(): void {
  // Initialize sample data if needed
  initializeData();
  
  // Initialize controllers
  initModalController();
  initNavigationController();
}

// Wait for DOM to be loaded before initializing the app
document.addEventListener('DOMContentLoaded', initApp);