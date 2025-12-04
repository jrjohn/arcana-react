// =============================================================================
// Network Status Service
// =============================================================================

import { signal, computed } from '@preact/signals-react'
import { Subject, fromEvent, merge } from 'rxjs'
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators'

/**
 * Network status states
 */
export const NetworkStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  SLOW: 'slow',
} as const

export type NetworkStatus = (typeof NetworkStatus)[keyof typeof NetworkStatus]

/**
 * Connection quality based on effective type
 */
export type ConnectionQuality = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'

/**
 * Network information
 */
export interface NetworkInfo {
  status: NetworkStatus
  isOnline: boolean
  connectionQuality: ConnectionQuality
  downlink?: number // Mbps
  rtt?: number // Round trip time in ms
  saveData?: boolean
  effectiveType?: string
}

// Reactive signals for network state
const networkStatus = signal<NetworkStatus>(
  navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE
)
const connectionQuality = signal<ConnectionQuality>('unknown')
const networkInfo = signal<NetworkInfo>({
  status: networkStatus.value,
  isOnline: navigator.onLine,
  connectionQuality: 'unknown',
})

// Computed values
const isOnline = computed(() => networkStatus.value === NetworkStatus.ONLINE)
const isOffline = computed(() => networkStatus.value === NetworkStatus.OFFLINE)
const isSlow = computed(() => networkStatus.value === NetworkStatus.SLOW)

// Observable for network status changes
const networkChange$ = new Subject<NetworkInfo>()

// Network Information API types
interface NetworkInformation extends EventTarget {
  downlink?: number
  effectiveType?: string
  rtt?: number
  saveData?: boolean
  type?: string
}

/**
 * Network Status Service
 * Monitors and reports network connectivity
 */
class NetworkStatusService {
  private initialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize network monitoring
   */
  private initialize(): void {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true

    // Listen for online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true))
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false))

    merge(online$, offline$)
      .pipe(distinctUntilChanged(), debounceTime(100))
      .subscribe((isOnlineNow) => {
        this.updateNetworkStatus(isOnlineNow)
      })

    // Monitor connection quality if available
    this.monitorConnectionQuality()

    // Initial status update
    this.updateNetworkStatus(navigator.onLine)
  }

  /**
   * Monitor connection quality using Network Information API
   */
  private monitorConnectionQuality(): void {
    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection

    if (!connection) return

    const updateQuality = () => {
      const effectiveType = connection.effectiveType as ConnectionQuality
      connectionQuality.value = effectiveType || 'unknown'

      // Check for slow connection
      if (
        effectiveType === 'slow-2g' ||
        effectiveType === '2g' ||
        (connection.rtt && connection.rtt > 500)
      ) {
        if (networkStatus.value === NetworkStatus.ONLINE) {
          networkStatus.value = NetworkStatus.SLOW
        }
      } else if (networkStatus.value === NetworkStatus.SLOW) {
        networkStatus.value = NetworkStatus.ONLINE
      }

      this.updateNetworkInfo()
    }

    connection.addEventListener('change', updateQuality)
    updateQuality()
  }

  /**
   * Update network status
   */
  private updateNetworkStatus(online: boolean): void {
    const previousStatus = networkStatus.value
    networkStatus.value = online ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE

    this.updateNetworkInfo()

    if (previousStatus !== networkStatus.value) {
      networkChange$.next(networkInfo.value)
    }
  }

  /**
   * Update network info signal
   */
  private updateNetworkInfo(): void {
    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection

    networkInfo.value = {
      status: networkStatus.value,
      isOnline: networkStatus.value !== NetworkStatus.OFFLINE,
      connectionQuality: connectionQuality.value,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      effectiveType: connection?.effectiveType,
    }
  }

  /**
   * Get current network status signal
   */
  get status() {
    return networkStatus
  }

  /**
   * Get isOnline computed signal
   */
  get online() {
    return isOnline
  }

  /**
   * Get isOffline computed signal
   */
  get offline() {
    return isOffline
  }

  /**
   * Get isSlow computed signal
   */
  get slow() {
    return isSlow
  }

  /**
   * Get network info signal
   */
  get info() {
    return networkInfo
  }

  /**
   * Get observable for network changes
   */
  get onChange$() {
    return networkChange$.asObservable()
  }

  /**
   * Check if currently online (synchronous)
   */
  isCurrentlyOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Force refresh network status
   */
  refresh(): void {
    this.updateNetworkStatus(navigator.onLine)
  }
}

// Export singleton instance
export const networkStatusService = new NetworkStatusService()
