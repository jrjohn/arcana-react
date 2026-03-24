import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { APP_CONSTANTS } from '@core/constants/app.constants'

// =============================================================================
// Types
// =============================================================================

export type Language = 'en' | 'zh' | 'zh-TW' | 'es' | 'fr' | 'de'

export interface LanguageConfig {
  code: Language
  name: string
  nativeName: string
  flag: string
}

type TranslationDictionary = Record<string, string>

interface I18nContextType {
  currentLanguage: Language
  currentLanguageConfig: LanguageConfig
  languages: LanguageConfig[]
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  translate: (key: string, params?: Record<string, string | number>) => string
}

// =============================================================================
// Available Languages
// =============================================================================

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
]

// =============================================================================
// Translations
// =============================================================================

const translations = new Map<Language, TranslationDictionary>()

// English translations
translations.set('en', {
  // Common
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.search': 'Search',
  'common.refresh': 'Refresh',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.submit': 'Submit',
  'common.reset': 'Reset',
  'common.clear': 'Clear',
  'common.filter': 'Filter',
  'common.export': 'Export',
  'common.import': 'Import',
  'common.download': 'Download',
  'common.upload': 'Upload',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.warning': 'Warning',
  'common.info': 'Information',
  'common.view': 'View',
  'common.actions': 'Actions',

  // User Management
  'user.management': 'User Management',
  'user.list.title': 'User Management',
  'user.list.subtitle': 'Manage and view all users',
  'user.list.create': 'Create New User',
  'user.list.search.placeholder': 'Search by name or email...',
  'user.list.view.all': 'View All Users',
  'user.list.showing': 'Showing {{start}} to {{end}} of {{total}} users',
  'user.list.no.results': 'No users found',
  'user.list.empty.message': 'Get started by creating your first user',
  'user.list.empty.search': 'No users match your search criteria',

  // User Detail
  'user.detail.title': 'User Details',
  'user.detail.subtitle': 'View user information',
  'user.detail.information': 'User Information',
  'user.detail.information.description': 'This is a detailed view of the user. You can edit the user information by clicking the "Edit User" button above.',
  'user.detail.user.id': 'User ID',
  'user.detail.first.name': 'First Name',
  'user.detail.last.name': 'Last Name',
  'user.detail.email.address': 'Email Address',
  'user.detail.created.at': 'Created At',
  'user.detail.updated.at': 'Updated At',
  'user.detail.avatar.url': 'Avatar URL',
  'user.detail.back.to.list': 'Back to List',
  'user.detail.edit.user': 'Edit User',
  'user.detail.loading': 'Loading user details...',

  // User Form
  'user.form.create.title': 'Create User',
  'user.form.edit.title': 'Edit User',
  'user.form.create.subtitle': 'Fill in the form to create a new user',
  'user.form.edit.subtitle': 'Update user information',
  'user.form.loading': 'Loading user data...',
  'user.form.field.first.name': 'First Name',
  'user.form.field.last.name': 'Last Name',
  'user.form.field.email': 'Email',
  'user.form.field.avatar': 'Avatar URL',
  'user.form.placeholder.first.name': 'Enter first name',
  'user.form.placeholder.last.name': 'Enter last name',
  'user.form.placeholder.email': 'Enter email address',
  'user.form.placeholder.avatar': 'https://example.com/avatar.jpg',
  'user.form.optional': 'Optional',
  'user.form.button.cancel': 'Cancel',
  'user.form.button.saving': 'Saving...',
  'user.form.button.create': 'Create User',
  'user.form.button.update': 'Update User',
  'user.form.help.title': 'Field Requirements',
  'user.form.help.name.length': 'First and last names must be at least 2 characters',
  'user.form.help.name.characters': 'Names can only contain letters, spaces, hyphens, and apostrophes',
  'user.form.help.email.format': 'Email must be a valid email address format',
  'user.form.help.avatar.optional': 'Avatar URL is optional but must be a valid URL if provided',

  // Form Validation Errors
  'user.form.error.first.name.required': 'First name is required',
  'user.form.error.first.name.min': 'First name must be at least 2 characters',
  'user.form.error.first.name.max': 'First name must not exceed 50 characters',
  'user.form.error.first.name.pattern': 'First name can only contain letters, spaces, hyphens, and apostrophes',
  'user.form.error.last.name.required': 'Last name is required',
  'user.form.error.last.name.min': 'Last name must be at least 2 characters',
  'user.form.error.last.name.max': 'Last name must not exceed 50 characters',
  'user.form.error.last.name.pattern': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
  'user.form.error.email.required': 'Email is required',
  'user.form.error.email.invalid': 'Please enter a valid email address',
  'user.form.error.avatar.invalid': 'Please enter a valid URL',

  // Success Messages
  'user.created.success': 'User {{name}} created successfully',
  'user.updated.success': 'User {{name}} updated successfully',
  'user.deleted.success': 'User {{name}} deleted successfully',

  // Delete Confirmation
  'user.delete.title': 'Delete User',
  'user.delete.message': 'Are you sure you want to delete {{name}}?',
  'user.delete.description': 'This action cannot be undone.',

  // Error Messages
  'error.network': 'Unable to connect to the server. Please check your internet connection.',
  'error.validation': 'Please check your input and try again.',
  'error.storage': 'Unable to save data locally. Please try again.',
  'error.authentication': 'Authentication required. Please log in.',
  'error.authorization': 'You do not have permission to perform this action.',
  'error.not.found': 'The requested resource was not found.',
  'error.server': 'Server error occurred. Please try again later.',
  'error.unknown': 'An unexpected error occurred. Please try again.',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Welcome to your dashboard',
  'dashboard.welcome': 'Welcome back, {{name}}',
  'dashboard.stats.users': 'Total Users',
  'dashboard.stats.projects': 'Active Projects',
  'dashboard.stats.tasks': 'Pending Tasks',
  'dashboard.stats.messages': 'Messages',
  'dashboard.quick.actions': 'Quick Actions',
  'dashboard.recent.activity': 'Recent Activity',
  'dashboard.system.stats': 'System Stats',
  'dashboard.quick.links': 'Quick Links',
  'dashboard.export.report': 'Export Report',
  'dashboard.new.item': 'New Item',
  'dashboard.view.all': 'View All',
  'dashboard.create.user': 'Create User',
  'dashboard.new.project': 'New Project',
  'dashboard.view.documents': 'View Documents',
  'dashboard.analytics': 'Analytics',

  // Navigation
  'nav.main.menu': 'MAIN MENU',
  'nav.home': 'Dashboard',
  'nav.users': 'User Management',
  'nav.projects': 'Projects',
  'nav.projects.all': 'All Projects',
  'nav.projects.create': 'Create Project',
  'nav.projects.archived': 'Archived',
  'nav.tasks': 'Tasks',
  'nav.tasks.my': 'My Tasks',
  'nav.tasks.recent': 'Recent',
  'nav.tasks.important': 'Important',
  'nav.calendar': 'Calendar',
  'nav.messages': 'Messages',
  'nav.documents': 'Documents',
  'nav.analytics': 'Analytics',
  'nav.analytics.overview': 'Overview',
  'nav.analytics.reports': 'Reports',
  'nav.analytics.performance': 'Performance',
  'nav.settings': 'Settings',
  'nav.profile': 'View Profile',
  'nav.logout': 'Logout',
  'nav.my.profile': 'My Profile',
  'nav.notifications': 'Notifications',
  'nav.help': 'Help',

  // Header
  'header.search.placeholder': 'Search...',

  // Sidebar
  'sidebar.storage': 'Storage',

  // Panel
  'panel.activity.center': 'Activity Center',
  'panel.activity.tab': 'Activity',
  'panel.notifications.tab': 'Notifications',
  'panel.settings': 'Settings',
  'panel.recent.activity': 'Recent Activity',
  'panel.clear.all': 'Clear All',
  'panel.mark.all.read': 'Mark All Read',
  'panel.no.activity': 'No recent activity',
  'panel.no.notifications': 'No notifications',
  'panel.push.notifications': 'Push Notifications',
  'panel.email.notifications': 'Email Notifications',
  'panel.dark.mode': 'Dark Mode',
  'panel.two.factor': 'Two-Factor Auth',
  'panel.privacy.mode': 'Privacy Mode',
  'panel.system.info': 'System Information',
  'panel.version': 'Version',
  'panel.build': 'Build',
  'panel.environment': 'Environment',

  // Table
  'table.id': 'ID',
  'table.avatar': 'Avatar',
  'table.name': 'Name',
  'table.email': 'Email',
  'table.actions': 'Actions',
})

