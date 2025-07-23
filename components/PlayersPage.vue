<template>
  <section id="players-page" class="py-8">
    <div class="flex flex-col md:flex-row justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Our Players</h2>
      <div class="flex items-center space-x-4">
        <select v-model="playerGender" @change="applyPlayerFilter"
          class="border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500">
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <button v-if="user && isConvener" @click="showPlayerForm = true; playerForm = { gender: 'Male', isCaptain: false, isAdmin: false, isPlaying: true }"
          class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          <i class="fas fa-user-plus mr-2"></i> Add Player
        </button>
        <button v-if="user && !isRegisteredPlayer" @click="showPlayerForm = true; playerForm = { gender: 'Male', isCaptain: false, isAdmin: false, isPlaying: true }"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          <i class="fas fa-user-plus mr-2"></i> Register as Player
        </button>
        <button v-if="user && isRegisteredPlayer" @click="editPlayer(players.find(p => p.id === user.uid))"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          <i class="fas fa-edit mr-2"></i> Edit My Profile
        </button>
      </div>
    </div>

    <!-- Player Registration/Edit Form Modal -->
    <div v-if="showPlayerForm" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h3 class="text-2xl font-semibold mb-6 text-gray-800">{{ playerForm.id ? 'Edit Player' : 'Register Player' }}</h3>
        <form @submit.prevent="submitPlayerRegistration" class="space-y-4">
          <div>
            <label for="playerName" class="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" id="playerName" v-model="playerForm.name" required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500">
          </div>
          <div>
            <label for="playerRollNo" class="block text-sm font-medium text-gray-700">Roll No.</label>
            <input type="text" id="playerRollNo" v-model="playerForm.rollNo" required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500">
          </div>
          <div>
            <label for="playerGender" class="block text-sm font-medium text-gray-700">Gender</label>
            <select id="playerGender" v-model="playerForm.gender" required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label for="playerPhone" class="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" id="playerPhone" v-model="playerForm.phone"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500">
          </div>
          <div>
            <label for="playerHostel" class="block text-sm font-medium text-gray-700">Hostel</label>
            <input type="text" id="playerHostel" v-model="playerForm.hostel"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500">
          </div>
          <div>
            <label for="playerDepartment" class="block text-sm font-medium text-gray-700">Department</label>
            <input type="text" id="playerDepartment" v-model="playerForm.department"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500">
          </div>
          <div v-if="isConvener" class="flex items-center">
            <input type="checkbox" id="isCaptain" v-model="playerForm.isCaptain"
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
            <label for="isCaptain" class="ml-2 block text-sm text-gray-900">Is Captain?</label>
          </div>
          <div v-if="isConvener" class="flex items-center">
            <input type="checkbox" id="isAdmin" v-model="playerForm.isAdmin"
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
            <label for="isAdmin" class="ml-2 block text-sm text-gray-900">Is Admin?</label>
          </div>
          <div v-if="isConvener" class="flex items-center">
            <input type="checkbox" id="isPlaying" v-model="playerForm.isPlaying"
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
            <label for="isPlaying" class="ml-2 block text-sm text-gray-900">Currently Playing?</label>
          </div>
          <div>
            <label for="playerAchievements" class="block text-sm font-medium text-gray-700">Achievements</label>
            <textarea id="playerAchievements" v-model="playerForm.achievements" rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"></textarea>
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" @click="showPlayerForm = false"
              class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300">
              Cancel
            </button>
            <button type="submit"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
              :disabled="playerLoading">
              <i v-if="playerLoading" class="fas fa-spinner fa-spin mr-2"></i>
              {{ playerForm.id ? 'Update Player' : 'Register Player' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Players List -->
    <div v-if="playerLoading && players.length === 0" class="text-center py-8">
      <i class="fas fa-spinner fa-spin text-4xl text-red-500"></i>
      <p class="mt-4 text-gray-600">Loading players...</p>
    </div>
    <div v-else-if="filteredPlayers.length === 0" class="text-center py-8 text-gray-600">
      No players found for the selected filter.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="player in filteredPlayers" :key="player.id" class="card p-6 flex flex-col items-center text-center">
        <img :src="player.imageUrl || 'https://via.placeholder.com/150'" alt="Player Image"
          class="w-24 h-24 rounded-full object-cover mb-4 shadow">
        <h3 class="text-xl font-semibold text-gray-800">{{ player.name }}</h3>
        <p class="text-gray-600">{{ player.rollNo }}</p>
        <p class="text-gray-500 text-sm">{{ player.department }}</p>
        <p v-if="player.isCaptain" class="text-red-600 font-medium text-sm mt-2">Captain</p>
        <p v-if="player.isPlaying" class="text-green-600 font-medium text-sm">Playing</p>
        <p v-else class="text-yellow-600 font-medium text-sm">Not Playing</p>

        <div class="mt-4 flex space-x-2" v-if="user && isConvener">
          <button @click="editPlayer(player)"
            class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-300">
            Edit
          </button>
          <button @click="deletePlayer(player.id)"
            class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-300">
            Delete
          </button>
          <button @click="updatePlayer({ ...player, isPlaying: !player.isPlaying })"
            class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-300">
            Toggle Playing
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
// Firebase imports - assuming firebase is globally available or imported in main app.js
const auth = firebase.auth();
const db = firebase.firestore();
const playersCollection = db.collection('players');

export default {
  props: ['user', 'isConvener', 'isRegisteredPlayer'], // Pass user and admin status from main app
  data() {
    return {
      showPlayerForm: false,
      playerForm: {
        id: null,
        name: '',
        email: '',
        rollNo: '',
        gender: 'Male',
        phone: '',
        hostel: '',
        department: '',
        isCaptain: false,
        isAdmin: false,
        isPlaying: true,
        achievements: '',
        imageUrl: '',
        timestamp: null,
      },
      playerLoading: false,
      playerGender: 'All', // Filter for players
      players: [],
      filteredPlayers: [],
    };
  },
  watch: {
    // Watch for changes in the user prop to re-fetch players or update registration status
    user: {
      immediate: true, // Run on component mount
      handler(newUser) {
        if (newUser) {
          this.fetchPlayers();
        } else {
          // Clear player data if user logs out
          this.players = [];
          this.filteredPlayers = [];
          // isRegisteredPlayer and isConvener are props, their values will come from parent
        }
      }
    }
  },
  methods: {
    async submitPlayerRegistration() {
      this.playerLoading = true;
      try {
        if (!this.user) {
          alert("Please sign in to register as a player.");
          this.playerLoading = false;
          return;
        }

        const playerRef = playersCollection.doc(this.user.uid);
        const playerDoc = await playerRef.get();

        const playerToSave = {
          ...this.playerForm,
          email: this.user.email,
          name: this.playerForm.name || this.user.displayName,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (playerDoc.exists) {
          await playerRef.update(playerToSave);
          alert("Player profile updated successfully!");
        } else {
          await playerRef.set(playerToSave);
          alert("Player registered successfully!");
        }
        this.showPlayerForm = false;
        this.fetchPlayers(); // Refresh player list
        this.$emit('player-status-changed'); // Emit event to parent to update isRegisteredPlayer/isConvener
      } catch (error) {
        console.error("Error saving player:", error);
        alert("Error saving player: " + error.message);
      } finally {
        this.playerLoading = false;
      }
    },

    async fetchPlayers() {
      this.playerLoading = true;
      try {
        const snapshot = await playersCollection.orderBy('name').get();
        this.players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.applyPlayerFilter();
        // The parent component (app.js) will handle setting isRegisteredPlayer and isConvener based on global user state.
        // This component just fetches the list.
        this.$emit('players-fetched', this.players); // Emit to parent for global state update
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        this.playerLoading = false;
      }
    },
    applyPlayerFilter() {
      if (this.playerGender === 'All') {
        this.filteredPlayers = this.players;
      } else {
        this.filteredPlayers = this.players.filter(player => player.gender === this.playerGender);
      }
    },
    editPlayer(player) {
      this.playerForm = { ...player };
      this.showPlayerForm = true;
    },
    async deletePlayer(id) {
      if (!this.isConvener) {
        alert("You do not have permission to delete players.");
        return;
      }
      if (confirm("Are you sure you want to delete this player?")) {
        try {
          await playersCollection.doc(id).delete();
          alert("Player deleted successfully!");
          this.fetchPlayers();
          this.$emit('player-status-changed'); // Emit event to parent
        } catch (error) {
          console.error("Error deleting player:", error);
          alert("Error deleting player: " + error.message);
        }
      }
    },
    async updatePlayer(player) {
      if (!this.isConvener) {
        alert("You do not have permission to update players.");
        return;
      }
      try {
        await playersCollection.doc(player.id).update(player);
        console.log(`Player ${player.name} updated.`);
        this.fetchPlayers(); // Refresh list to reflect changes
      } catch (error) {
        console.error("Error updating player:", error);
        alert("Error updating player: " + error.message);
      }
    },
  },
  created() {
    // Initial fetch might be handled by watch:user or by parent if component is mounted after user state is known.
    // If not using watch, could call this.fetchPlayers() here.
  }
};
</script>

<style scoped>
/* You can add component-specific styles here if needed */
/* Most styles are likely global in styles.css or Tailwind */
</style>