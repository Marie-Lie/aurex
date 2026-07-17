<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import ChatBot from './components/ChatBot.vue'
</script>

<template>
  <Navbar />
  <router-view />
  <ChatBot />
  <Footer />
</template>