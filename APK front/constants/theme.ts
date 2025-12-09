// 🎨 Sistema de Colores Busco Fácil

export const lightColors = {
  // Colores primarios de la marca
  primary: '#054089',        // Azul Principal
  primaryLight: '#0756A3',   // Azul Acento
  primaryDark: '#043168',    // Azul Oscuro

  accent: '#60D9FA',         // Cyan Claro
  accentLight: '#60D9FA',    // Cyan Claro (mismo)

  // Fondos y superficies
  background: '#F7F9FC',     // Gris Claro
  surface: '#FFFFFF',        // Blanco
  textPrimary: '#1F2937',    // Gris Oscuro
  textSecondary: '#4B5563',  // Gris Texto
  border: '#D0D5DD',         // Gris Medio

  // Estados
  error: '#DC2626',          // Error/Destructivo
  success: '#16A34A',        // Éxito
  warning: '#F59E0B',        // Advertencia
  info: '#0756A3',           // Info (Azul Acento)

  // Burbujas de chat
  userBubble: '#054089',     // Azul Principal
  assistantBubble: '#F7F9FC',// Gris Claro
  systemBubble: '#60D9FA',   // Cyan Claro
};

export const darkColors = {
  // Colores primarios (ajustados para dark mode)
  primary: '#0756A3',        // Azul Acento (más claro en dark)
  primaryLight: '#60D9FA',   // Cyan para acentos
  primaryDark: '#054089',    // Azul Principal

  accent: '#60D9FA',         // Cyan Claro
  accentLight: '#60D9FA',    // Cyan Claro

  // Fondos y superficies oscuras
  background: '#1F2937',     // Gris Oscuro de la marca
  surface: '#374151',        // Gris medio oscuro
  textPrimary: '#FFFFFF',    // Blanco
  textSecondary: '#9CA3AF',  // Gris claro
  border: '#4B5563',         // Gris Texto

  // Estados
  error: '#DC2626',          // Error/Destructivo
  success: '#16A34A',        // Éxito
  warning: '#FBBF24',        // Advertencia
  info: '#60D9FA',           // Info (Cyan)

  // Burbujas de chat (dark mode)
  userBubble: '#0756A3',     // Azul Acento
  assistantBubble: '#374151',// Superficie dark
  systemBubble: '#374151',   // Superficie dark
};

export const colors = lightColors;

export function getColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};

// Sistema de espaciado base: 8px
export const spacing = {
  xs: 4,   // 0.5rem
  sm: 8,   // 1rem
  md: 16,  // 2rem
  lg: 24,  // 3rem
  xl: 32,  // 4rem
  '2xl': 48,  // 6rem
  '3xl': 64,  // 8rem
};

// Border Radius - Base: 12px
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,   // Base de la marca
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 12,
  },
};

// Constantes de marca para exportación
export const BRAND_COLORS = {
  primary: '#08509C',
  accent: '#0756A3',
  hover: '#0a5aa8',
  dark: '#043168',
  secondary: '#60D9FA',
  white: '#FFFFFF',
  error: '#DC2626',
  success: '#16A34A',
};

// Gradiente principal de la marca
export const BRAND_GRADIENT = {
  colors: ['#054089', '#0756A3'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};
