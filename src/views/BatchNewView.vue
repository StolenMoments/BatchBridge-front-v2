<template>
  <div class="batch-new-container">
    <header class="view-header">
      <div class="header-content">
        <button @click="$router.push('/batches')" class="btn-back">
          <span class="icon">←</span> 목록으로
        </button>
        <h1>새 배치 요청</h1>
        <p class="subtitle">새로운 AI 모델 배치 처리 작업을 설정합니다.</p>
      </div>
    </header>

    <div class="form-wrapper">
      <form @submit.prevent="handleSubmit" class="batch-form">
        <!-- 모델 선택 -->
        <div class="form-group">
          <label for="model-select">모델 <span class="required">*</span></label>
          <div class="select-container">
            <select 
              id="model-select" 
              v-model="form.model" 
              class="form-select"
              :class="{ 'error': errors.model }"
              required
            >
              <option value="" disabled>모델을 선택하세요</option>
              <option v-for="model in models" :key="model.id" :value="model.id">
                {{ model.displayName }} ({{ model.id }})
              </option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
          <p v-if="errors.model" class="error-text">{{ errors.model }}</p>
        </div>

        <!-- 라벨 입력 -->
        <div class="form-group">
          <label for="label-input">라벨 (선택)</label>
          <input 
            type="text" 
            id="label-input" 
            v-model="form.label" 
            class="form-input" 
            placeholder="이 작업의 이름을 입력하세요 (미입력 시 자동 생성)"
          />
        </div>

        <!-- System Prompt (접기/펼치기) -->
        <div class="form-group collapsible-group">
          <div class="collapsible-header" @click="isSystemPromptOpen = !isSystemPromptOpen">
            <label>System Prompt (선택)</label>
            <span class="toggle-icon">{{ isSystemPromptOpen ? '▲' : '▼' }}</span>
          </div>
          <div v-show="isSystemPromptOpen" class="collapsible-content">
            <textarea 
              id="system-prompt" 
              v-model="form.systemPrompt" 
              class="form-textarea" 
              rows="4"
              placeholder="모델의 역할을 정의하거나 지시사항을 입력하세요."
            ></textarea>
          </div>
        </div>

        <!-- User Prompt (필수) -->
        <div class="form-group">
          <label for="user-prompt">User Prompt <span class="required">*</span></label>
          <textarea 
            id="user-prompt" 
            v-model="form.userPrompt" 
            class="form-textarea" 
            rows="10"
            placeholder="배치로 처리할 실제 내용을 입력하세요."
            :class="{ 'error': errors.userPrompt }"
            required
          ></textarea>
          <p v-if="errors.userPrompt" class="error-text">{{ errors.userPrompt }}</p>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            @click="$router.push('/batches')" 
            class="btn btn-secondary"
            :disabled="submitting"
          >
            취소
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="submitting"
          >
            {{ submitting ? '제출 중...' : '배치 요청 생성' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { fetchModels, createBatch } from '@/api/batch'

const router = useRouter()
const models = ref([])
const submitting = ref(false)
const isSystemPromptOpen = ref(false)

const form = reactive({
  model: '',
  label: '',
  systemPrompt: '',
  userPrompt: ''
})

const errors = reactive({
  model: '',
  userPrompt: ''
})

const loadModels = async () => {
  try {
    const response = await fetchModels()
    if (response.success) {
      models.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

const validate = () => {
  let isValid = true
  errors.model = ''
  errors.userPrompt = ''

  if (!form.model) {
    errors.model = '모델을 선택해야 합니다.'
    isValid = false
  }

  if (!form.userPrompt || !form.userPrompt.trim()) {
    errors.userPrompt = 'User Prompt를 입력해야 합니다.'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    const payload = {
      model: form.model,
      label: form.label || undefined,
      systemPrompt: form.systemPrompt || undefined,
      userPrompt: form.userPrompt
    }
    
    const response = await createBatch(payload)
    if (response.success) {
      router.push('/batches')
    } else {
      alert('요청 생성에 실패했습니다: ' + (response.error?.message || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('Failed to create batch:', error)
    alert('오류가 발생했습니다. 다시 시도해주세요.')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.batch-new-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 40px;
  text-align: left;
}

.view-header {
  margin-bottom: 40px;
}

.btn-back {
  background: none;
  border: none;
  color: var(--text);
  opacity: 0.6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.2s;
}

.btn-back:hover {
  opacity: 1;
}

.view-header h1 {
  margin: 0 0 12px 0;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
}

.subtitle {
  color: var(--text);
  opacity: 0.7;
  font-size: 16px;
}

.form-wrapper {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--shadow);
}

.batch-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
}

.required {
  color: #ef4444;
}

.select-container {
  position: relative;
}

.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-h);
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s;
}

.form-select {
  appearance: none;
  cursor: pointer;
  padding-right: 40px;
}

.select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--text);
  pointer-events: none;
}

.form-select:focus, .form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.form-select.error, .form-textarea.error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin: 4px 0 0 0;
}

.collapsible-group {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.collapsible-header {
  padding: 12px 16px;
  background: var(--code-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.collapsible-header label {
  margin: 0;
  cursor: pointer;
}

.collapsible-content {
  padding: 16px;
  border-top: 1px solid var(--border);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 12px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--text-h);
  color: var(--bg);
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.2);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg);
  border-color: var(--border);
  color: var(--text-h);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--code-bg);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .batch-new-container {
    width: 92%;
    padding: 40px 0;
  }
  
  .form-wrapper {
    padding: 24px;
  }
}
</style>
