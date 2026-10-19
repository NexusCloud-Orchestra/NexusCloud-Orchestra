import { useTheme } from "../../state/theme"
import { QuotaLight } from "./quota-light"
import { QuotaDark } from "./quota-dark"

export function QuotaPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <QuotaDark />
  }

  return <QuotaLight />
}

export default QuotaPage
