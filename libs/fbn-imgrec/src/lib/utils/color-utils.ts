export class ColorUtils {
  private static hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 }
  }
  
  private static adjustBrightness(hex: string, factor: number) {
    const { r, g, b } = ColorUtils.hexToRgb(hex)
    const adjustedR = Math.min(Math.round(r * factor), 255)
    const adjustedG = Math.min(Math.round(g * factor), 255)
    const adjustedB = Math.min(Math.round(b * factor), 255)
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`
  }
  
  private static calculateBrightness(rgbColor: { r: number; g: number; b: number }) {
    return (0.299 * rgbColor.r + 0.587 * rgbColor.g + 0.114 * rgbColor.b) / 255
  }
  
  public static getRandomBrightColor(): string {
    const letters = '0123456789ABCDEF'
    let color = '#'
  
    // Generate a random hue (color)
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)]
    }
  
    // Convert the color to RGB format
    let rgbColor = ColorUtils.hexToRgb(color)
  
    // Calculate color brightness (perceived luminance)
    let brightness = ColorUtils.calculateBrightness(rgbColor)
  
    const maxIterations = 10 // Set a maximum number of iterations
    let iterations = 0
    
    while (brightness < 0.7 && iterations < maxIterations) {
      color = ColorUtils.adjustBrightness(color, 1.2) // Increase brightness by 20%
      rgbColor = ColorUtils.hexToRgb(color)
      brightness = ColorUtils.calculateBrightness(rgbColor)
      iterations++
    }
  
    return color
  }
}
