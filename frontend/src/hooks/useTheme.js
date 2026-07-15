import { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

export default function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be consumed inside a ThemeProvider');
  }
  return context;
}
