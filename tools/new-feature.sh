#!/usr/bin/env bash
# Scaffold one vertical feature slice exactly like the Users feature (AGENTS.md §1).
#
#   tools/new-feature.sh Invoice
#   tools/new-feature.sh PurchaseOrder
#
# Creates (Name=Invoice → name=invoice, kebab=invoice, route /invoices):
#   domain/entities/invoice.model.ts                  entity + Create/Update DTOs
#   domain/services/invoiceService.ts                 service interface (the only thing UI sees)
#   data/mappers/invoiceMapper.ts (+test)             API DTO <-> domain
#   data/repositories/invoiceRepository.ts (+test)    4-layer cache: memory → LRU → IndexedDB → API
#   data/services/impl/invoiceServiceImpl.ts          implements InvoiceService over the repository
#   data/services/invoiceServiceImpl.test.ts
#   presentation/features/invoices/viewmodels/invoiceListViewModel.ts (+test)   Input/Output/Effect hook
#   presentation/features/invoices/invoice-list/InvoiceListComponent.tsx (+test)
# and edits the anchors: core/di/container.ts (token + ServiceMap), core/di/serviceConfig.ts
# (the only binding of the Impl), core/di/DIProvider.tsx + index.ts (useInvoiceService),
# core/navigation/navGraph.ts (Routes.INVOICES), routes/index.tsx (lazy route).
# Every anchor must match exactly once, or the script stops before writing anything.
set -euo pipefail

