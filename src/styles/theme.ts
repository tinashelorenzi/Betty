// Theme colors and styles for your Betty app with Dark/Light mode support
// Adjust these based on your actual logo colors

interface Colors {
    // Primary gradient colors (adjust based on your logo)
    primary: string;
    primaryDark: string;
    secondary: string;
    
    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundOverlay: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textLight: string;
    textWhite: string;
    
    // Input colors
    inputBackground: string;
    inputBorder: string;
    inputPlaceholder: string;
    
    // Status colors
    success: string;
    error: string;
    warning: string;
    info: string;
    
    // Accent colors
    accent: string;
    accentLight: string;
    
    // Shadow
    shadow: string;
  }
  
  interface Gradients {
    primary: [string, string];
    button: [string, string];
    background: [string, string];
  }
  
  interface Spacing {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  }
  
  interface BorderRadius {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  }
  
  interface FontSize {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  }
  
  interface FontWeight {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  }
  
  interface ShadowStyle {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  }
  
  interface Shadow {
    small: ShadowStyle;
    medium: ShadowStyle;
    large: ShadowStyle;
  }
  
  interface Theme {
    colors: Colors;
    gradients: Gradients;
    spacing: Spacing;
    borderRadius: BorderRadius;
    fontSize: FontSize;
    fontWeight: FontWeight;
    shadow: Shadow;
  }
  
  interface Theme {
    colors: Colors;
    gradients: Gradients;
    spacing: Spacing;
    borderRadius: BorderRadius;
    fontSize: FontSize;
    fontWeight: FontWeight;
    shadow: Shadow;
  }
  
  // Light theme
  const lightTheme: Theme = {
    colors: {
      // Primary gradient colors (adjust based on your logo)
      primary: '#667eea',
      primaryDark: '#4c63d2',
      secondary: '#764ba2',
      
      // Background colors
      background: '#f8f9fa',
      backgroundSecondary: '#ffffff',
      backgroundOverlay: 'rgba(255, 255, 255, 0.95)',
      
      // Text colors
      textPrimary: '#333333',
      textSecondary: '#666666',
      textLight: '#999999',
      textWhite: '#ffffff',
      
      // Input colors
      inputBackground: '#f8f9fa',
      inputBorder: '#e9ecef',
      inputPlaceholder: '#a0a0a0',
      
      // Status colors
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      
      // Accent colors
      accent: '#667eea',
      accentLight: '#8fa4f3',
      
      // Shadow
      shadow: '#000000',
    },
    
    gradients: {
      primary: ['#667eea', '#764ba2'],
      button: ['#4c63d2', '#667eea'],
      background: ['#667eea', '#764ba2'],
    },
    
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 28,
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    shadow: {
      small: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      },
    },
  };
  
  // Dark theme
  const darkTheme: Theme = {
    colors: {
      // Primary gradient colors (same as light for brand consistency)
      primary: '#667eea',
      primaryDark: '#4c63d2',
      secondary: '#764ba2',
      
      // Background colors - darker variants
      background: '#121212',
      backgroundSecondary: '#1e1e1e',
      backgroundOverlay: 'rgba(30, 30, 30, 0.95)',
      
      // Text colors - inverted for dark mode
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      textLight: '#999999',
      textWhite: '#ffffff',
      
      // Input colors - darker variants
      inputBackground: '#2a2a2a',
      inputBorder: '#404040',
      inputPlaceholder: '#808080',
      
      // Status colors (slightly adjusted for dark mode)
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3',
      
      // Accent colors (same for consistency)
      accent: '#667eea',
      accentLight: '#8fa4f3',
      
      // Shadow (lighter for dark mode)
      shadow: '#000000',
    },
    
    gradients: {
      primary: ['#667eea', '#764ba2'],
      button: ['#4c63d2', '#667eea'],
      background: ['#667eea', '#764ba2'],
    },
    
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 28,
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    shadow: {
      small: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
      },
    },
  };
  
  export { lightTheme, darkTheme };
  export type { Theme };
  
  export default lightTheme;