<template>
  <div class="batch-detail" v-if="batch">
    <header class="batch-header">
      <div class="header-main">
        <h2>배치명: {{ batch.label }}</h2>
        <div class="status-info">
          <span class="model-badge">{{ batch.model }}</span>
          <span class="status-badge" :class="batch.status.toLowerCase()">
            {{ getStatusLabel(batch.status) }}
          </span>
        </div>
      </div>
      <div class="header-sub">
        <p v-if="batch.status === 'DRAFT'">생성일시: {{ formatDate(batch.createdAt) }}</p>
        <p v-else-if="batch.completedAt">완료일시: {{ formatDate(batch.completedAt) }}</p>
        <p v-else-if="batch.submittedAt">제출일시: {{ formatDate(batch.submittedAt) }}</p>
        
        <button v-if="batch.status === 'IN_PROGRESS'" @click="handleSync" class="btn-sync" :disabled="syncing">
          {{ syncing ? '동기화 중...' : '동기화' }}
        </button>
      </div>
    </header>

    <!-- DRAFT 상태 UI -->
    <div v-if="batch.status === 'DRAFT'" class="draft-container">
      <div class="actions">
        <button @click="showAddForm = true" class="btn-primary">+ 프롬프트 추가</button>
      </div>

      <!-- 프롬프트 추가/수정 폼 -->
      <div v-if="showAddForm || editingPromptId" class="prompt-form card">
        <h3>{{ editingPromptId ? '프롬프트 수정' : '프롬프트 추가' }}</h3>
        <div class="form-group">
          <label>라벨 (선택)</label>
          <input v-model="promptForm.label" placeholder="예: 질문 1" />
        </div>
        <div class="form-group">
          <label @click="showSystemPrompt = !showSystemPrompt" class="clickable">
            System Prompt (선택) {{ showSystemPrompt ? '▼' : '▶' }}
          </label>
          <textarea v-if="showSystemPrompt" v-model="promptForm.systemPrompt" rows="3" placeholder="시스템 역할을 정의하세요..."></textarea>
        </div>
        <div class="form-group">
          <label>User Prompt (필수)</label>
          <textarea v-model="promptForm.userPrompt" rows="5" required placeholder="사용자 질문을 입력하세요..."></textarea>
        </div>
          <div class="form-actions">
          <button @click="cancelEdit" class="btn-secondary">취소</button>
          <button @click="savePrompt" class="btn-success" :disabled="!promptForm.userPrompt">
            {{ editingPromptId ? '수정완료' : '추가하기' }}
          </button>
        </div>
      </div>

      <!-- 프롬프트 목록 -->
      <div class="prompt-list">
        <div v-for="(prompt, index) in prompts" :key="prompt.id" class="prompt-card card clickable-row" @click="startEdit(prompt)">
          <div class="prompt-info">
            <div class="prompt-card-header">
              <h4>질문 {{ index + 1 }}</h4>
              <span v-if="prompt.label" class="prompt-label-text">{{ prompt.label }}</span>
            </div>
          </div>
          <div class="prompt-actions">
            <button @click.stop="handleDeletePrompt(prompt.id)" class="btn-sm btn-danger">삭제</button>
          </div>
        </div>
      </div>

      <footer class="detail-footer">
        <button @click="handleSubmit" class="btn-submit">
          제출하기 →
        </button>
      </footer>
    </div>

    <!-- IN_PROGRESS / COMPLETED / FAILED 상태 UI -->
    <div v-else class="results-container">
      <div v-if="batch.status === 'IN_PROGRESS'" class="progress-info card">
        <div class="spinner"></div>
        <p>프롬프트 {{ prompts.length }}개 처리 중...</p>
      </div>

      <div class="prompt-results">
        <div v-for="(prompt, index) in prompts" :key="prompt.id" class="result-card card" :class="prompt.status.toLowerCase()">
          <div class="result-header">
            <div class="result-title">
              <router-link :to="`/batches/${batchId}/prompts/${prompt.id}`" class="prompt-link">
                <h4>질문 {{ index + 1 }}</h4>
                <span v-if="prompt.label" class="result-label">{{ prompt.label }}</span>
              </router-link>
            </div>
            <span class="status-badge-sm" :class="prompt.status.toLowerCase()">{{ prompt.status }}</span>
          </div>
        </div>
      </div>
      
      <div class="back-action">
        <router-link to="/batches" class="link-back">← 목록으로 돌아가기</router-link>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading-state">
    <div class="spinner-large"></div>
    <p>데이터를 불러오는 중입니다...</p>
  </div>
  <div v-else class="error-state">
    <p>배치를 찾을 수 없습니다.</p>
    <router-link to="/batches">목록으로 돌아가기</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchBatchDetail, submitBatch, syncBatch } from '@/api/batch'
