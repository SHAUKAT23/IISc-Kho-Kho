<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">Notifications & Polls</h2>
    
    <!-- Add Notification Button (for conveners) -->
    <div class="mb-6" v-if="isConvener">
      <button 
        @click="showNotificationModal = true"
        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
        Add New Announcement
      </button>
    </div>
    
    <!-- Add Notification Modal -->
    <div v-if="showNotificationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full relative">
        <!-- Close Button -->
        <button @click="closeNotificationModal" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        <h3 class="text-xl font-bold mb-4">New Announcement</h3>
        
        <form @submit.prevent="submitNotification" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Title</label>
            <input v-model="newNotificationForm.title" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Message</label>
            <textarea v-model="newNotificationForm.body" rows="4" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
          </div>
          
          <div class="flex items-center">
            <input type="checkbox" id="isPoll" v-model="newNotificationForm.isPoll" class="rounded text-blue-500 focus:ring-blue-500 h-4 w-4">
            <label for="isPoll" class="ml-2 text-sm text-gray-700">Create as poll</label>
          </div>
          
          <div v-if="newNotificationForm.isPoll" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Poll Options</label>
            <div class="space-y-2">
              <div v-for="(option, index) in newNotificationForm.pollOptions" :key="index" class="flex items-center">
                <input v-model="newNotificationForm.pollOptions[index]" type="text" :placeholder="`Option ${index + 1}`" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                <button type="button" @click="removePollOption(index)" class="ml-2 text-red-500">&times;</button>
              </div>
            </div>
            <button 
              type="button"
              @click="addPollOption"
              class="mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              + Add Option
            </button>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              @click="closeNotificationModal"
              class="px-4 py-2 border rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="notificationLoading"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
              {{ notificationLoading ? 'Submitting...' : 'Post' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Notifications List -->
    <div class="space-y-6">
      <div v-if="notifications.length === 0 && !notificationLoading" class="text-center py-12">
        <i class="fas fa-bell-slash text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
        <p class="text-gray-500">Check back later for team updates and announcements.</p>
      </div>
      <div v-if="notificationLoading" class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-4xl text-red-500"></i>
        <p class="mt-4 text-gray-600">Loading notifications...</p>
      </div>
      
      <template v-else>
        <div 
          v-for="notification in notifications" 
          :key="notification.id" 
          class="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <!-- Regular announcement -->
          <div v-if="!notification.isPoll" class="p-6">
            <div class="flex justify-between items-start">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ notification.title }}
              </h3>
              <span class="text-sm text-gray-500">
                {{ formatDateTime(notification.timestamp) }}
              </span>
            </div>
            
            <p class="mt-2 text-gray-700 whitespace-pre-line">
              {{ notification.body }}
            </p>
            
            <!-- Delete button (for conveners) -->
            <div v-if="isConvener" class="mt-4 flex justify-end">
              <button 
                @click="deleteNotification(notification.id)" 
                class="text-sm text-red-600 hover:text-red-800">
                Delete
              </button>
            </div>
          </div>
          
          <!-- Poll -->
          <div v-else class="p-6">
            <div class="flex justify-between items-start">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ notification.title }}
              </h3>
              <span class="text-sm text-gray-500">
                {{ formatDateTime(notification.timestamp) }}
              </span>
            </div>
            
            <p class="mt-2 text-gray-700">
              {{ notification.body }}
            </p>
            
            <div class="mt-4 space-y-2">
              <template v-for="(option, index) in notification.options" :key="index">
                <!-- Show results if user has voted or if poll is closed (not yet implemented) -->
                <div 
                  v-if="hasVoted(notification.id)" 
                  class="flex items-center"
                >
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm font-medium">{{ option.text }}</span>
                      <span class="text-sm text-gray-500">
                        {{ option.voters?.length || 0 }} votes
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        class="bg-blue-600 h-2.5 rounded-full" 
                        :style="`width: ${getVotePercentage(notification, index)}%`"
                      ></div>
                    </div>
                  </div>
                </div>
                
                <!-- Show voting buttons if user hasn't voted and is logged in/registered -->
                <button 
                  v-else-if="user && isRegisteredPlayer"
                  @click="voteInPoll(notification.id, index)" 
                  class="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
                >
                  {{ option.text }}
                </button>
                <p v-else class="text-sm text-gray-500">Login and register as a player to vote.</p>
              </template>
            </div>
            
            <!-- Delete button (for conveners) -->
            <div v-if="isConvener" class="mt-4 flex justify-end">
              <button 
                @click="deleteNotification(notification.id)" 
                class="text-sm text-red-600 hover:text-red-800">
                Delete
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
// Firebase is assumed to be globally available or imported in the root app
const db = firebase.firestore();
const notificationsCollection = db.collection('notifications');
const pollsCollection = db.collection('polls');

