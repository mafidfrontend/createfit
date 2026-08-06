<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
import BottomNav from '~/components/BottomNav.vue'
import HomeHero from '~/components/home/HomeHero.vue'
import HomeSteps from '~/components/home/HomeSteps.vue'
import HomeAdvantages from '~/components/home/HomeAdvantages.vue'
import BrandFooter from '~/components/BrandFooter.vue'
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader show-menu />

    <main class="flex-1 pb-20">
      <HomeHero />
      <HomeSteps />
      <HomeAdvantages />
      <BrandFooter />
    </main>

    <BottomNav />
  </div>
</template>
