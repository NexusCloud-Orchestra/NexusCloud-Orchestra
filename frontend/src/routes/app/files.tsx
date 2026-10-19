import { useTheme } from "../../state/theme"
import { FilesLight } from "./files-light"
import { FilesDark } from "./files-dark"

export function FilesPage() {
  const { isDark } = useTheme()

  if (isDark) {
    return <FilesDark />
  }

  return <FilesLight />
}

export default FilesPage
