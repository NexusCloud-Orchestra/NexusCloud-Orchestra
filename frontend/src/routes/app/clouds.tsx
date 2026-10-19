import { useTheme } from "../../state/theme"
import { CloudsLight } from "./clouds-light"
import { CloudsDark } from "./clouds-dark"

export function CloudsPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <CloudsDark />
  }

  return <CloudsLight />
}

export default CloudsPage
