import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('@/views/VerifyEmailView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/verify-email-change',
    name: 'VerifyEmailChange',
    component: () => import('@/views/VerifyEmailView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/faq',
    name: 'Faq',
    component: () => import('@/views/FaqView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/components/AuthenticatedLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Inbox',
        component: () => import('@/views/NotificationsView.vue'),
      },
      {
        path: 'emails/:uid',
        name: 'EmailDetail',
        component: () => import('@/views/EmailDetailView.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/StatsView.vue'),
      },
    ],
  },
  {
    path: '/history',
    redirect: '/',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')
  if (to.meta.requiresAuth && !token) {
    return '/login'
  }
  if (to.path === '/login' && token) {
    return '/'
  }
})

export default router
