<template>
  <div class="p-6">
    <!-- User Not Logged In -->
    <div v-if="!user" class="max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-6">Login / Register</h2>
      
      <div class="bg-white shadow-md rounded-lg p-6">
        <p class="text-gray-700 mb-6">
          Sign in with your IISc email to access team features, register as a player, participate in polls, and use the team chat.
        </p>
        
        <div class="space-y-4">
          <button
            @click="signInWithGoogle"
            class="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-md py-2 hover:bg-gray-100 focus:outline-none"
          >
            <i class="fab fa-google fa-lg text-red-500"></i>
            <span>Continue with Google</span>
          </button>
          
          <button
            @click="signInWithMicrosoft"
            class="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-md py-2 hover:bg-gray-100 focus:outline-none"
          >
            <i class="fab fa-microsoft fa-lg text-green-600"></i>
            <span>Continue with Microsoft</span>
          </button>
          
          <button
            @click="showEmailLogin = !showEmailLogin"
            class="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 focus:outline-none"
          >
            {{ showEmailLogin ? 'Hide Email Form' : 'Login / Register with Email' }}
          </button>
        </div>
        
        <form v-if="showEmailLogin" @submit.prevent="emailLogin" class="space-y-4 border-t border-gray-200 pt-4 mt-4">
          <div>
            <label for="emailInput" class="block text-sm font-medium text-gray-700">Email (must be @iisc.ac.in)</label>
            <input
              id="emailInput"
              v-model="emailLoginForm.email"
              type="email"
              required
              placeholder="yourname@iisc.ac.in"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
          
          <div>
            <label for="passwordInput" class="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="passwordInput"
              v-model="emailLoginForm.password"
              type="password"
              required
              minlength="6"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
          
          <button
            type="submit"
            :disabled="emailLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold focus:outline-none disabled:opacity-50"
          >
            {{ emailLoading ? 'Processing...' : 'Login / Register' }}
          </button>
        </form>
        
        <div class="mt-4 text-sm text-gray-600">
          <p class="text-center">
            Only @iisc.ac.in email addresses are allowed to use this app.
          </p>
        </div>
      </div>
    </div>
    
    <!-- User Logged In -->
    <div v-else>
      <h2 class="text-2xl font-bold mb-6">Your Account</h2>
      
      <div class="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <!-- User Profile -->
        <div class="flex items-center space-x-4 mb-6">
          <div class="flex-shrink-0">
            <div v-if="user.photoURL" class="h-16 w-16 rounded-full overflow-hidden">
              <img :src="user.photoURL" alt="Profile" class="h-full w-full object-cover">
            </div>
            <div v-else class="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <span class="text-white font-medium text-xl">{{ user.email.charAt(0).toUpperCase() }}</span>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <p class="text-xl font-semibold text-gray-900 truncate">
              {{ user.displayName || user.email.split('@')[0] }}
            </p>
            <p class="text-sm text-gray-500">
              {{ user.email }}
            </p>
          </div>
        </div>
        
        <!-- Account Status -->
        <div class="space-y-4 mb-6">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div>
              <p class="font-medium">Player Registration</p>
              <p class="text-sm text-gray-500">
                {{ isRegisteredPlayer ? 'You are registered as a player' : 'Not registered as a player' }}
              </p>
            </div>
            <div>
              <span 
                :class="isRegisteredPlayer ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" 
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ isRegisteredPlayer ? 'Registered' : 'Not Registered' }}
              </span>
            </div>
          </div>
          
          <div v-if="isConvener" class="flex items-center justify-between p-3 bg-blue-50 rounded-md">
            <div>
              <p class="font-medium">Convener Status</p>
              <p class="text-sm text-gray-500">You have administrator privileges</p>
            </div>
            <div>
              <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                Convener
              </span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="space-y-4">
          <button
            v-if="!isRegisteredPlayer"
            @click="$emit('change-page', 'players')"
            class="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Register as Player
          </button>
          
          <button
            @click="logout"
            class="w-full border border-gray-300 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Firebase auth is assumed to be globally available or imported in the root app
const auth = firebase.auth();

export default {
  props: {
    user: Object,
    isRegisteredPlayer: Boolean,
    isConvener: Boolean,
  },
  data() {
    return {
      showEmailLogin: false,
      emailLoginForm: {
        email: '',
        password: '',
      },
      emailLoading: false,
    };
  },
  methods: {
    async signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        await auth.signInWithPopup(provider);
        alert("Successfully signed in with Google!");
      } catch (error) {
        console.error("Error signing in with Google:", error.message);
        alert("Error signing in with Google: " + error.message);
      }
    },
    // NOTE: Microsoft login functionality requires additional Firebase configuration
    // and setup (e.g., Azure AD app registration). This is a placeholder.
    async signInWithMicrosoft() {
      alert("Microsoft login is not yet fully implemented. Please use Google or Email.");
      // const provider = new firebase.auth.OAuthProvider('microsoft.com');
      // try {
      //   await auth.signInWithPopup(provider);
      //   alert("Successfully signed in with Microsoft!");
      // } catch (error) {
      //   console.error("Error signing in with Microsoft:", error.message);
      //   alert("Error signing in with Microsoft: " + error.message);
      // }
    },
    async emailLogin() {
      this.emailLoading = true;
      const { email, password } = this.emailLoginForm;

      if (!email.endsWith('@iisc.ac.in')) {
        alert("Only @iisc.ac.in email addresses are allowed.");
        this.emailLoading = false;
        return;
      }

      try {
        // Try to sign in first
        await auth.signInWithEmailAndPassword(email, password);
        alert("Successfully signed in!");
      } catch (error) {
        // If sign-in fails, try to register
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          try {
            await auth.createUserWithEmailAndPassword(email, password);
            alert("Account created and signed in successfully!");
          } catch (registerError) {
            console.error("Error registering with email:", registerError.message);
            alert("Error registering: " + registerError.message);
          }
        } else {
          console.error("Error signing in with email:", error.message);
          alert("Error signing in: " + error.message);
        }
      } finally {
        this.emailLoading = false;
      }
    },
    async logout() {
      try {
        await auth.signOut();
        alert("Successfully signed out!");
        // No need to emit change-page here, the onAuthStateChanged in parent will handle it.
      } catch (error) {
        console.error("Error logging out:", error.message);
        alert("Error logging out: " + error.message);
      }
    },
  },
};
</script>

<style scoped>
/* Add any component-specific styles here if necessary */
</style>
