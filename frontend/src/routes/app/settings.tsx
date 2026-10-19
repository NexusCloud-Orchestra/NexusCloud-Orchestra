import { useTheme } from "../../state/theme"
import { SettingsLight } from "./settings-light"
import { SettingsDark } from "./settings-dark"

export function SettingsPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <SettingsDark />
  }

  return <SettingsLight />
}

export default SettingsPage
