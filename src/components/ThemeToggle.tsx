import { useTheme } from '../theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
      aria-label="切换亮暗主题"
    >
      <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
    </button>
  )
}
