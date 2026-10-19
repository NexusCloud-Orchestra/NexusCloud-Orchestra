import { useTheme } from "../../state/theme"
import { ActivityLight } from "./activity-light"
import { ActivityDark } from "./activity-dark"

export function ActivityPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <ActivityDark />
  }

  return <ActivityLight />
}

export default ActivityPage
