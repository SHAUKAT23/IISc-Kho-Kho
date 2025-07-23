<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">Alumni Network</h2>
    
    <!-- Registration Form -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Register as an Alumni</h3>
      
      <form @submit.prevent="submitAlumniRegistration" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Full Name</label>
          <input v-model="alumniForm.name" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="alumniForm.email" type="email" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Contact</label>
          <input v-model="alumniForm.contact" type="text" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Department at IISc</label>
          <input v-model="alumniForm.department" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
        </div>
        
        <button 
          type="submit"
          :disabled="alumniLoading || !user"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-50">
          {{ alumniLoading ? 'Submitting...' : 'Register' }}
        </button>
      </form>
      <p v-if="!user" class="text-red-500 text-sm mt-2">Please sign in to register as an alumni.</p>
    </div>
    
    <!-- Alumni List -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Alumni Members</h3>
      
      <div v-if="alumniList.length === 0" class="text-center py-12 bg-white rounded-lg shadow-md">
        <i class="fas fa-graduation-cap text-4xl text-gray-400 mb-4"></i>
        <h4 class="text-lg font-medium text-gray-900 mb-2">No alumni registered yet</h4>
        <p class="text-gray-500">Be the first to register as an alumni member.</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="alumni in alumniList" 
          :key="alumni.id" 
          class="bg-white rounded-lg shadow-md p-6"
        >
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-xl text-blue-600">{{ alumni.name.charAt(0) }}</span>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="text-lg font-semibold text-gray-900 truncate">
                {{ alumni.name }}
              </p>
              <p class="text-sm text-gray-500">
                {{ alumni.department }}
              </p>
              <p class="text-sm text-gray-500">
                {{ alumni.email }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Firebase is assumed to be globally available or imported in the root app
const db = firebase.firestore();
const alumniCollection = db.collection('alumni');

export default {
  props: {
    user: Object, // The currently logged-in user object
  },
  data() {
    return {
      alumniForm: {
        id: null,
        name: '',
        email: '',
        graduationYear: '', // This field was in app.js data but not in html form. Keeping for consistency.
        currentProfession: '', // This field was in app.js data but not in html form. Keeping for consistency.
        contact: '',
        department: '', // Added from HTML form
        imageUrl: '', // Keeping for consistency
        timestamp: null,
      },
      alumniLoading: false,
      alumniList: [],
    };
  },
  watch: {
    user: {
      immediate: true, // Fetch alumni when component is mounted and user prop is available
      handler(newUser) {
        if (newUser) {
          this.fetchAlumni();
          // Pre-fill email and name if user is logged in and form is empty
          if (!this.alumniForm.email) {
            this.alumniForm.email = newUser.email;
          }
          if (!this.alumniForm.name) {
            this.alumniForm.name = newUser.displayName;
          }
        } else {
          this.alumniList = []; // Clear list if user logs out
          this.alumniForm.email = ''; // Clear form fields
          this.alumniForm.name = '';
        }
      }
    }
  },
  methods: {
    async submitAlumniRegistration() {
      this.alumniLoading = true;
      try {
        if (!this.user) {
          alert("Please sign in to register as an alumni.");
          this.alumniLoading = false;
          return;
        }

        const alumniRef = alumniCollection.doc(this.user.uid);
        const alumniDoc = await alumniRef.get();

        const alumniToSave = {
          ...this.alumniForm,
          email: this.user.email, // Ensure email matches signed-in user
          name: this.alumniForm.name || this.user.displayName, // Use form name if provided, else Google name
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (alumniDoc.exists) {
          await alumniRef.update(alumniToSave);
          alert("Alumni profile updated successfully!");
        } else {
          await alumniRef.set(alumniToSave);
          alert("Alumni registered successfully!");
        }
        // No need to clear form as it might be pre-filled from user prop
        this.fetchAlumni();
      } catch (error) {
        console.error("Error saving alumni:", error);
        alert("Error saving alumni: " + error.message);
      } finally {
        this.alumniLoading = false;
      }
    },

    async fetchAlumni() {
      try {
        const snapshot = await alumniCollection.orderBy('name').get(); // Changed order to name for consistency
        this.alumniList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching alumni:", error);
      }
    },
  },
  created() {
    // fetchAlumni is called via the user watcher when the component is created/mounted and user is available.
  }
};
</script>

<style scoped>
/* Add any component-specific styles here if necessary */
</style>
