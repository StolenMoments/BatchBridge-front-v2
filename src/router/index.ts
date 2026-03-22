import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/batches' },
  { path: '/batches',               component: () => import('@/views/BatchListView.vue') },
  { path: '/batches/new',           component: () => import('@/views/BatchNewView.vue') },
  { path: '/batches/:id',           component: () => import('@/views/BatchDetailView.vue') },
  { path: '/batches/:batchId/prompts/:promptId', component: () => import('@/views/PromptDetailView.vue') }
]

export default createRouter({ history: createWebHistory(), routes })