// Chinese (Simplified) translations
translations.set('zh', {
  // Common
  'common.loading': '加载中...',
  'common.save': '保存',
  'common.cancel': '取消',
  'common.delete': '删除',
  'common.edit': '编辑',
  'common.create': '创建',
  'common.search': '搜索',
  'common.refresh': '刷新',
  'common.confirm': '确认',
  'common.close': '关闭',
  'common.back': '返回',
  'common.next': '下一步',
  'common.previous': '上一步',
  'common.submit': '提交',
  'common.reset': '重置',
  'common.clear': '清除',
  'common.filter': '筛选',
  'common.export': '导出',
  'common.import': '导入',
  'common.download': '下载',
  'common.upload': '上传',
  'common.yes': '是',
  'common.no': '否',
  'common.ok': '确定',
  'common.error': '错误',
  'common.success': '成功',
  'common.warning': '警告',
  'common.info': '信息',
  'common.view': '查看',
  'common.actions': '操作',

  // User Management
  'user.management': '用户管理',
  'user.list.title': '用户管理',
  'user.list.subtitle': '管理和查看所有用户',
  'user.list.create': '创建新用户',
  'user.list.search.placeholder': '按姓名或电子邮件搜索...',
  'user.list.view.all': '查看所有用户',
  'user.list.showing': '显示 {{start}} - {{end}} 共 {{total}} 条',
  'user.list.no.results': '未找到用户',
  'user.list.empty.message': '从创建您的第一个用户开始',
  'user.list.empty.search': '没有用户匹配您的搜索条件',

  // User Detail
  'user.detail.title': '用户详情',
  'user.detail.subtitle': '查看用户信息',
  'user.detail.information': '用户信息',
  'user.detail.information.description': '这是用户的详细视图。您可以通过点击上方的"编辑用户"按钮来编辑用户信息。',
  'user.detail.user.id': '用户ID',
  'user.detail.first.name': '名字',
  'user.detail.last.name': '姓氏',
  'user.detail.email.address': '电子邮件地址',
  'user.detail.created.at': '创建时间',
  'user.detail.updated.at': '更新时间',
  'user.detail.avatar.url': '头像URL',
  'user.detail.back.to.list': '返回列表',
  'user.detail.edit.user': '编辑用户',
  'user.detail.loading': '正在加载用户详情...',

  // User Form
  'user.form.create.title': '创建用户',
  'user.form.edit.title': '编辑用户',
  'user.form.create.subtitle': '填写表单以创建新用户',
  'user.form.edit.subtitle': '更新用户信息',
  'user.form.loading': '正在加载用户数据...',
  'user.form.field.first.name': '名字',
  'user.form.field.last.name': '姓氏',
  'user.form.field.email': '电子邮件',
  'user.form.field.avatar': '头像URL',
  'user.form.placeholder.first.name': '输入名字',
  'user.form.placeholder.last.name': '输入姓氏',
  'user.form.placeholder.email': '输入电子邮件地址',
  'user.form.placeholder.avatar': 'https://example.com/avatar.jpg',
  'user.form.optional': '可选',
  'user.form.button.cancel': '取消',
  'user.form.button.saving': '保存中...',
  'user.form.button.create': '创建用户',
  'user.form.button.update': '更新用户',
  'user.form.help.title': '字段要求',
  'user.form.help.name.length': '名字和姓氏至少需要2个字符',
  'user.form.help.name.characters': '名字只能包含字母、空格、连字符和撇号',
  'user.form.help.email.format': '电子邮件必须是有效的电子邮件地址格式',
  'user.form.help.avatar.optional': '头像URL是可选的，但如果提供必须是有效的URL',

  // Form Validation Errors
  'user.form.error.first.name.required': '名字是必填项',
  'user.form.error.first.name.min': '名字至少需要2个字符',
  'user.form.error.first.name.max': '名字不能超过50个字符',
  'user.form.error.first.name.pattern': '名字只能包含字母、空格、连字符和撇号',
  'user.form.error.last.name.required': '姓氏是必填项',
  'user.form.error.last.name.min': '姓氏至少需要2个字符',
  'user.form.error.last.name.max': '姓氏不能超过50个字符',
  'user.form.error.last.name.pattern': '姓氏只能包含字母、空格、连字符和撇号',
  'user.form.error.email.required': '电子邮件是必填项',
  'user.form.error.email.invalid': '请输入有效的电子邮件地址',
  'user.form.error.avatar.invalid': '请输入有效的URL',

  // Success Messages
  'user.created.success': '用户 {{name}} 创建成功',
  'user.updated.success': '用户 {{name}} 更新成功',
  'user.deleted.success': '用户 {{name}} 删除成功',

  // Delete Confirmation
  'user.delete.title': '删除用户',
  'user.delete.message': '您确定要删除 {{name}} 吗？',
  'user.delete.description': '此操作无法撤消。',

  // Error Messages
  'error.network': '无法连接到服务器。请检查您的互联网连接。',
  'error.validation': '请检查您的输入并重试。',
  'error.storage': '无法在本地保存数据。请重试。',
  'error.authentication': '需要身份验证。请登录。',
  'error.authorization': '您无权执行此操作。',
  'error.not.found': '未找到请求的资源。',
  'error.server': '服务器错误。请稍后重试。',
  'error.unknown': '发生意外错误。请重试。',

  // Dashboard
  'dashboard.title': '仪表板',
  'dashboard.subtitle': '欢迎使用您的仪表板',
  'dashboard.welcome': '欢迎回来，{{name}}',
  'dashboard.stats.users': '总用户数',
  'dashboard.stats.projects': '活跃项目',
  'dashboard.stats.tasks': '待办任务',
  'dashboard.stats.messages': '消息',
  'dashboard.quick.actions': '快速操作',
  'dashboard.recent.activity': '最近活动',
  'dashboard.system.stats': '系统统计',
  'dashboard.quick.links': '快速链接',
  'dashboard.export.report': '导出报告',
  'dashboard.new.item': '新建项目',
  'dashboard.view.all': '查看全部',
  'dashboard.create.user': '创建用户',
  'dashboard.new.project': '新建项目',
  'dashboard.view.documents': '查看文档',
  'dashboard.analytics': '分析',

  // Navigation
  'nav.main.menu': '主菜单',
  'nav.home': '仪表板',
  'nav.users': '用户管理',
  'nav.projects': '项目',
  'nav.projects.all': '所有项目',
  'nav.projects.create': '创建项目',
  'nav.projects.archived': '已归档',
  'nav.tasks': '任务',
  'nav.tasks.my': '我的任务',
  'nav.tasks.recent': '最近',
  'nav.tasks.important': '重要',
  'nav.calendar': '日历',
  'nav.messages': '消息',
  'nav.documents': '文档',
  'nav.analytics': '分析',
  'nav.analytics.overview': '概览',
  'nav.analytics.reports': '报告',
  'nav.analytics.performance': '性能',
  'nav.settings': '设置',
  'nav.profile': '查看个人资料',
  'nav.logout': '退出登录',
  'nav.my.profile': '我的资料',
  'nav.notifications': '通知',
  'nav.help': '帮助',

  // Header
  'header.search.placeholder': '搜索...',

  // Sidebar
  'sidebar.storage': '存储',

  // Panel
  'panel.activity.center': '活动中心',
  'panel.activity.tab': '活动',
  'panel.notifications.tab': '通知',
  'panel.settings': '设置',
  'panel.recent.activity': '最近活动',
  'panel.clear.all': '全部清除',
  'panel.mark.all.read': '全部标记已读',
  'panel.no.activity': '暂无最近活动',
  'panel.no.notifications': '暂无通知',
  'panel.push.notifications': '推送通知',
  'panel.email.notifications': '邮件通知',
  'panel.dark.mode': '深色模式',
  'panel.two.factor': '两步验证',
  'panel.privacy.mode': '隐私模式',
  'panel.system.info': '系统信息',
  'panel.version': '版本',
  'panel.build': '构建',
  'panel.environment': '环境',

  // Table
  'table.id': 'ID',
  'table.avatar': '头像',
  'table.name': '姓名',
  'table.email': '电子邮件',
  'table.actions': '操作',
})

