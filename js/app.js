/* Line 86-87 contains conveners email */
// Import Vue
import { createApp, ref, reactive, computed, onMounted, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';

// Initialize Supabase client
const supabaseUrl = 'https://lehwftoxkznvwoqnxipt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaHdmdG94a3pudndvcW54aXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MjQ2MTgsImV4cCI6MjA2MjEwMDYxOH0.NzuD4dXtiWdZ9n3EWQGope9S7Pcn1b_lnGtgorwE6DU';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(supabaseUrl, supabaseKey);

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
      year_of_study: "",
      degree: "",
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

    const activeClass =
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500";
    const inactiveClass =
      "text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500";

    const tabTitle = computed(() => {
      switch (tab.value) {
        case "players":
          return "Player List";
        case "notifications":
          return "Notifications & Polls (Under Development)";
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
        (p) =>
          p.email === user.value.email &&
          p.name.toLowerCase() === (user.value.display_name || "").toLowerCase()
      );
    });

    // Format date
    function formatDate(timestamp) {
      if (!timestamp) return "";
      return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    
    function formatDateTime(timestamp) {
      if (!timestamp) return "";
      return new Date(timestamp).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

// Debug helper
function checkSupabaseConfig() {
  console.log("Current Supabase auth config:", supabase.auth.getSession());
}    
    // Login with Google
    async function signInWithGoogle() {
      checkSupabaseConfig();
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'https://shaukat23.github.io/IISc-Kho-Kho/',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
              hd: 'iisc.ac.in',
            },
          },
        });
        
        if (error) throw error;
        
        // Email domain restriction handled by hd param above
      } catch (e) {
        console.error("OAuth error details:", e);
        alert("Login failed: " + e.message);
      }
    }

    // Login with Microsoft
    async function signInWithMicrosoft() {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            queryParams: {
              domain_hint: 'iisc.ac.in',
            },
          },
        });
        
        if (error) throw error;
        // Email domain check will be performed in the auth state change listener
      } catch (e) {
        alert("Login failed: " + e.message);
      }
    }

    // Email login/register with domain restriction
    async function emailLogin() {
      emailLoading.value = true;
      try {
        if (!emailLoginForm.email.endsWith("@iisc.ac.in")) {
          alert("Only @iisc.ac.in emails are allowed.");
          emailLoading.value = false;
          return;
        }
        
        // Try sign in first
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailLoginForm.email,
          password: emailLoginForm.password
        });
        
        if (error && error.status === 400) {
          // User doesn't exist, try to sign up
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailLoginForm.email,
            password: emailLoginForm.password
          });
          
          if (signUpError) throw signUpError;
          
          alert("Verification email sent. Please check your inbox.");
        } else if (error) {
          throw error;
        }
      } catch (e) {
        alert("Login failed: " + e.message);
      } finally {
        emailLoading.value = false;
      }
    }

    // Logout
    async function logout() {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Logout error:", error);
      user.value = null;
      // Navigate to players tab after logout
      setTab('players');
    }

    // Load players from Supabase
    async function loadPlayers() {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*');
        
        if (error) throw error;
        
        // Debug log to check column names
        if (data && data.length > 0) {
          console.log("Sample player data:", data[0]);
        }
        
        players.value = data || [];
      } catch (e) {
        console.error("Error loading players:", e);
      }
    }

    // Submit player registration
    async function submitPlayerRegistration() {
      if (!user.value) {
        alert("Please login first.");
        return;
      }
      
      playerLoading.value = true;
      try {
        // Use user display_name if available and playerForm.name empty
        if (!playerForm.name && user.value.user_metadata?.full_name) {
          playerForm.name = user.value.user_metadata.full_name;
        }
        
        // Check if already registered
        const existing = players.value.find(
          (p) => p.email === user.value.email
        );
        
        if (existing) {
          alert("You are already registered as a player.");
          playerLoading.value = false;
          showPlayerForm.value = false;
          return;
        }
        
        // Add player to Supabase
        const newPlayer = {
          name: playerForm.name,
          email: user.value.email,
          contact: parseInt(playerForm.contact.replace(/\D/g, ''), 10),
          player_type: playerForm.player_type,
          department: playerForm.department,
          year_of_study: parseInt(playerForm.year_of_study) || 1,
          degree: playerForm.degree,
          category: playerGender.value,
        };
        
        const { error } = await supabase
        .from('players')
        .insert([newPlayer]);
          
        if (error) throw error;

        // Reload players to get updated list including new player
        await loadPlayers();
        
        
        alert("Player registered successfully.");
        showPlayerForm.value = false;
        
        // Reset form
        playerForm.name = "";
        playerForm.contact = "";
        playerForm.player_type = "";
        playerForm.department = "";
        playerForm.year_of_study = "";
        playerForm.degree = "";

      } catch (e) {
        console.error("Full player registration error:", e);
        alert("Registration failed: " + e.message);
      } finally {
        playerLoading.value = false;
      }
    }

    // Load notifications from Supabase - MODIFIED TO RETURN EMPTY ARRAY
    async function loadNotifications() {
      // Set notifications to empty array - feature under development
      notifications.value = [];
      console.log("Notifications feature is under development");
    }

    // Load alumni list
    async function loadAlumni() {
      try {
        const { data, error } = await supabase
          .from('alumni')
          .select('*')
          .order('name');
          
        if (error) throw error;
        alumniList.value = data || [];
      } catch (e) {
        console.error("Error loading alumni:", e);
      }
    }

    // Submit alumni registration
    async function submitAlumniRegistration() {
      if (!alumniForm.email.endsWith("@iisc.ac.in")) {
        alert("Only @iisc.ac.in emails are allowed.");
        return;
      }
      
      alumniLoading.value = true;
      try {
        // Check if already registered
        const existing = alumniList.value.find(
          (a) => a.email.toLowerCase() === alumniForm.email.toLowerCase()
        );
        
        if (existing) {
          alert("You are already registered as alumni.");
          alumniLoading.value = false;
          return;
        }
        
        const newAlum = {
          name: alumniForm.name,
          email: alumniForm.email,
          contact: alumniForm.contact,
          department: alumniForm.department,
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from('alumni')
          .insert([newAlum])
          .select();
          
        if (error) throw error;
        
        alumniList.value.push(data[0]);
        alert("Alumni registered successfully.");
        
        // Reset form
        alumniForm.name = "";
        alumniForm.email = "";
        alumniForm.contact = "";
        alumniForm.department = "";
      } catch (e) {
        alert("Registration failed: " + e.message);
      } finally {
        alumniLoading.value = false;
      }
    }
    // Load chat messages
    async function loadChatMessages() {
      try {
        // First load existing messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at');
          
        if (error) throw error;
        chatMessages.value = data || [];
        
        // Then set up real-time subscription
        supabase
          .channel('public:messages')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            payload => {
              chatMessages.value.push(payload.new);
            }
          )
          .subscribe();
          
      } catch (e) {
        console.error("Error loading messages:", e);
      }
    }

    // Watch user changes to reload data
    watch(
      user,
      (newUser) => {
        console.log("User changed:", newUser ? newUser.email : "logged out");
        if (newUser) {
          // Force immediate data load
          Promise.all([
            loadPlayers(),
            loadNotifications(),
            loadAlumni(),
            loadChatMessages()
          ]).then(() => {
            console.log("All data loaded after login");
          });
        } else {
          players.value = [];
          notifications.value = [];
          alumniList.value = [];
          chatMessages.value = [];
        }
      },
      { immediate: true }
    );

    // Supabase auth state listener
    onMounted(() => {
      supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          // Check email domain
          if (session.user.email && session.user.email.endsWith('@iisc.ac.in')) {
            user.value = session.user;
          } else {
            alert("Only @iisc.ac.in emails are allowed.");
            supabase.auth.signOut();
            user.value = null;
          }
        } else {
          user.value = null;
        }
      });
      
      // Check current auth state
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          if (session.user.email && session.user.email.endsWith('@iisc.ac.in')) {
            user.value = session.user;
          }
        }
      });
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
      notifications,
      notificationLoading,
      pollVotes,
      pollResults,
      isConvener,
      alumniForm,
      alumniLoading,
      alumniList,
      submitAlumniRegistration,
      chatMessages,
      chatInput,
      sendMessage,
      isRegisteredPlayer,
      formatDate,
      formatDateTime,
    };
  },
});

// Wait for DOM to be ready, then mount the app
document.addEventListener('DOMContentLoaded', () => {
  app.mount("#app");
});