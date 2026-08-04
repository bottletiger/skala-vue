import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/practice',
      name: 'practice',
      component: () => import('../components/Practice.vue'),
    },
    {
      path: '/',
      name: 'weather',
      component: () => import('../views/WeatherHomeView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/WeatherAboutView.vue')
    },
    {
      path: '/weather/:cityId',
      name: 'detail',
      component: () => import('../views/WeatherDetailView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})


export default router