[ $# -eq 1 ] || { echo "usage: $0 <PascalCaseName>   e.g. $0 Invoice" >&2; exit 1; }
NAME="$1"
[[ "$NAME" =~ ^[A-Z][a-z0-9]+([A-Z][a-z0-9]+)*$ ]] || { echo "name must be PascalCase (Invoice, PurchaseOrder)" >&2; exit 1; }
[ "$NAME" != "User" ] || { echo "User already exists" >&2; exit 1; }
command -v perl >/dev/null || { echo "perl is required" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CAMEL="$(printf '%s' "$NAME" | perl -pe 's/^([A-Z])/lc($1)/e')"
KEBAB="$(printf '%s' "$NAME" | perl -pe 's/(?<!^)([A-Z])/-$1/g; $_=lc')"
UPPER="$(printf '%s' "$KEBAB" | tr 'a-z-' 'A-Z_')"
PLURAL="${KEBAB}s"
FEAT="src/app/presentation/features/${PLURAL}"

A=src/app
CONTAINER=$A/core/di/container.ts
CONFIG=$A/core/di/serviceConfig.ts
PROVIDER=$A/core/di/DIProvider.tsx
DIINDEX=$A/core/di/index.ts
NAV=$A/core/navigation/navGraph.ts
ROUTES=src/routes/index.tsx

# ---------------------------------------------------------------- preflight (no writes yet)
for f in "$A/domain/entities/${CAMEL}.model.ts" "$A/domain/services/${CAMEL}Service.ts" "$FEAT"; do
    [ ! -e "$f" ] || { echo "new-feature: $f already exists" >&2; exit 1; }
done
need() { # file anchor-regex  → exactly one match or die
    local n; n="$(perl -0ne '$c=()=/'"$2"'/gm; print $c' "$1")"
    [ "$n" = 1 ] || { echo "new-feature: anchor /$2/ found $n times in $1 (need 1) — the template changed; update tools/new-feature.sh" >&2; exit 1; }
}
need $CONTAINER "^  UserService: 'UserService',\$"
need $CONTAINER "^  \\[ServiceTokens\\.UserService\\]: UserService\$"
need $CONTAINER "^import type \\{ UserService \\} from '\\@\\/app\\/domain\\/services\\/userService'\$"
need $CONFIG "^import \\{ userService \\} from '\\@\\/app\\/data\\/services\\/impl\\/userServiceImpl'\$"
need $CONFIG "^  container\\.register\\(ServiceTokens\\.UserService, userService\\)\$"
need $CONFIG "^  container\\.register\\(ServiceTokens\\.UserService, mocks\\.userService \\?\\? userService\\)\$"
need $PROVIDER "^export function useUserService\\(\\) \\{\$"
need $DIINDEX "useUserService \\} from '.\\/DIProvider'\$"
need $NAV "^  HOME: '\\/home',\$"
need $ROUTES "^        \\{\\/\\* Projects Feature \\(Placeholder\\) \\*\\/\\}\$"
need $ROUTES "^\\/\\/ Loading Wrapper with Error Boundary\$"

# ---------------------------------------------------------------- generated files
emit() { # dest  (template on stdin)
    mkdir -p "$(dirname "$1")"
    sed -e "s/__Name__/${NAME}/g" -e "s/__name__/${CAMEL}/g" -e "s/__kebab__/${KEBAB}/g" \
        -e "s/__plural__/${PLURAL}/g" -e "s/__UPPER__/${UPPER}/g" > "$1"
    echo "  + $1"
}

emit $A/domain/entities/${CAMEL}.model.ts <<'EOF'
// =============================================================================
// __Name__ Domain Model
// =============================================================================

export interface __Name__ {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Create__Name__Dto {
  name: string
  description?: string
}

export interface Update__Name__Dto {
  name?: string
  description?: string
}
EOF

emit $A/domain/services/${CAMEL}Service.ts <<'EOF'
// =============================================================================
// __Name__ Service Interface - Domain Layer
// =============================================================================
// The contract the presentation layer depends on. The implementation lives in
// data/services/impl/ and is bound only in core/di/serviceConfig.ts.
// =============================================================================

import type { __Name__, Create__Name__Dto, Update__Name__Dto } from '@/app/domain/entities/__name__.model'
import type { ServiceResult } from '@/app/domain/services/userService'

export interface __Name__Service {
  getById(id: string): Promise<ServiceResult<__Name__>>
  getList(): Promise<ServiceResult<__Name__[]>>
  create(dto: Create__Name__Dto): Promise<ServiceResult<__Name__>>
  update(id: string, dto: Update__Name__Dto): Promise<ServiceResult<__Name__>>
  delete(id: string): Promise<ServiceResult<void>>
}
EOF

emit $A/data/mappers/${CAMEL}Mapper.ts <<'EOF'
// =============================================================================
// __Name__ Mapper - DTO <-> Domain Model Conversion
// =============================================================================

import type { __Name__, Create__Name__Dto, Update__Name__Dto } from '@/app/domain/entities/__name__.model'

/** __Name__ DTO from API (snake_case from backend) */
export interface __Name__ApiDto {
  id: number | string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export const __name__Mapper = {
  toDomain(dto: __Name__ApiDto): __Name__ {
    return {
      id: String(dto.id),
      name: dto.name,
      description: dto.description ?? undefined,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    }
  },

  toDomainList(dtos: __Name__ApiDto[]): __Name__[] {
    return dtos.map((dto) => __name__Mapper.toDomain(dto))
  },

  toCreateDto(dto: Create__Name__Dto): Partial<__Name__ApiDto> {
    return { name: dto.name, description: dto.description }
  },

  toUpdateDto(dto: Update__Name__Dto): Partial<__Name__ApiDto> {
    const out: Partial<__Name__ApiDto> = {}
    if (dto.name !== undefined) out.name = dto.name
    if (dto.description !== undefined) out.description = dto.description
    return out
  },
}
EOF

emit $A/data/mappers/${CAMEL}Mapper.test.ts <<'EOF'
import { describe, it, expect } from 'vitest'
import { __name__Mapper, type __Name__ApiDto } from './__name__Mapper'

describe('__name__Mapper', () => {
  const dto: __Name__ApiDto = {
    id: 7,
    name: 'First',
    description: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  }

  it('maps API DTO to domain', () => {
    const d = __name__Mapper.toDomain(dto)
    expect(d.id).toBe('7')
    expect(d.name).toBe('First')
    expect(d.description).toBeUndefined()
    expect(d.createdAt.toISOString()).toBe('2025-01-01T00:00:00.000Z')
  })

  it('maps a list', () => {
    expect(__name__Mapper.toDomainList([dto, { ...dto, id: 8 }]).map((d) => d.id)).toEqual(['7', '8'])
  })

  it('maps create and partial update DTOs', () => {
    expect(__name__Mapper.toCreateDto({ name: 'n', description: 'd' })).toEqual({ name: 'n', description: 'd' })
    expect(__name__Mapper.toUpdateDto({ name: 'x' })).toEqual({ name: 'x' })
  })
})
EOF

emit $A/data/repositories/${CAMEL}Repository.ts <<'EOF'
// =============================================================================
// __Name__ Repository - 4-Layer Caching Architecture
// =============================================================================
// Layer 1: Memory Cache   Layer 2: LRU Cache with TTL
// Layer 3: IndexedDB      Layer 4: API (source of truth)
// Writes go to the API when online; offline they are queued as pending
// operations in IndexedDB (same mechanism as userRepository).
// =============================================================================

import type { __Name__, Create__Name__Dto, Update__Name__Dto } from '@/app/domain/entities/__name__.model'
import { networkStatusService } from '@/app/domain/services/networkStatusService'
import { memoryCacheService } from '../storage/memoryCacheService'
import { lruCacheService } from '../storage/lruCacheService'
import { indexedDbService } from '../storage/indexedDbService'
import { apiService } from '../api/apiService'
import { __name__Mapper, type __Name__ApiDto } from '../mappers/__name__Mapper'

const CACHE_KEYS = {
  ITEM: (id: string) => `__name__:${id}`,
  LIST: '__name__s:list',
  PREFIX: '__name__',
}

const ENDPOINT = '/__plural__'

class __Name__Repository {
  async getById(id: string): Promise<__Name__ | null> {
    const key = CACHE_KEYS.ITEM(id)

    const l1 = memoryCacheService.get<__Name__>(key)
    if (l1) return l1

    const l2 = lruCacheService.get<__Name__>(key)
    if (l2) {
      memoryCacheService.set(key, l2)
      return l2
    }

    const l3 = await indexedDbService.getCache<__Name__>(key)
    if (l3) {
      lruCacheService.set(key, l3)
      memoryCacheService.set(key, l3)
      return l3
    }

    if (!networkStatusService.isCurrentlyOnline()) return null

    const response = await apiService.get<__Name__ApiDto>(`${ENDPOINT}/${id}`)
    const item = __name__Mapper.toDomain(response.data)
    await this.cacheItem(item)
    return item
  }

  async getList(): Promise<__Name__[]> {
    const l2 = lruCacheService.get<__Name__[]>(CACHE_KEYS.LIST)
    if (l2) return l2

    const l3 = await indexedDbService.getCache<__Name__[]>(CACHE_KEYS.LIST)
    if (l3) {
      lruCacheService.set(CACHE_KEYS.LIST, l3)
      return l3
    }

    if (!networkStatusService.isCurrentlyOnline()) return []

    const response = await apiService.get<__Name__ApiDto[]>(ENDPOINT)
    const items = __name__Mapper.toDomainList(response.data)
    lruCacheService.set(CACHE_KEYS.LIST, items)
    await indexedDbService.setCache(CACHE_KEYS.LIST, items)
    return items
  }

  async create(dto: Create__Name__Dto): Promise<__Name__> {
    if (!networkStatusService.isCurrentlyOnline()) {
      const now = new Date()
      const temp: __Name__ = { id: `temp-${now.getTime()}`, ...dto, createdAt: now, updatedAt: now }
      await indexedDbService.addPendingOperation({
        type: 'create', entity: '__name__', entityId: temp.id, payload: dto, maxRetries: 3,
      })
      await this.cacheItem(temp)
      this.invalidateList()
      return temp
    }
    const response = await apiService.post<__Name__ApiDto>(ENDPOINT, __name__Mapper.toCreateDto(dto))
    const item = __name__Mapper.toDomain(response.data)
    await this.cacheItem(item)
    this.invalidateList()
    return item
  }

  async update(id: string, dto: Update__Name__Dto): Promise<__Name__> {
    if (!networkStatusService.isCurrentlyOnline()) {
      const existing = await this.getById(id)
      if (!existing) throw new Error('__Name__ not found')
      const updated: __Name__ = { ...existing, ...dto, updatedAt: new Date() }
      await indexedDbService.addPendingOperation({
        type: 'update', entity: '__name__', entityId: id, payload: dto, maxRetries: 3,
      })
      await this.cacheItem(updated)
      this.invalidateList()
      return updated
    }
    const response = await apiService.put<__Name__ApiDto>(`${ENDPOINT}/${id}`, __name__Mapper.toUpdateDto(dto))
    const item = __name__Mapper.toDomain(response.data)
    await this.cacheItem(item)
    this.invalidateList()
    return item
  }

  async delete(id: string): Promise<void> {
    if (networkStatusService.isCurrentlyOnline()) {
      await apiService.delete(`${ENDPOINT}/${id}`)
    } else {
      await indexedDbService.addPendingOperation({
        type: 'delete', entity: '__name__', entityId: id, payload: null, maxRetries: 3,
      })
    }
    const key = CACHE_KEYS.ITEM(id)
    memoryCacheService.delete(key)
    lruCacheService.delete(key)
    await indexedDbService.deleteCache(key)
    this.invalidateList()
  }

  private async cacheItem(item: __Name__): Promise<void> {
    const key = CACHE_KEYS.ITEM(item.id)
    memoryCacheService.set(key, item)
    lruCacheService.set(key, item)
    await indexedDbService.setCache(key, item)
  }

  private invalidateList(): void {
    lruCacheService.delete(CACHE_KEYS.LIST)
    void indexedDbService.deleteCache(CACHE_KEYS.LIST)
  }
}

export const __name__Repository = new __Name__Repository()
EOF

emit $A/data/repositories/${CAMEL}Repository.test.ts <<'EOF'
// =============================================================================
// __Name__ Repository Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { __Name__ } from '@/app/domain/entities/__name__.model'

const m = vi.hoisted(() => ({
  memGet: vi.fn(), memSet: vi.fn(), memDelete: vi.fn(),
  lruGet: vi.fn(), lruSet: vi.fn(), lruDelete: vi.fn(),
  idbGet: vi.fn(), idbSet: vi.fn(), idbDelete: vi.fn(), idbAddPending: vi.fn(),
  apiGet: vi.fn(), apiPost: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn(),
  online: vi.fn(),
}))

vi.mock('../storage/memoryCacheService', () => ({
  memoryCacheService: { get: m.memGet, set: m.memSet, delete: m.memDelete },
}))
vi.mock('../storage/lruCacheService', () => ({
  lruCacheService: { get: m.lruGet, set: m.lruSet, delete: m.lruDelete },
}))
vi.mock('../storage/indexedDbService', () => ({
  indexedDbService: { getCache: m.idbGet, setCache: m.idbSet, deleteCache: m.idbDelete, addPendingOperation: m.idbAddPending },
}))
vi.mock('../api/apiService', () => ({
  apiService: { get: m.apiGet, post: m.apiPost, put: m.apiPut, delete: m.apiDelete },
}))
vi.mock('@/app/domain/services/networkStatusService', () => ({
  networkStatusService: { isCurrentlyOnline: m.online },
}))

import { __name__Repository } from './__name__Repository'

const item: __Name__ = { id: '1', name: 'A', createdAt: new Date(), updatedAt: new Date() }
const apiDto = { id: 1, name: 'A' }

describe('__name__Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m.memGet.mockReturnValue(null)
    m.lruGet.mockReturnValue(null)
    m.idbGet.mockResolvedValue(null)
    m.idbSet.mockResolvedValue(undefined)
    m.idbDelete.mockResolvedValue(undefined)
    m.idbAddPending.mockResolvedValue(1)
    m.online.mockReturnValue(true)
  })

  it('L1 memory hit returns without touching lower layers', async () => {
    m.memGet.mockReturnValue(item)
    expect(await __name__Repository.getById('1')).toBe(item)
    expect(m.lruGet).not.toHaveBeenCalled()
  })

  it('L2 LRU hit promotes to memory', async () => {
    m.lruGet.mockReturnValue(item)
    expect(await __name__Repository.getById('1')).toBe(item)
    expect(m.memSet).toHaveBeenCalledWith('__name__:1', item)
  })

  it('L3 IndexedDB hit promotes to LRU and memory', async () => {
    m.idbGet.mockResolvedValue(item)
    expect(await __name__Repository.getById('1')).toBe(item)
    expect(m.lruSet).toHaveBeenCalled()
    expect(m.memSet).toHaveBeenCalled()
  })

  it('L4 API fetch populates every cache layer', async () => {
    m.apiGet.mockResolvedValue({ data: apiDto })
    const got = await __name__Repository.getById('1')
    expect(got?.id).toBe('1')
    expect(m.idbSet).toHaveBeenCalled()
  })

  it('offline miss returns null without calling the API', async () => {
    m.online.mockReturnValue(false)
    expect(await __name__Repository.getById('1')).toBeNull()
    expect(m.apiGet).not.toHaveBeenCalled()
  })

  it('getList fetches from API and caches', async () => {
    m.apiGet.mockResolvedValue({ data: [apiDto] })
    const list = await __name__Repository.getList()
    expect(list).toHaveLength(1)
    expect(m.lruSet).toHaveBeenCalledWith('__name__s:list', list)
  })

  it('create online posts to API', async () => {
    m.apiPost.mockResolvedValue({ data: apiDto })
    const created = await __name__Repository.create({ name: 'A' })
    expect(created.id).toBe('1')
    expect(m.apiPost).toHaveBeenCalled()
  })

  it('create offline queues a pending operation', async () => {
    m.online.mockReturnValue(false)
    const created = await __name__Repository.create({ name: 'A' })
    expect(created.id).toMatch(/^temp-/)
    expect(m.idbAddPending).toHaveBeenCalledWith(expect.objectContaining({ type: 'create', entity: '__name__' }))
  })

  it('update online puts to API', async () => {
    m.apiPut.mockResolvedValue({ data: { ...apiDto, name: 'B' } })
    expect((await __name__Repository.update('1', { name: 'B' })).name).toBe('B')
  })

  it('delete online calls API and evicts caches', async () => {
    m.apiDelete.mockResolvedValue({ data: null })
    await __name__Repository.delete('1')
    expect(m.apiDelete).toHaveBeenCalledWith('/__plural__/1')
    expect(m.memDelete).toHaveBeenCalledWith('__name__:1')
  })
})
EOF

emit $A/data/services/impl/${CAMEL}ServiceImpl.ts <<'EOF'
// =============================================================================
// __Name__ Service Implementation - Data Layer
// =============================================================================
// Implements the __Name__Service interface using the __Name__Repository.
// Bound to ServiceTokens.__Name__Service in core/di/serviceConfig.ts only.
// =============================================================================

import type { ServiceResult } from '@/app/domain/services/userService'
import type { __Name__Service } from '@/app/domain/services/__name__Service'
import type { __Name__, Create__Name__Dto, Update__Name__Dto } from '@/app/domain/entities/__name__.model'
import { __name__Repository } from '@/app/data/repositories/__name__Repository'

class __Name__ServiceImpl implements __Name__Service {
  async getById(id: string): Promise<ServiceResult<__Name__>> {
    try {
      const item = await __name__Repository.getById(id)
      return item ? { success: true, data: item } : { success: false, error: '__Name__ not found' }
    } catch (error) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getList(): Promise<ServiceResult<__Name__[]>> {
    try {
      return { success: true, data: await __name__Repository.getList() }
    } catch (error) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async create(dto: Create__Name__Dto): Promise<ServiceResult<__Name__>> {
    try {
      return { success: true, data: await __name__Repository.create(dto) }
    } catch (error) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async update(id: string, dto: Update__Name__Dto): Promise<ServiceResult<__Name__>> {
    try {
      return { success: true, data: await __name__Repository.update(id, dto) }
    } catch (error) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      await __name__Repository.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: this.formatError(error) }
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'An unknown error occurred'
  }
}

export const __name__Service: __Name__Service = new __Name__ServiceImpl()
EOF

emit $A/data/services/${CAMEL}ServiceImpl.test.ts <<'EOF'
// =============================================================================
// __Name__ Service Implementation Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { __Name__ } from '@/app/domain/entities/__name__.model'

const repo = vi.hoisted(() => ({
  getById: vi.fn(), getList: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
}))
vi.mock('@/app/data/repositories/__name__Repository', () => ({ __name__Repository: repo }))

import { __name__Service } from './impl/__name__ServiceImpl'

const item: __Name__ = { id: '1', name: 'A', createdAt: new Date(), updatedAt: new Date() }

describe('__Name__ServiceImpl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getById wraps the entity', async () => {
    repo.getById.mockResolvedValue(item)
    expect(await __name__Service.getById('1')).toEqual({ success: true, data: item })
  })

  it('getById reports not found', async () => {
    repo.getById.mockResolvedValue(null)
    expect(await __name__Service.getById('x')).toEqual({ success: false, error: '__Name__ not found' })
  })

  it('getList returns the list', async () => {
    repo.getList.mockResolvedValue([item])
    expect((await __name__Service.getList()).data).toEqual([item])
  })

  it('create / update / delete succeed', async () => {
    repo.create.mockResolvedValue(item)
    repo.update.mockResolvedValue(item)
    repo.delete.mockResolvedValue(undefined)
    expect((await __name__Service.create({ name: 'A' })).success).toBe(true)
    expect((await __name__Service.update('1', { name: 'B' })).success).toBe(true)
    expect(await __name__Service.delete('1')).toEqual({ success: true })
  })

  it('maps thrown errors to a failed result', async () => {
    repo.getList.mockRejectedValue(new Error('boom'))
    repo.delete.mockRejectedValue('weird')
    expect(await __name__Service.getList()).toEqual({ success: false, error: 'boom' })
    expect(await __name__Service.delete('1')).toEqual({ success: false, error: 'An unknown error occurred' })
  })
})
EOF

emit $FEAT/viewmodels/${CAMEL}ListViewModel.ts <<'EOF'
// =============================================================================
// __Name__ List ViewModel - UDF Input/Output/Effect Pattern
// =============================================================================
// Input:  discriminated union of user actions
// Output: immutable state derived from the reducer
// Effect: side effects (navigation) handled outside the reducer
// Data Flow: UI -> Input -> Reducer -> Output -> UI
// =============================================================================

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { __Name__ } from '@/app/domain/entities/__name__.model'
import { use__Name__Service } from '@/app/core/di'

// Input
export type __Name__ListInput =
  | { type: 'LOAD' }
  | { type: 'DELETE'; id: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'NAVIGATE_TO_DETAIL'; id: string }

// Output
export interface __Name__ListOutput {
  items: __Name__[]
  isLoading: boolean
  error: string | null
  isEmpty: boolean
}

// Effect
export type __Name__ListEffect = { type: 'NAVIGATE'; path: string }

interface State {
  items: __Name__[]
  isLoading: boolean
  error: string | null
  pendingEffect: __Name__ListEffect | null
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: __Name__[] }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EFFECT'; payload: __Name__ListEffect | null }
  | { type: 'CLEAR_EFFECT' }

const initialState: State = { items: [], isLoading: true, error: null, pendingEffect: null }

export function __name__ListReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null }
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_EFFECT':
      return { ...state, pendingEffect: action.payload }
    case 'CLEAR_EFFECT':
      return { ...state, pendingEffect: null }
    default:
      return state
  }
}

