import { useTheme } from "../../state/theme"
import { OverviewLight } from "./overview-light"
import { OverviewDark } from "./overview-dark"

export function OverviewPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <OverviewDark />
  }

  return <OverviewLight />
}

export default OverviewPage
