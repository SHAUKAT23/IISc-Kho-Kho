/* Line 86-87 contains conveners email */
// Using global Vue
const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

// Using global Firebase (already initialized in index.html)
console.log("Using global Firebase instance");

// Get references to Firebase services (already initialized in index.html)
const auth = window.auth;
const db = window.db;
const storage = window.storage;

// Shorthands for common Firebase functions
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

// Signal that app.js has loaded successfully
window.appLoaded = true;
console.log("app.js loaded successfully");

// Create Vue app
const app = createApp({
  setup() {
    console.log("Vue app is initializing");
    const tab = ref("players");
    const user = ref(null);
    const showEmailLogin = ref(false);
    const emailLoginForm = reactive({ email: "", password: "" });
    const emailLoading = ref(false);


    const showPlayerForm = ref(false);
    const playerForm = reactive({
      name: "",
      contact: "",
      player_type: "",
      department: "",
      degreeType: "", // Changed from year_of_study and degree
      category: "",
    });
    const playerLoading = ref(false);
    const playerGender = ref("men");
    const players = ref([]);

    const notifications = ref([]);
    const notificationLoading = ref(false);
    const pollVotes = reactive({});
    const pollResults = reactive({});

    const alumniForm = reactive({
      name: "",
      email: "",
      contact: "",
      department: "",
    });
    const alumniLoading = ref(false);
    const alumniList = ref([]);

    const chatMessages = ref([]);
    const chatInput = ref("");
    
    // Firebase collection references (using compat API)
    const playersRef = db.collection("players");
    const notificationsRef = db.collection("notifications");
    const messagesRef = db.collection("messages");
    const alumniRef = db.collection("alumni");
    console.log("Firebase collections initialized successfully");

    // Setup Firebase listeners
    function setupFirebaseListeners() {
      try {
        console.log("Setting up Firebase listeners...");
        
        // Listen for players
        playersRef.onSnapshot((snapshot) => {
          players.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Loaded ${players.value.length} players`);
        }, (error) => {
          console.error("Players listener error:", error);
        });

        // Listen for notifications
        notificationsRef.orderBy("createdAt", "desc").onSnapshot((snapshot) => {
          notifications.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Loaded ${notifications.value.length} notifications`);
        }, (error) => {
          console.error("Notifications listener error:", error);
        });

        // Listen for chat messages
        messagesRef.orderBy("timestamp", "asc").onSnapshot((snapshot) => {
          chatMessages.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Loaded ${chatMessages.value.length} chat messages`);
          
          // Scroll to latest message
          setTimeout(() => {
            const chatContainer = document.getElementById("chatMessages");
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 100);
        }, (error) => {
          console.error("Messages listener error:", error);
        });
        
        // Listen for alumni
        alumniRef.onSnapshot((snapshot) => {
          alumniList.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Loaded ${alumniList.value.length} alumni`);
        }, (error) => {
          console.error("Alumni listener error:", error);
        });
        
        console.log("Firebase listeners setup complete");
      } catch (error) {
        console.error("Error in setupFirebaseListeners:", error);
      }
    }

    const activeClass =
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500";
    const inactiveClass =
      "text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500";

    const tabTitle = computed(() => {
      switch (tab.value) {
        case "players":
          return "Player List";
        case "notifications":
          return "Notifications & Polls";
        case "alumni":
          return "Alumni";
        case "chat":
          return "Chat";
        case "media":
          return "Kho-Kho Media";
        case "account":
          return user.value ? "Your Account" : "Login / Register";
        default:
          return "";
      }
    });

    
    function setTab(t) {
      console.log("Setting tab to:", t);
      tab.value = t;
      loadContent(t);
    }

    // Filter players by gender
    const filteredPlayers = computed(() => {
      return players.value.filter(p => {
        const categoryValue = p.category || p.Category || "";
        // Check if the category starts with the current gender filter
        return categoryValue.toLowerCase().startsWith(playerGender.value.toLowerCase());
      });
    });

    // Check if user is convener (for demo, hardcode convener emails)
    const convenerEmails = [
      "shaukataziz@iisc.ac.in",
      "sakshisoni@iisc.ac.in",
    ];
    const isConvener = computed(() =>
      user.value ? convenerEmails.includes(user.value.email) : false
    );

    // Check if user is registered player
    const isRegisteredPlayer = computed(() => {
      if (!user.value) return false;
      return players.value.some(
        (p) => {
          // Case-insensitive email comparison
          const playerEmail = (p.email || p.Email || "").toLowerCase();
          const userEmail = user.value.email.toLowerCase();
          return playerEmail === userEmail;
        }
      );
    });

    // Format date
    function formatDate(timestamp) {
      if (!timestamp) return "";
      if (timestamp instanceof Date) return timestamp.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    
    function formatDateTime(timestamp) {
      if (!timestamp) return "";
      if (timestamp instanceof Date) return timestamp.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(timestamp).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
   
    // Login with Google
    async function signInWithGoogle() {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
          'hd': 'iisc.ac.in' // Limit to IISc domain
        });
        
        const result = await auth.signInWithPopup(provider);
        const email = result.user.email;
        
        // Check if email is from IISc domain
        if (!email.endsWith('@iisc.ac.in')) {
          await auth.signOut();
          alert('Only @iisc.ac.in email addresses are allowed to use this app.');
          return;
        }
        
        user.value = result.user;
        console.log("Logged in with Google successfully:", email);
      } catch (error) {
        console.error("Google sign-in error:", error);
        alert(`Login failed: ${error.message}`);
      }
    }
    
    // Microsoft login is not implemented with Firebase in this example
    async function signInWithMicrosoft() {
      alert("Microsoft login is not implemented yet. Please use Google or email login.");
    }
    
    // Email login/register
    async function emailLogin() {
      if (!emailLoginForm.email.endsWith('@iisc.ac.in')) {
        alert('Only @iisc.ac.in email addresses are allowed to use this app.');
        return;
      }
      
      emailLoading.value = true;
      try {
        // Try to sign in first
        try {
          const userCredential = await auth.signInWithEmailAndPassword(
            emailLoginForm.email,
            emailLoginForm.password
          );
          user.value = userCredential.user;
        } catch (loginError) {
          // If login fails, try to create a new account
          if (loginError.code === 'auth/user-not-found') {
            const userCredential = await auth.createUserWithEmailAndPassword(
              emailLoginForm.email,
              emailLoginForm.password
            );
            user.value = userCredential.user;
            alert('Account created successfully!');
          } else {
            throw loginError;
          }
        }
        
        // Reset form
        emailLoginForm.email = "";
        emailLoginForm.password = "";
        showEmailLogin.value = false;
      } catch (error) {
        console.error("Email auth error:", error);
        alert(`Authentication failed: ${error.message}`);
      } finally {
        emailLoading.value = false;
      }
    }
    
    // Logout
    async function logout() {
      try {
        await auth.signOut();
        user.value = null;
      } catch (error) {
        console.error("Sign out error:", error);
        alert(`Logout failed: ${error.message}`);
      }
    }

    // Load players from Firestore (no longer needed, handled by real-time listener)
    async function loadPlayers() {
      // This function is kept for backward compatibility but is no longer needed
      // Players are loaded via the Firestore onSnapshot listener in setupFirebaseListeners
      try {
        const querySnapshot = await getDocs(playersRef);
        
        // Convert query snapshot to array of player objects
        const playerData = [];
        querySnapshot.forEach((doc) => {
          playerData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Debug log to check data structure
        if (playerData.length > 0) {
          console.log("Sample player data:", playerData[0]);
        }
        
        players.value = playerData;
      } catch (e) {
        console.error("Error loading players:", e);
      }
    }

    // Submit player registration
    async function submitPlayerRegistration() {
      console.log("Submitting player registration");
      if (!user.value) {
        console.error("User not logged in");
        return;
      }
      
      try {
        playerLoading.value = true;
        
        // Add player to Firestore
        await db.collection("players").add({
          name: playerForm.name,
          contact: playerForm.contact,
          player_type: playerForm.player_type,
          department: playerForm.department,
          degreeType: playerForm.degreeType,
          category: playerForm.category || playerGender.value,
          user_id: user.value.uid,
          email: user.value.email,
          created_at: serverTimestamp()
        });
        
        // Reset form
        playerForm.name = "";
        playerForm.contact = "";
        playerForm.player_type = "";
        playerForm.department = "";
        playerForm.degreeType = "";
        playerForm.category = "";
        
        // Hide form
        showPlayerForm.value = false;
        
        console.log("Player registration successful");
      } catch (error) {
        console.error("Error registering player:", error);
        alert("Failed to register player. Please try again.");
      } finally {
        playerLoading.value = false;
      }
    }

    // Update player info
    async function updatePlayer(playerId, updatedData) {
      if (!user.value) {
        alert("Please login first");
        return;
      }
      
      try {
        const playerDocRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerDocRef);
        
        if (!playerDoc.exists()) {
          throw new Error("Player not found");
        }
        
        // Check if user is authorized (convener or the player themselves)
        const playerData = playerDoc.data();
        if (user.value.email !== playerData.email && !isConvener.value) {
          throw new Error("You don't have permission to update this player");
        }
        
        // Update with new data and timestamp
        await updateDoc(playerDocRef, {
          ...updatedData,
          updatedAt: serverTimestamp()
        });
        
        alert("Player updated successfully");
      } catch (error) {
        console.error("Player update error:", error);
        alert(`Update failed: ${error.message}`);
      }
    }
    
    // Delete player
    async function deletePlayer(playerId) {
      if (!isConvener.value) {
        console.error("Only conveners can delete players");
        return;
      }
      
      if (confirm("Are you sure you want to delete this player?")) {
        try {
          await db.collection("players").doc(playerId).delete();
          console.log("Player deleted successfully");
        } catch (error) {
          console.error("Error deleting player:", error);
          alert("Failed to delete player. Please try again.");
        }
      }
    }
    
    // Load notifications from Firestore
    async function loadNotifications() {
      try {
        const querySnapshot = await getDocs(query(notificationsRef, orderBy("createdAt", "desc")));
        
        // Convert query snapshot to array of notification objects
        const notificationData = [];
        querySnapshot.forEach((doc) => {
          notificationData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        notifications.value = notificationData;
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
    }

    // Load alumni list
    async function loadAlumni() {
      try {
        const querySnapshot = await getDocs(query(alumniRef, orderBy("name")));
        
        // Convert query snapshot to array of alumni objects
        const alumniData = [];
        querySnapshot.forEach((doc) => {
          alumniData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        alumniList.value = alumniData;
      } catch (e) {
        console.error("Error loading alumni:", e);
      }
    }

    // Submit alumni registration
    async function submitAlumniRegistration() {
      alumniLoading.value = true;
      try {
        // Validate required fields
        if (!alumniForm.name || !alumniForm.email || !alumniForm.department) {
          throw new Error("Please fill all required fields");
        }
        
        // Check if alumni already exists
        const alumniQuery = query(alumniRef, where("email", "==", alumniForm.email));
        const existingAlumni = await getDocs(alumniQuery);
        
        if (!existingAlumni.empty) {
          throw new Error("You are already registered as alumni");
        }
        
        // Create alumni document
        const newAlumni = {
          name: alumniForm.name,
          email: alumniForm.email,
          contact: alumniForm.contact,
          department: alumniForm.department,
          createdAt: serverTimestamp()
        };
        
        await addDoc(alumniRef, newAlumni);
        
        // Reset form
        alumniForm.name = "";
        alumniForm.email = "";
        alumniForm.contact = "";
        alumniForm.department = "";
        
        alert("Alumni registered successfully");
      } catch (error) {
        console.error("Alumni registration error:", error);
        alert(`Registration failed: ${error.message}`);
      } finally {
        alumniLoading.value = false;
      }
    }
    
    // Load content based on tab
    async function loadContent(tabName) {
      console.log("Loading content for tab:", tabName);
      
      // Get the content area where pages will be displayed
      const contentArea = document.querySelector(".content-area");
      if (!contentArea) {
        console.error("Content area not found!");
        return;
      }
      
      try {
        // Show loading indicator
        contentArea.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="spinner w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin mx-auto"></div>
              <p class="mt-4 text-gray-600">Loading ${tabName}...</p>
            </div>
          </div>
        `;
        
        // Try to load the simple HTML version first (no Vue dependencies)
        let simplePage = `./pages/${tabName}-simple.html`;
        console.log(`Trying to fetch simplified content from ${simplePage}`);
        
        let response;
        try {
          response = await fetch(simplePage);
          if (!response.ok) {
            console.log(`Simple page not found, falling back to regular page`);
            // Fall back to regular page
            response = await fetch(`./pages/${tabName}.html`);
            if (!response.ok) {
              throw new Error(`Failed to load ${tabName}.html: ${response.status}`);
            }
          } else {
            console.log(`Loaded simplified ${tabName} page`);
          }
        } catch (err) {
          console.log(`Error loading simple page, trying regular page`);
          response = await fetch(`./pages/${tabName}.html`);
          if (!response.ok) {
            throw new Error(`Failed to load ${tabName}.html: ${response.status}`);
          }
        }
        
        let html = await response.text();
        
        // Strip out the surrounding HTML structure if it exists
        // (since we're injecting this into an existing page)
        const bodyStartIndex = html.indexOf("<body>");
        const bodyEndIndex = html.indexOf("</body>");
        
        if (bodyStartIndex !== -1 && bodyEndIndex !== -1) {
          html = html.substring(bodyStartIndex + 6, bodyEndIndex).trim();
        }
        
        // Insert the content into the page
        contentArea.innerHTML = html;
        
        // Instead of creating a new Vue app for the content, which isn't working properly,
        // use Vue's template compiler directly by adding the content to the main app's template
        
        // Process content with Vue
        console.log("Processing content with Vue...");
        
        // Get all Vue-related attributes and make them work
        // This is a workaround for Vue not being able to process dynamically loaded content
        
        // First, find and process all @click directives
        const clickElements = contentArea.querySelectorAll('[\\@click]');
        clickElements.forEach(element => {
          const clickAction = element.getAttribute('@click');
          element.removeAttribute('@click');
          element.addEventListener('click', () => {
            try {
              // Evaluate the action in the context of our app
              if (clickAction.includes('playerGender')) {
                const gender = clickAction.includes("'men'") ? 'men' : 'women';
                playerGender.value = gender;
                console.log("Set playerGender to:", gender);
              } else if (clickAction.includes('showPlayerForm')) {
                showPlayerForm.value = !showPlayerForm.value;
                console.log("Toggled showPlayerForm to:", showPlayerForm.value);
              } else {
                console.log("Unhandled click action:", clickAction);
              }
            } catch (e) {
              console.error("Error handling click event:", e);
            }
          });
        });
        
        console.log("Content processed with Vue handlers");
        
        console.log(`Content for ${tabName} loaded and Vue app mounted`);
        
        // Initialize any specific elements after loading content
        switch (tabName) {
          case "chat":
            // Scroll chat to bottom
            const chatContainer = document.getElementById("chatMessages");
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            break;
        }
      } catch (error) {
        console.error(`Error loading content for ${tabName}:`, error);
        contentArea.innerHTML = `<div class="error-message p-4 bg-red-100 text-red-700 rounded-lg">
          Failed to load ${tabName} content. Please try again.
        </div>`;
      }
    }
    
    // Setup Firebase auth state listener
    onMounted(() => {
      console.log("Vue app mounted");
      
      // Load initial content
      loadContent(tab.value);
      
      // Listen to auth state changes
      auth.onAuthStateChanged((firebaseUser) => {
        console.log("Auth state changed:", firebaseUser);
        
        if (firebaseUser) {
          // Check if email is from IISc domain
          if (firebaseUser.email && firebaseUser.email.endsWith('@iisc.ac.in')) {
            user.value = firebaseUser;
            // Set up realtime data listeners once user is authenticated
            setupFirebaseListeners();
          } else {
            // Log out users with non-IISc emails
            auth.signOut();
            user.value = null;
            alert("Only @iisc.ac.in email addresses are allowed to use this app.");
          }
        } else {
          user.value = null;
        }
      });
      
      // Load initial tab content
      loadContent(tab.value);
    });
    
    // Watch for tab changes to load content
    watch(tab, (newTab) => {
      loadContent(newTab);
    });
    
    return {
      tab,
      setTab,
      tabTitle,
      activeClass,
      inactiveClass,
      user,
      showEmailLogin,
      emailLoginForm,
      emailLoading,
      signInWithGoogle,
      signInWithMicrosoft,
      emailLogin,
      logout,
      showPlayerForm,
      playerForm,
      playerLoading,
      playerGender,
      filteredPlayers,
      players,
      submitPlayerRegistration,
      updatePlayer,
      deletePlayer,
      notifications,
      notificationLoading,
      addNotification,
      deleteNotification,
      voteInPoll,
      pollVotes,
      pollResults,
      loadPollResults,
      isConvener,
      alumniForm,
      alumniLoading,
      alumniList,
      submitAlumniRegistration,
      chatMessages,
      chatInput,
      sendMessage,
      deleteMessage,
      isRegisteredPlayer,
      formatDate,
      formatDateTime,
    };
  },
});

// Wait for DOM to be ready, then mount the app
document.addEventListener('DOMContentLoaded', () => {
  app.mount("#app");
  // Signal that app.js loaded successfully
  window.appLoaded = true;
  
  // Update debug info if available
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.innerHTML += "<br>✅ app.js loaded successfully";
  }
});