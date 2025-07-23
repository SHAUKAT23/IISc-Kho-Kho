<template>
  <div class="p-4 flex flex-col h-full">
    <h2 class="text-2xl font-bold mb-4">Team Chat</h2>
    
    <div v-if="!user" class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-md mb-6">
      <h3 class="font-semibold text-lg">Please Login</h3>
      <p>You must be logged in to access the chat.</p>
    </div>
    
    <div v-else-if="!isRegisteredPlayer" class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-md mb-6">
      <h3 class="font-semibold text-lg">Registration Required</h3>
      <p>You must register as a player to access the team chat.</p>
      <button 
        @click="$emit('change-page', 'players')" 
        class="mt-4 bg-yellow-700 hover:bg-yellow-800 text-white py-2 px-4 rounded-md transition-colors">
        Go to Player Registration
      </button>
    </div>
    
    <!-- Chat Interface -->
    <div v-else class="flex flex-col h-full">
      <!-- Chat Messages -->
      <div 
        id="chatMessages" 
        class="flex-1 overflow-y-auto p-4 space-y-4 border border-gray-200 rounded-md bg-gray-50 mb-4 h-96"
      >
        <template v-if="chatMessages.length === 0">
          <div class="text-center py-10 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        </template>
        
        <template v-else>
          <div 
            v-for="message in chatMessages" 
            :key="message.id" 
            :class="message.userId === user?.uid ? 'ml-auto max-w-xs md:max-w-md' : 'mr-auto max-w-xs md:max-w-md'"
            class="rounded-lg p-4 shadow-sm"
            :style="message.userId === user?.uid ? 'background-color: #e3f2fd;' : 'background-color: #f5f5f5;'"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0 mr-3">
                <div v-if="message.user_photo" class="h-8 w-8 rounded-full overflow-hidden">
                  <img :src="message.user_photo" alt="Profile" class="h-full w-full object-cover">
                </div>
                <div v-else class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span class="text-white font-medium text-sm">{{ message.userName?.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900">
                    {{ message.userName }}
                  </p>
                  <span class="text-xs text-gray-500">
                    {{ formatDateTime(message.timestamp) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-800 mt-1 break-words">
                  {{ message.message }}
                </p>
                
                <!-- Delete button for own messages or conveners -->
                <button 
                  v-if="message.userId === user?.uid || isConvener"
                  @click="deleteMessage(message.id)" 
                  class="text-xs text-red-500 mt-1 opacity-60 hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <!-- Message Input -->
      <div class="mt-auto">
        <form @submit.prevent="sendMessage" class="flex space-x-2">
          <input 
            v-model="chatInput"
            type="text" 
            placeholder="Type your message..."
            class="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autocomplete="off"
          >
          <button 
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            :disabled="!chatInput.trim()"
          >
            <i class="fas fa-paper-plane mr-2"></i> Send
          </button>
        </form>
        
        <p class="text-xs text-gray-500 mt-2">
          This chat is only accessible to registered team members.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
// Firebase is assumed to be globally available or imported in the root app
const db = firebase.firestore();
const chatCollection = db.collection('chat');

export default {
  props: {
    user: Object,
    isRegisteredPlayer: Boolean,
    isConvener: Boolean,
  },
  data() {
    return {
      chatMessages: [],
      chatInput: '',
      chatListenerUnsubscribe: null, // To store the unsubscribe function
    };
  },
  watch: {
    user: { // Watch for user changes to set up/tear down listener
      immediate: true,
      handler(newUser, oldUser) {
        if (newUser && this.isRegisteredPlayer) {
          this.setupChatListener();
        } else if (this.chatListenerUnsubscribe) {
          this.chatListenerUnsubscribe(); // Unsubscribe if user logs out or is not registered
          this.chatListenerUnsubscribe = null;
          this.chatMessages = []; // Clear messages
        }
      }
    },
    isRegisteredPlayer: { // Watch for registration status changes
      immediate: true,
      handler(newStatus, oldStatus) {
        if (this.user && newStatus) {
          this.setupChatListener();
        } else if (this.chatListenerUnsubscribe) {
          this.chatListenerUnsubscribe();
          this.chatListenerUnsubscribe = null;
          this.chatMessages = [];
        }
      }
    }
  },
  methods: {
    async sendMessage() {
      if (!this.user || !this.chatInput.trim()) return;
      try {
        await chatCollection.add({
          userId: this.user.uid,
          userName: this.user.displayName || this.user.email,
          userPhoto: this.user.photoURL || null, // Include user photo if available
          message: this.chatInput,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        this.chatInput = ''; // Clear input
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message: " + error.message);
      }
    },
    async deleteMessage(messageId) {
      if (!this.isConvener) {
        alert("You do not have permission to delete messages.");
        return;
      }
      if (confirm("Are you sure you want to delete this message?")) {
        try {
          await chatCollection.doc(messageId).delete();
          alert("Message deleted!");
        } catch (error) {
          console.error("Error deleting message:", error);
          alert("Error deleting message: " + error.message);
        }
      }
    },
    setupChatListener() {
      // Only set up listener if not already active and user is logged in and registered
      if (this.chatListenerUnsubscribe || !this.user || !this.isRegisteredPlayer) {
        return;
      }
      this.chatListenerUnsubscribe = chatCollection.orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
          this.chatMessages = snapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data(),
            // Ensure userId and userName are correct for display/logic
            userId: doc.data().userId || '',
            userName: doc.data().userName || '',
            message: doc.data().message || '',
            timestamp: doc.data().timestamp || null,
          }));
          // Auto-scroll to bottom
          this.$nextTick(() => {
            const chatMessagesDiv = document.getElementById('chatMessages');
            if (chatMessagesDiv) {
              chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
            }
          });
        }, error => {
          console.error("Error listening to chat messages:", error);
        });
    },
    formatDateTime(timestamp) {
      if (!timestamp) return 'N/A';
      // Convert Firebase Timestamp to JavaScript Date object
      // Check if timestamp is already a Date object (e.g., if data is mocked or pre-processed)
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    },
  },
  beforeUnmount() {
    // Unsubscribe from chat listener when component is unmounted
    if (this.chatListenerUnsubscribe) {
      this.chatListenerUnsubscribe();
      this.chatListenerUnsubscribe = null;
    }
  },
  mounted() {
    // Initial setup based on current props (user and isRegisteredPlayer)
    if (this.user && this.isRegisteredPlayer) {
      this.setupChatListener();
    }
  }
};
</script>

<style scoped>
/* Scrollbar for chat messages */
#chatMessages {
  scrollbar-width: thin;
  scrollbar-color: #a0aec0 transparent;
}
#chatMessages::-webkit-scrollbar {
  width: 8px;
}
#chatMessages::-webkit-scrollbar-track {
  background: transparent;
}
#chatMessages::-webkit-scrollbar-thumb {
  background-color: #a0aec0;
  border-radius: 4px;
}
</style>