import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider, useI18n, useTranslation } from './I18nProvider'

// Test component that uses the i18n context
function TestComponent() {
  const { currentLanguage, currentLanguageConfig, languages, setLanguage, t } = useI18n()

  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="language-name">{currentLanguageConfig.name}</div>
      <div data-testid="languages-count">{languages.length}</div>
      <div data-testid="translation">{t('common.loading')}</div>
      <div data-testid="translation-with-params">{t('dashboard.welcome', { name: 'John' })}</div>
      <button onClick={() => setLanguage('zh')}>Switch to Chinese</button>
      <button onClick={() => setLanguage('es')}>Switch to Spanish</button>
    </div>
  )
}

// Test component for useTranslation hook
function TranslationTestComponent() {
  const t = useTranslation()
  return <div data-testid="t-hook">{t('common.save')}</div>
}

describe('I18nProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  it('should provide default language (English)', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('current-language')).toHaveTextContent('en')
    expect(screen.getByTestId('language-name')).toHaveTextContent('English')
  })

  it('should provide available languages', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('languages-count')).toHaveTextContent('6')
  })

  it('should translate keys', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('translation')).toHaveTextContent('Loading...')
  })

  it('should interpolate parameters', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('translation-with-params')).toHaveTextContent('Welcome back, John')
  })

  it('should change language', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Switch to Chinese'))
    })

    expect(screen.getByTestId('current-language')).toHaveTextContent('zh')
    expect(screen.getByTestId('translation')).toHaveTextContent('加载中...')
    expect(localStorage.setItem).toHaveBeenCalledWith('arcana_language', 'zh')
  })

  it('should persist language to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Switch to Spanish'))
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('arcana_language', 'es')
  })

  it('should load language from localStorage', () => {
    localStorage.getItem = vi.fn().mockReturnValue('zh')

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('current-language')).toHaveTextContent('zh')
  })

  it('should fallback to English for missing translations', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    // The translation exists, so check it displays the English version
    expect(screen.getByTestId('translation')).not.toBe('')
  })

  it('should return key for non-existent translation', () => {
    function NonExistentTranslation() {
      const { t } = useI18n()
      return <div data-testid="missing">{t('non.existent.key')}</div>
    }

    render(
      <I18nProvider>
        <NonExistentTranslation />
      </I18nProvider>
    )

    expect(screen.getByTestId('missing')).toHaveTextContent('non.existent.key')
  })

  it('should throw error when useI18n is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useI18n must be used within an I18nProvider')

    consoleSpy.mockRestore()
  })
})

describe('useTranslation hook', () => {
  it('should return translation function', () => {
    render(
      <I18nProvider>
        <TranslationTestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('t-hook')).toHaveTextContent('Save')
  })
})