export interface Use__Name__ListViewModel {
  output: __Name__ListOutput
  dispatch: (input: __Name__ListInput) => Promise<void>
}

export function use__Name__ListViewModel(): Use__Name__ListViewModel {
  const navigate = useNavigate()
  const service = use__Name__Service()
  const [state, internalDispatch] = useReducer(__name__ListReducer, initialState)
  const isInitialMount = useRef(true)

  // Effect handler
  useEffect(() => {
    if (!state.pendingEffect) return
    navigate(state.pendingEffect.path)
    internalDispatch({ type: 'CLEAR_EFFECT' })
  }, [state.pendingEffect, navigate])

  // Input handler
  const dispatch = useCallback(
    async (input: __Name__ListInput) => {
      switch (input.type) {
        case 'LOAD': {
          internalDispatch({ type: 'SET_LOADING', payload: true })
          const result = await service.getList()
          if (result.success && result.data) {
            internalDispatch({ type: 'SET_ITEMS', payload: result.data })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load __plural__' })
          }
          break
        }
        case 'DELETE': {
          const result = await service.delete(input.id)
          if (result.success) {
            internalDispatch({ type: 'REMOVE_ITEM', payload: input.id })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete' })
          }
          break
        }
        case 'DISMISS_ERROR':
          internalDispatch({ type: 'SET_ERROR', payload: null })
          break
        case 'NAVIGATE_TO_DETAIL':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: `/__plural__/${input.id}` } })
          break
      }
    },
    [service]
  )

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      void dispatch({ type: 'LOAD' })
    }
  }, [dispatch])

  const output: __Name__ListOutput = {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    isEmpty: !state.isLoading && state.items.length === 0,
  }

  return { output, dispatch }
}
EOF

