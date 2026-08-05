import { createRouter, createWebHashHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/',
    name: 'WeatherHome',
    component: () => import('@/views/WeatherHomeView.vue'),
    meta: { title: '오늘의 날씨', layout: 'weather-scene' },
  },
  {
    path: '/travel',
    name: 'TravelPlanner',
    component: () => import('@/views/TravelPlannerView.vue'),
    meta: {
      title: '여행 날씨 계획',
      layout: 'weather-scene',
    },
  },
  {
    path: '/trips',
    name: 'Trips',
    component: () => import('@/views/TripsView.vue'),
    meta: { title: '내 여행', layout: 'weather-scene', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '로그인', layout: 'weather-scene' },
  },
  {
    path: '/weather/:cityId',
    name: 'WeatherDetail',
    component: () => import('@/views/WeatherDetailView.vue'),
    meta: { title: '도시 날씨', layout: 'weather-scene' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음', layout: 'weather-scene' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'CatchAll',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음', layout: 'weather-scene' },
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.name === 'Login' && authStore.isLoggedIn) {
    return { name: 'Trips' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | Weather` : 'Weather'
})

export default router
