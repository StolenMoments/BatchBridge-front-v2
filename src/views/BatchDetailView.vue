<template>
  <div class="batch-detail" v-if="batch">
    <header class="batch-header">
      <h2>배치명: {{ batch.label }}</h2>
      <p>모델: {{ batch.model_id }} | 상태: {{ getStatusLabel(batch.status) }}</p>
    </header>

    <div v-if="batch.status === 'DRAFT'" class="draft-container">
      <div class="actions">
        <button @click="showAddForm = true" class="btn-primary">프롬프트 추가</button>
      </div>

      <!-- 프롬프트 추가/수정 폼 -->
      <div v-if="showAddForm || editingPromptId" class="prompt-form card">
        <h3>{{ editingPromptId ? '프롬프트 수정' : '프롬프트 추가' }}</h3>
        <div class="form-group">
          <label>라벨</label>
          <input v-model="promptForm.label" placeholder="예: 질문 1" />
        </div>
        <div class="form-group">
          <label @click="showSystemPrompt = !showSystemPrompt" class="clickable">
            System Prompt {{ showSystemPrompt ? '▼' : '▶' }}
          </label>
          <textarea v-if="showSystemPrompt" v-model="promptForm.system_prompt" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>User Prompt (필수)</label>
          <textarea v-model="promptForm.user_prompt" rows="5" required></textarea>
        </div>
        <div class="form-actions">
          <button @click="cancelEdit" class="btn-secondary">취소</button>
          <button @click="savePrompt" class="btn-success" :disabled="!promptForm.user_prompt">저장</button>
        </div>
      </div>

      <!-- 프롬프트 목록 -->
      <div class="prompt-list">
        <div v-for="(prompt, index) in prompts" :key="prompt.id" class="prompt-card card">
          <div class="prompt-info">
            <h4>프롬프트 #{{ index + 1 }}</h4>
            <p><strong>라벨:</strong> {{ prompt.label || '(없음)' }}</p>
            <p><strong>User:</strong> {{ prompt.user_prompt }}</p>
          </div>
          <div class="prompt-actions">
            <button @click="startEdit(prompt)" class="btn-sm">수정</button>
            <button @click="handleDeletePrompt(prompt.id)" class="btn-sm btn-danger">삭제</button>
          </div>
        </div>
      </div>

      <footer class="detail-footer">
        <button 
          @click="handleSubmit" 
          class="btn-submit" 
          :disabled="prompts.length === 0"
        >
          제출하기
        </button>
      </footer>
    </div>

    <div v-else class="status-container">
      <!-- 제출 후 UI (DEV-34에서 구현 예정) -->
      <p>이 배치는 현재 {{ batch.status }} 상태입니다.</p>
      <router-link to="/batches">목록으로 돌아가기</router-link>
    </div>
  </div>
  <div v-else-if="loading">로딩 중...</div>
  <div v-else>배치를 찾을 수 없습니다.</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchBatchDetail, submitBatch } from '@/api/batch'
import { addPrompt, updatePrompt, deletePrompt } from '@/api/prompt'

const route = useRoute()
const router = useRouter()
const batchId = route.params.id

const batch = ref(null)
const prompts = ref([])
const loading = ref(true)

// 폼 상태
const showAddForm = ref(false)
const editingPromptId = ref(null)
const showSystemPrompt = ref(false)
const promptForm = ref({
  label: '',
  system_prompt: '',
  user_prompt: ''
})

const loadBatch = async () => {
  try {
    loading.value = true
    const response = await fetchBatchDetail(batchId)
    batch.value = response.data
    // API 명세에 따라 prompts가 batch 객체에 포함되어 있거나 따로 가져와야 할 수 있음.
    // 여기서는 batch.prompts에 포함되어 있다고 가정하거나, 
    // fetchBatchDetail이 모든 정보를 준다고 가정.
    prompts.value = response.data.prompts || []
  } catch (error) {
    console.error('Failed to fetch batch detail:', error)
  } finally {
    loading.value = false
  }
}

const startEdit = (prompt) => {
  editingPromptId.value = prompt.id
  promptForm.value = {
    label: prompt.label || '',
    system_prompt: prompt.system_prompt || '',
    user_prompt: prompt.user_prompt || ''
  }
  showSystemPrompt.value = !!prompt.system_prompt
  showAddForm.value = false
}

const cancelEdit = () => {
  showAddForm.value = false
  editingPromptId.value = null
  promptForm.value = { label: '', system_prompt: '', user_prompt: '' }
  showSystemPrompt.value = false
}

const savePrompt = async () => {
  try {
    if (editingPromptId.value) {
      await updatePrompt(batchId, editingPromptId.value, promptForm.value)
    } else {
      await addPrompt(batchId, promptForm.value)
    }
    await loadBatch()
    cancelEdit()
  } catch (error) {
    alert('프롬프트 저장 실패: ' + (error.response?.data?.message || error.message))
  }
}

const handleDeletePrompt = async (promptId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await deletePrompt(batchId, promptId)
    await loadBatch()
  } catch (error) {
    alert('프롬프트 삭제 실패')
  }
}

const handleSubmit = async () => {
  if (prompts.value.length === 0) return
  try {
    await submitBatch(batchId)
    router.push('/batches')
  } catch (error) {
    alert('제출 실패: ' + (error.response?.data?.message || error.message))
  }
}

const getStatusLabel = (status) => {
  const statusMap = {
    DRAFT: '초안',
    IN_PROGRESS: '진행중',
    COMPLETED: '완료',
    FAILED: '실패'
  }
  return statusMap[status] || status
}

onMounted(loadBatch)
</script>

<style scoped>
.batch-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.batch-header {
  border-bottom: 2px solid #eee;
  margin-bottom: 20px;
  padding-bottom: 10px;
}
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fff;
}
.prompt-form {
  background-color: #f9f9f9;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input, .form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.clickable {
  cursor: pointer;
  color: #007bff;
}
.prompt-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.prompt-info h4 {
  margin: 0 0 10px 0;
}
.prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.btn-primary { background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
.btn-secondary { background-color: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
.btn-success { background-color: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
.btn-danger { background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.btn-sm { padding: 4px 8px; font-size: 0.85em; cursor: pointer; }
.btn-submit {
  width: 100%;
  padding: 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
}
.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.detail-footer {
  margin-top: 30px;
}
</style>