// Traditional Chinese
const zhTW: TranslationDictionary = { ...translations.get('zh')! }
zhTW['user.management'] = '使用者管理'
zhTW['user.list.title'] = '使用者管理'
zhTW['user.list.subtitle'] = '管理和檢視所有使用者'
zhTW['user.list.create'] = '建立新使用者'
zhTW['user.list.search.placeholder'] = '按姓名或電子郵件搜尋...'
zhTW['user.list.empty.message'] = '從建立您的第一個使用者開始'
zhTW['user.list.empty.search'] = '沒有使用者符合您的搜尋條件'
zhTW['user.list.no.results'] = '未找到使用者'
zhTW['nav.main.menu'] = '主選單'
zhTW['nav.home'] = '儀表板'
zhTW['nav.users'] = '使用者管理'
zhTW['nav.projects'] = '專案'
zhTW['nav.settings'] = '設定'
zhTW['header.search.placeholder'] = '搜尋...'
zhTW['sidebar.storage'] = '儲存空間'
translations.set('zh-TW', zhTW)

// Spanish
translations.set('es', {
  ...translations.get('en')!,
  'common.loading': 'Cargando...',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.search': 'Buscar',
  'user.management': 'Gestión de Usuarios',
  'user.list.title': 'Gestión de Usuarios',
  'user.list.subtitle': 'Gestionar y ver todos los usuarios',
  'user.list.create': 'Crear Nuevo Usuario',
  'user.list.search.placeholder': 'Buscar por nombre o correo...',
  'nav.main.menu': 'MENÚ PRINCIPAL',
  'nav.home': 'Panel',
  'nav.users': 'Gestión de Usuarios',
  'nav.settings': 'Configuración',
  'header.search.placeholder': 'Buscar...',
})

