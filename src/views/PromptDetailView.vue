<template>
  <div class="prompt-detail-page" v-if="prompt">
    <header class="detail-header">
      <div class="header-left">
        <button @click="goBack" class="btn-back">← 돌아가기</button>
        <h2>프롬프트 상세: {{ prompt.label || '질문 ' + promptId }}</h2>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="prompt.status.toLowerCase()">{{ prompt.status }}</span>
      </div>
    </header>

    <div class="content-grid">
      <section class="prompt-section card">
        <h3>User Prompt</h3>
        <div class="markdown-body" v-html="renderMarkdown(prompt.userPrompt)"></div>
      </section>

      <section class="prompt-section card" v-if="prompt.systemPrompt">
        <h3>System Prompt</h3>
        <div class="markdown-body" v-html="renderMarkdown(prompt.systemPrompt)"></div>
      </section>

      <section class="prompt-section card answer-card" v-if="prompt.responseContent">
        <h3>Answer Prompt</h3>
        <div class="markdown-body" v-html="renderMarkdown(prompt.responseContent)"></div>
      </section>
      
      <section class="prompt-section card error-card" v-else-if="prompt.status === 'FAILED'">
        <h3>Error Message</h3>
        <p class="error-msg">{{ prompt.errorMessage || '알 수 없는 오류가 발생했습니다.' }}</p>
      </section>

      <section class="prompt-section card pending-card" v-else>
        <h3>Answer</h3>
        <p class="pending-msg">응답을 기다리는 중입니다...</p>
      </section>
    </div>
  </div>
  <div v-else-if="loading" class="loading-state">
    <div class="spinner-large"></div>
    <p>프롬프트 정보를 불러오는 중입니다...</p>
  </div>
  <div v-else class="error-state">
    <p>프롬프트를 찾을 수 없습니다.</p>
    <button @click="goBack" class="btn-primary">배치 상세로 돌아가기</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPromptDetail } from '@/api/prompt'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Prompt } from '@/types/api'

const route = useRoute()
const router = useRouter()
const batchId = route.params.batchId as string
const promptId = route.params.promptId as string

const prompt = ref<Prompt | null>(null)
const loading = ref<boolean>(true)

const loadPrompt = async () => {
  try {
    loading.value = true
    const response = await fetchPromptDetail(batchId, promptId)
    if (response.success) {
      prompt.value = response.data!
    }
  } catch (error) {
    console.error('Failed to fetch prompt detail:', error)
  } finally {
    loading.value = false
  }
}

const renderMarkdown = (content: string | null | undefined): string => {
  if (!content) return ''
  const rawHtml = marked.parse(content) as string
  return DOMPurify.sanitize(rawHtml)
}

const goBack = () => {
  router.push(`/batches/${batchId}`)
}

onMounted(loadPrompt)
</script>

<style scoped>
.prompt-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-back {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 1.1em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-back:hover {
  background-color: #f0f7ff;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9em;
  text-transform: uppercase;
}

.status-badge.completed { background-color: #d4edda; color: #155724; }
.status-badge.failed { background-color: #f8d7da; color: #721c24; }
.status-badge.in_progress { background-color: #cce5ff; color: #004085; }
.status-badge.draft { background-color: #e2e3e5; color: #383d41; }

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.prompt-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.2em;
  color: #333;
  border-left: 4px solid #007bff;
  padding-left: 12px;
}

.markdown-body {
  line-height: 1.6;
  color: #444;
}

.answer-card {
  border-top: 4px solid #28a745;
}

.error-card {
  border-top: 4px solid #dc3545;
}

.error-msg {
  color: #dc3545;
  background: #fff5f5;
  padding: 12px;
  border-radius: 4px;
}

.pending-msg {
  color: #6c757d;
  font-style: italic;
}

.loading-state, .error-state {
  text-align: center;
  padding: 100px 20px;
}

.spinner-large {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 15px;
}
</style>