export default {
  props: {
    user: Object,
    isConvener: Boolean,
    isRegisteredPlayer: Boolean,
  },
  data() {
    return {
      notifications: [],
      notificationLoading: false,
      showNotificationModal: false,
      newNotificationForm: {
        title: '',
        body: '',
        isPoll: false,
        pollOptions: ['', ''], // Start with two empty options
      },
      // pollVotes: {}, // Not needed as vote status is checked directly from notification.options[x].voters
      // pollResults: {}, // Not needed as results are calculated dynamically
    };
  },
  watch: {
    user: {
      immediate: true,
      handler(newUser) {
        if (newUser) {
          this.fetchNotifications();
        } else {
          this.notifications = [];
        }
      }
    }
  },
  methods: {
    closeNotificationModal() {
      this.showNotificationModal = false;
      this.newNotificationForm = { // Reset form
        title: '',
        body: '',
        isPoll: false,
        pollOptions: ['', ''],
      };
    },
    addPollOption() {
      this.newNotificationForm.pollOptions.push('');
    },
    removePollOption(index) {
      if (this.newNotificationForm.pollOptions.length > 2) {
        this.newNotificationForm.pollOptions.splice(index, 1);
      } else {
        alert("A poll must have at least two options.");
      }
    },
    async submitNotification() {
      if (!this.isConvener) {
        alert("You do not have permission to add notifications.");
        return;
      }

      this.notificationLoading = true;
      try {
        let notificationData = {
          title: this.newNotificationForm.title,
          body: this.newNotificationForm.body,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          author: this.user.displayName || this.user.email,
          isPoll: this.newNotificationForm.isPoll,
        };

        if (this.newNotificationForm.isPoll) {
          const filteredOptions = this.newNotificationForm.pollOptions.filter(option => option.trim() !== '');
          if (filteredOptions.length < 2) {
            alert('Please add at least 2 non-empty options for the poll.');
            this.notificationLoading = false;
            return;
          }
          // Store poll options as an array of objects, each with 'text' and 'voters' array
          notificationData.options = filteredOptions.map(opt => ({ text: opt, voters: [] }));
          notificationData.totalVotes = 0;
        }
        
        await notificationsCollection.add(notificationData);
        alert("Announcement posted successfully!");
        this.closeNotificationModal();
        this.fetchNotifications();
      } catch (error) {
        console.error("Error adding notification:", error);
        alert("Error adding notification: " + error.message);
      } finally {
        this.notificationLoading = false;
      }
    },

    async fetchNotifications() {
      this.notificationLoading = true;
      try {
        const snapshot = await notificationsCollection.orderBy('timestamp', 'desc').get();
        this.notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        this.notificationLoading = false;
      }
    },
    async deleteNotification(id) {
      if (!this.isConvener) {
        alert("You do not have permission to delete notifications.");
        return;
      }
      if (confirm("Are you sure you want to delete this notification?")) {
        try {
          await notificationsCollection.doc(id).delete();
          alert("Notification deleted successfully!");
          this.fetchNotifications();
        } catch (error) {
          console.error("Error deleting notification:", error);
          alert("Error deleting notification: " + error.message);
        }
      }
    },
    async voteInPoll(notificationId, optionIndex) {
      if (!this.user) {
        alert("Please sign in to vote.");
        return;
      }
      if (!this.isRegisteredPlayer) {
        alert("You must be a registered player to vote in polls.");
        return;
      }

      try {
        const notificationRef = notificationsCollection.doc(notificationId);
        await db.runTransaction(async (transaction) => {
          const notificationDoc = await transaction.get(notificationRef);
          if (!notificationDoc.exists) {
            throw "Notification (poll) does not exist!";
          }

          const notificationData = notificationDoc.data();
          const userId = this.user.uid;

          // Ensure options array and voters array exist
          if (!notificationData.options || !Array.isArray(notificationData.options)) {
              notificationData.options = [];
          }
          if (!notificationData.options[optionIndex].voters) {
              notificationData.options[optionIndex].voters = [];
          }

          // Check if user has already voted in this poll
          const existingVoteOptionIndex = notificationData.options.findIndex(option =>
            option.voters && option.voters.includes(userId)
          );

          // If user already voted, remove their vote from the old option
          if (existingVoteOptionIndex !== -1) {
            notificationData.options[existingVoteOptionIndex].voters = notificationData.options[existingVoteOptionIndex].voters.filter(voterId => voterId !== userId);
            notificationData.totalVotes--; // Decrement total votes if changing vote
          }

          // Add user's vote to the new option
          notificationData.options[optionIndex].voters.push(userId);
          notificationData.totalVotes++; // Increment total votes for new vote

          transaction.update(notificationRef, {
            options: notificationData.options,
            totalVotes: notificationData.totalVotes,
          });
        });
        alert("Vote cast successfully!");
        this.fetchNotifications(); // Re-fetch notifications to update UI with new results
      } catch (error) {
        console.error("Error voting:", error);
        alert("Error voting: " + error.message);
      }
    },
    hasVoted(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (!notification || !this.user || !notification.options) return false;
      return notification.options.some(option => option.voters && option.voters.includes(this.user.uid));
    },
    getVotePercentage(notification, optionIndex) {
      if (!notification.options || !notification.options[optionIndex]) return 0;
      const optionVotes = notification.options[optionIndex].voters?.length || 0;
      const totalVotes = notification.totalVotes || 0;
      return totalVotes === 0 ? 0 : (optionVotes / totalVotes) * 100;
    },
    formatDateTime(timestamp) {
      if (!timestamp) return 'N/A';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    },
  },
  created() {
    // fetchNotifications is called via the user watcher when the component is created/mounted and user is available.
  }
};
</script>

<style scoped>
/* Add component-specific styles here if needed */
</style>
