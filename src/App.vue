<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const router = useRouter()
let backButtonListener = null

onMounted(async () => {
  if (!Capacitor.isNativePlatform()) return
  backButtonListener = await App.addListener('backButton', () => {
    const history = window.history
    if (history.length > 1 && router.currentRoute.value.path !== '/') {
      router.back()
    } else {
      App.minimizeApp()
    }
  })
})

onUnmounted(() => {
  backButtonListener?.remove()
})
</script>

<template>
  <router-view />
</template>
