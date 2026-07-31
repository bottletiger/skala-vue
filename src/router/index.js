import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('../components/Practice.vue'),
    },
    {
      path: '/assignment',
      name: 'assignment',
      component: () => import('../views/AssignmentView.vue'),
    },
  ],
})

export default router