emit $FEAT/viewmodels/${CAMEL}ListViewModel.test.ts <<'EOF'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { __Name__ } from '@/app/domain/entities/__name__.model'
import type { __Name__Service } from '@/app/domain/services/__name__Service'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

const mockService: __Name__Service = {
  getById: vi.fn(),
  getList: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
vi.mock('@/app/core/di', () => ({ use__Name__Service: () => mockService }))

import { use__Name__ListViewModel } from './__name__ListViewModel'

const item: __Name__ = { id: '1', name: 'A', createdAt: new Date(), updatedAt: new Date() }

describe('use__Name__ListViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockService.getList).mockResolvedValue({ success: true, data: [item] })
  })

  it('loads items on mount (Output)', async () => {
    const { result } = renderHook(() => use__Name__ListViewModel())
    await waitFor(() => expect(result.current.output.isLoading).toBe(false))
    expect(result.current.output.items).toEqual([item])
    expect(result.current.output.isEmpty).toBe(false)
  })

  it('exposes load errors and DISMISS_ERROR clears them', async () => {
    vi.mocked(mockService.getList).mockResolvedValue({ success: false, error: 'nope' })
    const { result } = renderHook(() => use__Name__ListViewModel())
    await waitFor(() => expect(result.current.output.error).toBe('nope'))
    await act(() => result.current.dispatch({ type: 'DISMISS_ERROR' }))
    expect(result.current.output.error).toBeNull()
  })

  it('DELETE removes the item', async () => {
    vi.mocked(mockService.delete).mockResolvedValue({ success: true })
    const { result } = renderHook(() => use__Name__ListViewModel())
    await waitFor(() => expect(result.current.output.items).toHaveLength(1))
    await act(() => result.current.dispatch({ type: 'DELETE', id: '1' }))
    expect(result.current.output.items).toHaveLength(0)
  })

  it('NAVIGATE_TO_DETAIL emits a navigation Effect', async () => {
    const { result } = renderHook(() => use__Name__ListViewModel())
    await act(() => result.current.dispatch({ type: 'NAVIGATE_TO_DETAIL', id: '1' }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/__plural__/1'))
  })
})
EOF

