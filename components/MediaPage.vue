<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-6">Kho-Kho Media</h2>
    
    <!-- Video Gallery -->
    <section class="mb-10">
      <h3 class="text-xl font-semibold mb-4">Videos</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Video Card 1 -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="aspect-w-16 aspect-h-9">
            <iframe 
              src="https://www.youtube.com/embed/example1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              class="w-full h-full"
            ></iframe>
          </div>
          <div class="p-4">
            <h4 class="font-medium text-gray-900 mb-1">IISc Kho-Kho Tournament Finals</h4>
            <p class="text-sm text-gray-500">May 15, 2025</p>
          </div>
        </div>
        
        <!-- Video Card 2 -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="aspect-w-16 aspect-h-9">
            <iframe 
              src="https://www.youtube.com/embed/example2" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              class="w-full h-full"
            ></iframe>
          </div>
          <div class="p-4">
            <h4 class="font-medium text-gray-900 mb-1">Kho-Kho Training Session</h4>
            <p class="text-sm text-gray-500">April 3, 2025</p>
          </div>
        </div>
        
        <!-- Video Card 3 -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="aspect-w-16 aspect-h-9">
            <iframe 
              src="https://www.youtube.com/embed/example3" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              class="w-full h-full"
            ></iframe>
          </div>
          <div class="p-4">
            <h4 class="font-medium text-gray-900 mb-1">Inter-IIT Sports Meet Highlights</h4>
            <p class="text-sm text-gray-500">March 22, 2025</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Photo Gallery -->
    <section>
      <h3 class="text-xl font-semibold mb-4">Photos</h3>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Photo 1 -->
        <div class="relative group overflow-hidden rounded-lg shadow-md">
          <img 
            src="https://via.placeholder.com/300x200?text=Team+Photo" 
            alt="Team Photo" 
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
            <span class="text-white opacity-0 group-hover:opacity-100 font-medium transition-opacity duration-300">
              Team Photo 2025
            </span>
          </div>
        </div>
        
        <!-- Photo 2 -->
        <div class="relative group overflow-hidden rounded-lg shadow-md">
          <img 
            src="https://via.placeholder.com/300x200?text=Match+Day" 
            alt="Match Day" 
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
            <span class="text-white opacity-0 group-hover:opacity-100 font-medium transition-opacity duration-300">
              Match Day
            </span>
          </div>
        </div>
        
        <!-- Photo 3 -->
        <div class="relative group overflow-hidden rounded-lg shadow-md">
          <img 
            src="https://via.placeholder.com/300x200?text=Training" 
            alt="Training Session" 
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
            <span class="text-white opacity-0 group-hover:opacity-100 font-medium transition-opacity duration-300">
              Training Session
            </span>
          </div>
        </div>
        
        <!-- Photo 4 -->
        <div class="relative group overflow-hidden rounded-lg shadow-md">
          <img 
            src="https://via.placeholder.com/300x200?text=Award+Ceremony" 
            alt="Award Ceremony" 
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
            <span class="text-white opacity-0 group-hover:opacity-100 font-medium transition-opacity duration-300">
              Award Ceremony
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  // No specific data or methods needed for this static component
};
</script>

<style scoped>
/* Add any component-specific styles here if necessary */
</style>