// French
translations.set('fr', {
  ...translations.get('en')!,
  'common.loading': 'Chargement...',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.search': 'Rechercher',
  'user.management': 'Gestion des Utilisateurs',
  'user.list.title': 'Gestion des Utilisateurs',
  'user.list.subtitle': 'Gérer et voir tous les utilisateurs',
  'user.list.create': 'Créer un Nouvel Utilisateur',
  'user.list.search.placeholder': 'Rechercher par nom ou email...',
  'nav.main.menu': 'MENU PRINCIPAL',
  'nav.home': 'Tableau de Bord',
  'nav.users': 'Gestion des Utilisateurs',
  'nav.settings': 'Paramètres',
  'header.search.placeholder': 'Rechercher...',
})

// German
translations.set('de', {
  ...translations.get('en')!,
  'common.loading': 'Laden...',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.delete': 'Löschen',
  'common.edit': 'Bearbeiten',
  'common.search': 'Suchen',
  'user.management': 'Benutzerverwaltung',
  'user.list.title': 'Benutzerverwaltung',
  'user.list.subtitle': 'Alle Benutzer verwalten und anzeigen',
  'user.list.create': 'Neuen Benutzer Erstellen',
  'user.list.search.placeholder': 'Nach Name oder E-Mail suchen...',
  'nav.main.menu': 'HAUPTMENÜ',
  'nav.home': 'Dashboard',
  'nav.users': 'Benutzerverwaltung',
  'nav.settings': 'Einstellungen',
  'header.search.placeholder': 'Suchen...',
})

