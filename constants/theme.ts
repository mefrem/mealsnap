/**
 * Modern color palette for MealSnap app
 * Sharp, vibrant colors with excellent contrast
 */

import { Platform } from "react-native";

// Modern color palette
const primaryColor = "#6366F1"; // Indigo-500
const primaryDark = "#4F46E5"; // Indigo-600
const secondaryColor = "#10B981"; // Emerald-500
const accentColor = "#F59E0B"; // Amber-500
const errorColor = "#EF4444"; // Red-500
const successColor = "#10B981"; // Emerald-500

const tintColorLight = primaryColor;
const tintColorDark = "#A5B4FC"; // Indigo-300

export const Colors = {
  light: {
    text: "#1F2937", // Gray-800
    background: "#FFFFFF",
    surface: "#F9FAFB", // Gray-50
    tint: tintColorLight,
    icon: "#6B7280", // Gray-500
    tabIconDefault: "#9CA3AF", // Gray-400
    tabIconSelected: tintColorLight,
    primary: primaryColor,
    primaryDark: primaryDark,
    secondary: secondaryColor,
    accent: accentColor,
    error: errorColor,
    success: successColor,
    border: "#E5E7EB", // Gray-200
    card: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    text: "#F9FAFB", // Gray-50
    background: "#111827", // Gray-900
    surface: "#1F2937", // Gray-800
    tint: tintColorDark,
    icon: "#9CA3AF", // Gray-400
    tabIconDefault: "#6B7280", // Gray-500
    tabIconSelected: tintColorDark,
    primary: primaryColor,
    primaryDark: primaryDark,
    secondary: secondaryColor,
    accent: accentColor,
    error: errorColor,
    success: successColor,
    border: "#374151", // Gray-700
    card: "#1F2937", // Gray-800
    shadow: "rgba(0, 0, 0, 0.3)",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
