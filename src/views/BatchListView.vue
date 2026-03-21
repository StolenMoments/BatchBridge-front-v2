<template>
  <div class="batch-list-container">
    <header class="list-header">
      <div class="header-content">
        <h1>배치 요청 목록</h1>
        <p class="subtitle">AI 모델 배치 처리 요청 현황을 관리합니다.</p>
      </div>
    </header>

    <div class="action-bar">
      <div class="filter-dropdown-container">
        <select 
          class="filter-select"
          v-model="currentFilter"
          @change="setFilter($event.target.value)"
        >
          <option v-for="tab in tabs" :key="tab.value" :value="tab.value">
            {{ tab.label }}
          </option>
        </select>
        <div class="select-arrow">▼</div>
      </div>
      
      <button @click="refreshList" class="btn btn-icon" title="새로고침" :disabled="loading">
        <span class="icon">🔄</span>
      </button>
      <button @click="$router.push('/batches/new')" class="btn btn-primary btn-new">
        <span class="icon">➕</span> 새 배치 요청
      </button>
    </div>

    <div class="table-wrapper" :class="{ loading }">
      <table class="batch-table">
        <thead>
          <tr>
            <th>요청 이름</th>
            <th>모델</th>
            <th>상태</th>
            <th>생성일시</th>
            <th>완료일시</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && batches.length === 0">
            <td colspan="5" class="empty-state">데이터를 불러오는 중...</td>
          </tr>
          <tr v-else-if="batches.length === 0">
            <td colspan="5" class="empty-state">표시할 배치 요청이 없습니다.</td>
          </tr>
          <tr v-for="batch in batches" :key="batch.id" @click="$router.push(`/batches/${batch.id}`)">
            <td class="col-name">{{ batch.label }}</td>
            <td class="col-model"><span class="badge badge-model">{{ batch.model }}</span></td>
            <td class="col-status">
              <span :class="['status-indicator', getStatusClass(batch.status)]"></span>
              {{ getStatusLabel(batch.status) }}
            </td>
            <td class="col-date">{{ formatDate(batch.createdAt) }}</td>
            <td class="col-date">{{ formatDate(batch.completedAt) || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="list-footer" v-if="totalPages > 1">
      <div class="pagination">
        <button 
          :disabled="currentPage === 1 || loading" 
          @click="changePage(currentPage - 1)"
          class="page-btn"
        >이전</button>
        <div class="page-numbers">
          <button 
            v-for="page in totalPages" 
            :key="page"
            :class="['page-num', { active: currentPage === page }]"
            @click="changePage(page)"
          >{{ page }}</button>
        </div>
        <button 
          :disabled="currentPage === totalPages || loading" 
          @click="changePage(currentPage + 1)"
          class="page-btn"
        >다음</button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchBatches } from '@/api/batch'

const batches = ref([])
const loading = ref(false)
const currentFilter = ref('all')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

const tabs = [
  { label: '전체 상태', value: 'all' },
  { label: '초안', value: 'DRAFT' },
  { label: '진행중', value: 'IN_PROGRESS' },
  { label: '완료', value: 'COMPLETED' },
  { label: '실패', value: 'FAILED' }
]

const loadBatches = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize,
      status: currentFilter.value === 'all' ? undefined : currentFilter.value
    }
    const response = await fetchBatches(params)
    // API 응답 구조: { success: true, data: { content: [], totalPages: N, ... }, error: null }
    if (response.success) {
      const result = response.data
      batches.value = result.content || []
      totalPages.value = result.totalPages || 1
    }
  } catch (error) {
    console.error('Failed to fetch batches:', error)
  } finally {
    loading.value = false
  }
}

const refreshList = () => {
  loadBatches()
}

const setFilter = (value) => {
  currentFilter.value = value
  currentPage.value = 1
}

const changePage = (page) => {
  currentPage.value = page
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

const getStatusClass = (status) => {
  return `status-${status}`
}

const formatDate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch([currentFilter, currentPage], () => {
  loadBatches()
})

onMounted(() => {
  loadBatches()
})
</script>

<style scoped>
.batch-list-container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 60px 40px;
  text-align: left;
}

.list-header {
  margin-bottom: 48px;
}

.list-header h1 {
  margin: 0 0 12px 0;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -1.5px;
}

.subtitle {
  color: var(--text);
  opacity: 0.7;
  font-size: 18px;
}

.action-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  padding: 0 0 20px 0;
  border-bottom: 1px solid var(--border);
}

.filter-dropdown-container {
  position: relative;
  min-width: 160px;
}

.filter-select {
  width: 100%;
  padding: 12px 40px 12px 16px;
  font-size: 16px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-h);
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--text-h);
  background-color: var(--code-bg);
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
}

.btn-icon {
  width: 48px;
  height: 48px;
  padding: 0;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-h);
  border-radius: 50%;
}

.btn-icon:hover:not(:disabled) {
  background: var(--code-bg);
  border-color: var(--text-h);
  transform: rotate(30deg);
}

.btn-icon .icon {
  font-size: 18px;
}

.btn-primary {
  background: var(--text-h);
  color: var(--bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary.btn-new {
  padding: 12px 28px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  filter: brightness(1.2);
}


.table-wrapper {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: opacity 0.3s;
}

.table-wrapper.loading {
  opacity: 0.6;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.batch-table th {
  background: var(--code-bg);
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
  border-bottom: 1px solid var(--border);
}

.batch-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  color: var(--text-h);
  cursor: pointer;
}

.batch-table tr:last-child td {
  border-bottom: none;
}

.batch-table tr:hover td {
  background: var(--accent-bg);
}

.col-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 35%;
}

.col-model {
  white-space: nowrap;
  width: 15%;
}

.col-status {
  white-space: nowrap;
  min-width: 100px;
  width: 15%;
}

.col-date {
  white-space: nowrap;
  min-width: 160px;
  width: 17.5%;
}

.badge-model {
  background: var(--code-bg);
  color: var(--text-h);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-family: var(--mono);
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-DRAFT { background-color: #94a3b8; }
.status-IN_PROGRESS { background-color: #3b82f6; animation: pulse 2s infinite; }
.status-COMPLETED { background-color: #10b981; }
.status-FAILED { background-color: #ef4444; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.empty-state {
  text-align: center;
  padding: 60px !important;
  color: var(--text);
  opacity: 0.7;
}

.list-footer {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-btn, .page-num {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-num.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled), .page-num:hover:not(.active) {
  background: var(--code-bg);
}

@media (max-width: 768px) {
  .batch-list-container {
    width: 92%;
    padding: 40px 0;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    border-bottom: none;
  }
  
  .filter-dropdown-container {
    width: 100%;
  }

  .btn-icon {
    align-self: flex-start;
  }

  .btn-new {
    width: 100%;
  }
  
  .batch-table th:nth-child(4),
  .batch-table td:nth-child(4),
  .batch-table th:nth-child(5),
  .batch-table td:nth-child(5) {
    display: none;
  }
}
</style>