import { addPrompt, updatePrompt, deletePrompt } from '@/api/prompt'
import { marked } from 'marked'

import type { Prompt } from '@/types/api'

import type { BatchDetail } from '@/types/api'

type Batch = BatchDetail

import type { CreatePromptRequest } from '@/types/api'

type PromptForm = CreatePromptRequest

const route = useRoute()
const router = useRouter()
const batchId = route.params.id as string

const batch = ref<Batch | null>(null)
const prompts = ref<Prompt[]>([])
const loading = ref<boolean>(true)
const syncing = ref<boolean>(false)

// 폼 상태
const showAddForm = ref<boolean>(false)
const editingPromptId = ref<string | number | null>(null)
const showSystemPrompt = ref<boolean>(false)
const promptForm = ref<PromptForm>({
  label: '',
  systemPrompt: '',
  userPrompt: ''
})

const loadBatch = async (): Promise<void> => {
  try {
    loading.value = true
    const response = await fetchBatchDetail(batchId)
    if (response.success) {
      batch.value = response.data!
      prompts.value = response.data!.prompts || []
    }
  } catch (error) {
    console.error('Failed to fetch batch detail:', error)
  } finally {
    loading.value = false
  }
}

const handleSync = async (): Promise<void> => {
  try {
    syncing.value = true
    const response = await syncBatch(batchId)
    if (response.success) {
      await loadBatch()
    } else {
      alert('동기화 실패: ' + (response.error?.message || '알 수 없는 오류'))
    }
  } catch (error: unknown) {
    alert('동기화 중 오류 발생: ' + (error as Error).message)
  } finally {
    syncing.value = false
  }
}

const startEdit = (prompt: Prompt): void => {
  editingPromptId.value = prompt.id
  promptForm.value = {
    label: prompt.label || '',
    systemPrompt: prompt.systemPrompt || '',
    userPrompt: prompt.userPrompt || ''
  }
  showSystemPrompt.value = !!prompt.systemPrompt
  showAddForm.value = false
}

const cancelEdit = (): void => {
  showAddForm.value = false
  editingPromptId.value = null
  promptForm.value = { label: '', systemPrompt: '', userPrompt: '' }
  showSystemPrompt.value = false
}

const savePrompt = async (): Promise<void> => {
  try {
    let response
    if (editingPromptId.value) {
      response = await updatePrompt(batchId, editingPromptId.value, promptForm.value)
    } else {
      response = await addPrompt(batchId, promptForm.value)
    }
    
    if (response.success) {
      await loadBatch()
      cancelEdit()
    } else {
      alert('프롬프트 저장 실패: ' + (response.error?.message || '알 수 없는 오류'))
    }
  } catch (error: unknown) {
    alert('프롬프트 저장 실패: ' + ((error as Error).message || '알 수 없는 오류'))
  }
}

const handleDeletePrompt = async (promptId: string | number): Promise<void> => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    const response = await deletePrompt(batchId, promptId)
    if (response.success) {
      await loadBatch()
    } else {
      alert('프롬프트 삭제 실패: ' + (response.error?.message || '알 수 없는 오류'))
    }
  } catch (error: unknown) {
    alert('프롬프트 삭제 실패: ' + ((error as Error).message || '알 수 없는 오류'))
  }
}

