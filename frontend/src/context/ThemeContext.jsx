import { createContext } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  toggleTheme: () => {},
  setTheme: () => {},
});

export default ThemeContext;
