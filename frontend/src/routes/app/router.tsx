import { useTheme } from "../../state/theme"
import { RouterLight } from "./router-light"
import { RouterDark } from "./router-dark"

export function RouterPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <RouterDark />
  }

  return <RouterLight />
}

export default RouterPage
