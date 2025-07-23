import { createApp } from 'vue';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, orderBy, FieldValue } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import Vue Components
import PlayersPage from './components/PlayersPage.vue';
import AccountPage from './components/AccountPage.vue';
import AlumniPage from './components/AlumniPage.vue';
import ChatPage from './components/ChatPage.vue';
import MediaPage from './components/MediaPage.vue';
import NotificationsPage from './components/NotificationsPage.vue';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1bd9K8h_UCSHn_Pu50Ii-hMXHQ2FxcsY",
  authDomain: "kho-kho-connect.firebaseapp.com",
  databaseURL: "https://kho-kho-connect-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kho-kho-connect",
  storageBucket: "kho-kho-connect.firebasestorage.app",
  messagingSenderId: "137549154272",
  appId: "1:137549154272:web:a9e567a9998f26e69fcd85"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Make Firestore FieldValue globally available for components, as they may directly use it.
// This is a workaround for not passing db/auth instances down as props to every method call.
window.firebase = {
  firestore: { FieldValue: FieldValue },
  auth: auth, // Pass auth instance for components that use it (e.g., AccountPage)
  // Other Firebase services can be added here if needed by components
};

// Get references to collections
const playersCollection = collection(db, 'players');
const notificationsCollection = collection(db, 'notifications');
const alumniCollection = collection(db, 'alumni');
const chatCollection = collection(db, 'chat');
const pollsCollection = collection(db, 'polls');

// Vue.js App
const app = Vue.createApp({
  data() {
    return {
      user: null,
      authLoading: true,
      showMenu: false, // For mobile menu toggle
      
      // Global state derived from Firebase listeners
      allPlayers: [], // Raw list of players fetched from Firestore
      allNotifications: [], // Raw list of notifications/polls
      allAlumni: [], // Raw list of alumni
      // allChatMessages: [], // ChatPage will manage its own messages locally

      currentPage: 'players', // Default page
      playersListenerActive: false, // Track listener status
      notificationsListenerUnsubscribe: null,
      alumniListenerUnsubscribe: null,
      playersListenerUnsubscribe: null,
    };
  },
  components: {
    PlayersPage,
    AccountPage,
    AlumniPage,
    ChatPage,
    MediaPage,
    NotificationsPage,
  },
  computed: {
    // Determine which component to render based on currentPage
    currentPageComponent() {
      switch (this.currentPage) {
        case 'players':
          return 'PlayersPage';
        case 'media':
          return 'MediaPage';
        case 'chat':
          return 'ChatPage';
        case 'notifications':
          return 'NotificationsPage';
        case 'alumni':
          return 'AlumniPage';
        case 'account':
          return 'AccountPage';
        default:
          return 'PlayersPage'; // Fallback
      }
    },
    currentPageComponentTitle() {
      switch (this.currentPage) {
        case "players":
          return "Our Players";
        case "notifications":
          return "Notifications & Polls";
        case "alumni":
          return "Alumni Network";
        case "chat":
          return "Team Chat";
        case "media":
          return "Kho-Kho Media";
        case "account":
          return this.user ? "Your Account" : "Login / Register";
        default:
          return "";
      }
    },
    // Check if current user is a registered player
    isRegisteredPlayer() {
      if (!this.user || !this.allPlayers.length) return false;
      return this.allPlayers.some(player => player.id === this.user.uid);
    },
    // Check if current user is a convener (for demo, hardcode convener emails)
    isConvener() {
      const convenerEmails = [
        "shaukataziz@iisc.ac.in",
        "sakshisoni@iisc.ac.in",
      ];
      return this.user ? convenerEmails.includes(this.user.email) : false;
    },
  },
  methods: {
    // Navigation method
    changePage(pageName) {
      this.currentPage = pageName;
    },

    // Authentication methods (passed to AccountPage or handled globally)
    async logout() {
      try {
        await signOut(auth);
        alert("Successfully signed out!");
      } catch (error) {
        console.error("Error logging out:", error.message);
        alert("Error logging out: " + error.message);
      }
    },
    handlePlayersFetched(playersData) {
      // This method is called by PlayersPage after it fetches players
      // to update the global allPlayers state in app.js.
      this.allPlayers = playersData;
    },
    fetchPlayersAndUserStatus() {
      // This method is called by child components when a change occurs
      // that might affect global user status (e.g., player registration).
      // It re-triggers the allPlayers listener to update `isRegisteredPlayer` and `isConvener` computed properties.
      // The snapshot listener handles real-time updates, so a manual fetch might not be needed.
      // However, if the listener was unsubscribed (e.g., on logout), this could re-initiate it.
      // For now, simply ensuring the main listeners are active based on user state is sufficient.
      if (this.user && !this.playersListenerActive) {
        this.setupFirebaseListeners(); // Re-activate listeners if they were off
      }
    },

    // Global Firebase Realtime Listeners
    setupFirebaseListeners() {
        // Prevent multiple listeners
        if (this.playersListenerActive) return;

        // Players Listener
        this.playersListenerUnsubscribe = onSnapshot(playersCollection, snapshot => {
            this.allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Players updated:", this.allPlayers.length);
        }, error => {
            console.error("Error listening to players:", error);
        });

        // Notifications Listener
        this.notificationsListenerUnsubscribe = onSnapshot(notificationsCollection, orderBy('timestamp', 'desc'), snapshot => {
            this.allNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Notifications updated:", this.allNotifications.length);
        }, error => {
            console.error("Error listening to notifications:", error);
        });

        // Alumni Listener
        this.alumniListenerUnsubscribe = onSnapshot(alumniCollection, orderBy('name'), snapshot => {
            this.allAlumni = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Alumni updated:", this.allAlumni.length);
        }, error => {
            console.error("Error listening to alumni:", error);
        });

        this.playersListenerActive = true;
    },
    // Method to unsubscribe all listeners (e.g., on logout)
    unsubscribeAllListeners() {
      if (this.playersListenerUnsubscribe) {
        this.playersListenerUnsubscribe();
        this.playersListenerUnsubscribe = null;
      }
      if (this.notificationsListenerUnsubscribe) {
        this.notificationsListenerUnsubscribe();
        this.notificationsListenerUnsubscribe = null;
      }
      if (this.alumniListenerUnsubscribe) {
        this.alumniListenerUnsubscribe();
        this.alumniListenerUnsubscribe = null;
      }
      this.playersListenerActive = false;
    },
  },
  mounted() {
    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (user) => {
      this.user = user;
      this.authLoading = false;
      if (user) {
        console.log("User logged in:", user.email);
        // Start listening to Firestore data once user is logged in
        this.setupFirebaseListeners();
      } else {
        console.log("User logged out.");
        // Clear global data and unsubscribe from listeners when user logs out
        this.allPlayers = [];
        this.allNotifications = [];
        this.allAlumni = [];
        this.unsubscribeAllListeners();
        // Redirect to default page (e.g., players or account)
        this.currentPage = 'players'; 
      }
    });

    // Initial load of content based on default page
    this.changePage('players');
  },
  beforeUnmount() {
    // Ensure all listeners are unsubscribed when the app is unmounted
    this.unsubscribeAllListeners();
  }
});

// Mount the app
app.mount('#app');