// =============================================================================
// Context
// =============================================================================

const I18nContext = createContext<I18nContextType | null>(null)

// =============================================================================
// Helper Functions
// =============================================================================

function loadLanguage(): Language {
  const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.LANGUAGE)
  if (stored && LANGUAGES.some(l => l.code === stored)) {
    return stored as Language
  }
  return 'en'
}

// =============================================================================
// Provider Component
// =============================================================================

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: Readonly<I18nProviderProps>) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(loadLanguage)

  const currentLanguageConfig = LANGUAGES.find(l => l.code === currentLanguage)!

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.LANGUAGE, language)
    document.documentElement.lang = language
  }, [])

  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    const dictionary = translations.get(currentLanguage)

    if (!dictionary) {
      console.warn(`No translations found for language: ${currentLanguage}`)
      return key
    }

    let translation = dictionary[key]

    if (!translation) {
      // Fallback to English
      const enDictionary = translations.get('en')
      translation = enDictionary?.[key] || key
    }

    // Interpolate parameters
    if (params && translation) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replaceAll(
          `{{${paramKey}}}`,
          String(paramValue)
        )
      })
    }

    return translation
  }, [currentLanguage])

  // Set initial language on document
  useEffect(() => {
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  const value: I18nContextType = useMemo(() => ({
    currentLanguage,
    currentLanguageConfig,
    languages: LANGUAGES,
    setLanguage,
    t: translate,
    translate,
  }), [currentLanguage, currentLanguageConfig, setLanguage, translate])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Shorthand hook for just the translate function
export function useTranslation() {
  const { t } = useI18n()
  return t
}