emit $FEAT/${KEBAB}-list/${NAME}ListComponent.tsx <<'EOF'
// =============================================================================
// __Name__ List Component
// =============================================================================
// Presentation only: dispatch Input actions, render Output state.
// No service/repository/API imports here — everything goes through the ViewModel.
// =============================================================================

import { use__Name__ListViewModel } from '../viewmodels/__name__ListViewModel'

export function __Name__ListComponent() {
  const { output, dispatch } = use__Name__ListViewModel()

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">__Name__s</h2>

      {output.error && (
        <div className="alert alert-danger d-flex justify-content-between" role="alert">
          <span>{output.error}</span>
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => void dispatch({ type: 'DISMISS_ERROR' })} />
        </div>
      )}

      {output.isLoading && <p className="text-muted">Loading...</p>}
      {output.isEmpty && <p className="text-muted">No __plural__ yet.</p>}

      <ul className="list-group">
        {output.items.map((item) => (
          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
            <button type="button" className="btn btn-link p-0" onClick={() => void dispatch({ type: 'NAVIGATE_TO_DETAIL', id: item.id })}>
              {item.name}
            </button>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void dispatch({ type: 'DELETE', id: item.id })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
EOF

emit $FEAT/${KEBAB}-list/${NAME}ListComponent.test.tsx <<'EOF'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { __Name__ListComponent } from './__Name__ListComponent'
import type { __Name__ListOutput } from '../viewmodels/__name__ListViewModel'

const mockDispatch = vi.fn().mockResolvedValue(undefined)
let currentOutput: __Name__ListOutput

vi.mock('../viewmodels/__name__ListViewModel', () => ({
  use__Name__ListViewModel: () => ({ output: currentOutput, dispatch: mockDispatch }),
}))

describe('__Name__ListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentOutput = {
      items: [{ id: '1', name: 'Alpha', createdAt: new Date(), updatedAt: new Date() }],
      isLoading: false,
      error: null,
      isEmpty: false,
    }
  })

  it('renders items from Output', () => {
    render(<__Name__ListComponent />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('dispatches DELETE and NAVIGATE_TO_DETAIL Inputs', async () => {
    render(<__Name__ListComponent />)
    await userEvent.click(screen.getByText('Delete'))
    await userEvent.click(screen.getByText('Alpha'))
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DELETE', id: '1' })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_TO_DETAIL', id: '1' })
  })

  it('shows the empty state and error', async () => {
    currentOutput = { items: [], isLoading: false, error: 'bad', isEmpty: true }
    render(<__Name__ListComponent />)
    expect(screen.getByText('No __plural__ yet.')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Dismiss'))
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISMISS_ERROR' })
  })
})
EOF

# ---------------------------------------------------------------- anchor edits
pe() { perl -0pi -e "$1" "$2"; echo "  ~ $2"; }
pe "s#^(  UserService: 'UserService',\\n)#\$1  ${NAME}Service: '${NAME}Service',\\n#m" $CONTAINER
pe "s#^(  \\[ServiceTokens\\.UserService\\]: UserService\\n)#\$1  [ServiceTokens.${NAME}Service]: ${NAME}Service\\n#m" $CONTAINER
pe "s#^(import type \\{ UserService \\} from '\\@/app/domain/services/userService'\\n)#\$1import type { ${NAME}Service } from '\\@/app/domain/services/${CAMEL}Service'\\n#m" $CONTAINER
pe "s#^(import \\{ userService \\} from '\\@/app/data/services/impl/userServiceImpl'\\n)#\$1import { ${CAMEL}Service } from '\\@/app/data/services/impl/${CAMEL}ServiceImpl'\\n#m" $CONFIG
pe "s#^(  container\\.register\\(ServiceTokens\\.UserService, userService\\)\\n)#\$1  container.register(ServiceTokens.${NAME}Service, ${CAMEL}Service)\\n#m" $CONFIG
pe "s#^(  container\\.register\\(ServiceTokens\\.UserService, mocks\\.userService \\?\\? userService\\)\\n)#\$1  container.register(ServiceTokens.${NAME}Service, ${CAMEL}Service)\\n#m" $CONFIG
cat >> $PROVIDER <<EOF

/**
 * Resolve the ${NAME}Service from the DI container
 */
export function use${NAME}Service() {
  return useService(ServiceTokens.${NAME}Service)
}
EOF
echo "  ~ $PROVIDER"
pe "s#useUserService \\} from './DIProvider'#useUserService, use${NAME}Service } from './DIProvider'#" $DIINDEX
pe "s#^(  HOME: '/home',\\n)#\$1\\n  // ${NAME}s\\n  ${UPPER}S: '/${PLURAL}',\\n#m" $NAV
pe "s#^(// =+\\n// Loading Wrapper with Error Boundary\\n)#const ${NAME}ListComponent = lazy(() =>\\n  import('\\@presentation/features/${PLURAL}/${KEBAB}-list/${NAME}ListComponent').then((m) => ({\\n    default: m.${NAME}ListComponent,\\n  }))\\n)\\n\\n\$1#m" $ROUTES
pe "s#^(        \\{/\\* Projects Feature \\(Placeholder\\) \\*/\\}\\n)#        {/* ${NAME}s Feature */}\\n        <Route\\n          path=\"${PLURAL}\"\\n          element={\\n            <LazyWrapper>\\n              <${NAME}ListComponent />\\n            </LazyWrapper>\\n          }\\n        />\\n\\n\$1#m" $ROUTES

echo "new-feature: ${NAME} scaffolded. Next: npx tsc -b && npx vitest run && tools/arch-check.sh"
