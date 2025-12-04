// =============================================================================
// API Service
// =============================================================================

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { Subject } from 'rxjs'
import { APP_CONSTANTS } from '@/app/core/constants/app.constants'
import { AppError, ErrorCategory } from '@/app/domain/entities/app-error.model'
import { networkStatusService } from '@/app/domain/services/networkStatusService'

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T
  status: number
  headers: Record<string, string>
}

/**
 * API Error event
 */
export interface ApiErrorEvent {
  error: AppError
  config: AxiosRequestConfig
  timestamp: Date
}

/**
 * Request interceptor for adding auth token
 */
const authInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN)

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

/**
 * Request interceptor for adding request ID
 */
const requestIdInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (config.headers) {
    config.headers['X-Request-ID'] = crypto.randomUUID()
  }
  return config
}

/**
 * API Service class
 * Centralized HTTP client with interceptors and error handling
 */
class ApiService {
  private client: AxiosInstance
  private errorSubject = new Subject<ApiErrorEvent>()

  constructor() {
    this.client = axios.create({
      baseURL: APP_CONSTANTS.API.BASE_URL,
      timeout: APP_CONSTANTS.API.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'reqres_30bb4b25423642c18ddde61de8cadc40',
      },
    })

    this.setupInterceptors()
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptors
    this.client.interceptors.request.use(authInterceptor)
    this.client.interceptors.request.use(requestIdInterceptor)

    // Check network before request
    this.client.interceptors.request.use((config) => {
      if (!networkStatusService.isCurrentlyOnline()) {
        return Promise.reject(AppError.network('No internet connection'))
      }
      return config
    })

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    )
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Promise<never> {
    let appError: AppError

    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = (error.response.data as { message?: string })?.message

      appError = AppError.fromHttpStatus(status, message)
    } else if (error.request) {
      // Request was made but no response received
      appError = AppError.network('Server not responding', error)
    } else {
      // Request setup error
      appError = new AppError(error.message || 'Request failed', ErrorCategory.UNKNOWN, {
        originalError: error,
      })
    }

    // Emit error event
    this.errorSubject.next({
      error: appError,
      config: error.config || {},
      timestamp: new Date(),
    })

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      this.handleUnauthorized()
    }

    return Promise.reject(appError)
  }

  /**
   * Handle unauthorized response
   */
  private handleUnauthorized(): void {
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.USER)

    // Dispatch custom event for auth provider to handle
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  /**
   * Observable for error events
   */
  get errors$() {
    return this.errorSubject.asObservable()
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<T>(url, data, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  /**
   * Get axios instance for advanced usage
   */
  get instance(): AxiosInstance {
    return this.client
  }

  /**
   * Set custom header
   */
  setHeader(name: string, value: string): void {
    this.client.defaults.headers.common[name] = value
  }

  /**
   * Remove custom header
   */
  removeHeader(name: string): void {
    delete this.client.defaults.headers.common[name]
  }

  /**
   * Set base URL
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url
  }
}

// Export singleton instance
export const apiService = new ApiService()