const handleSubmit = async (): Promise<void> => {
  try {
    const response = await submitBatch(batchId)
    if (response.success) {
      router.push('/batches')
    } else {
      alert('제출 실패: ' + (response.error?.message || '알 수 없는 오류'))
    }
  } catch (error: unknown) {
    alert('제출 실패: ' + ((error as Error).message || '알 수 없는 오류'))
  }
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    DRAFT: '초안',
    IN_PROGRESS: '처리중',
    COMPLETED: '완료',
    FAILED: '실패'
  }
  return statusMap[status] || status
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const renderMarkdown = (content?: string): string => {
  if (!content) return ''
  return marked(content) as string
}

onMounted(loadBatch)
</script>

<style scoped>
.batch-detail {
  padding: 60px 40px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #333;
}

.batch-header {
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 30px;
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.header-main h2 {
  margin: 0 0 10px 0;
  font-size: 1.8em;
  color: #1a1a1a;
}

.status-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.model-badge {
  background-color: #e9ecef;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  color: #495057;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.draft { background-color: #fff3cd; color: #856404; }
.status-badge.in_progress { background-color: #cce5ff; color: #004085; }
.status-badge.completed { background-color: #d4edda; color: #155724; }
.status-badge.failed { background-color: #f8d7da; color: #721c24; }

.header-sub {
  text-align: right;
  color: #666;
  font-size: 0.9em;
}

.btn-sync {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-sync:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-sync:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.prompt-form {
  background-color: #f8f9fa;
  border: 1px dashed #dee2e6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.2s;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.clickable-row {
  cursor: pointer;
}

.prompt-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
}

.prompt-link:hover {
  opacity: 0.7;
}

.prompt-link h4 {
  color: #007bff;
  margin: 0;
  text-decoration: underline;
}

.prompt-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: transform 0.2s;
}

.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.prompt-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.prompt-card-header h4 {
  margin: 0;
  color: #007bff;
}

.prompt-label-text {
  font-size: 0.85em;
  color: #6c757d;
  background: #f1f3f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.prompt-content-preview {
  color: #444;
  line-height: 1.6;
}

.system-preview {
  font-size: 0.9em;
  color: #666;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.prompt-actions {
  display: flex;
  gap: 8px;
}

.result-card {
  border-left: 5px solid #ddd;
}

.result-card.completed { border-left-color: #28a745; }
.result-card.failed { border-left-color: #dc3545; }
.result-card.in_progress { border-left-color: #007bff; }

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-title h4 { margin: 0; color: #333; }

.result-label {
  font-size: 0.8em;
  color: #777;
  border: 1px solid #eee;
  padding: 1px 6px;
  border-radius: 3px;
}

.status-badge-sm {
  font-size: 0.75em;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

.status-badge-sm.completed { background-color: #d4edda; color: #155724; }
.status-badge-sm.failed { background-color: #f8d7da; color: #721c24; }
.status-badge-sm.pending { background-color: #e9ecef; color: #6c757d; }

.divider {
  border: 0;
  border-top: 1px solid #eee;
  margin: 15px 0;
}

.markdown-body {
  margin-top: 10px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 8px;
  line-height: 1.7;
}

.error-section {
  color: #721c24;
  background-color: #fff5f5;
  padding: 15px;
  border-radius: 8px;
}

.error-msg { margin-top: 5px; }

.btn-primary { background-color: #007bff; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-success { background-color: #28a745; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-secondary { background-color: #6c757d; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-danger { background-color: #fff; color: #dc3545; border: 1px solid #dc3545; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.btn-sm { padding: 6px 12px; font-size: 0.9em; cursor: pointer; border: 1px solid #ddd; background: #fff; border-radius: 4px; }

.btn-submit {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,123,255,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,123,255,0.4);
}

.back-action {
  margin-top: 30px;
  text-align: center;
}

.link-back {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.link-back:hover { text-decoration: underline; }

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>