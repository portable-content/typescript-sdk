/**
 * @fileoverview Demo of the new styling system capabilities
 */

import {
  // Core styling types
  Theme,
  StyleAdapter,
  defaultTheme,
  darkTheme,
  
  // Registry system
  registerAdapter,
  getAdapter,
  
  // Theme utilities
  mergeThemes,
  createThemeVariant,
  getThemeColor,
  
  // Validation
  validateStyleAdapter,
  testStyleAdapter,
  hasCapability,
  
  // Built-in adapters
  BaseStyleAdapter,
  createMockAdapter,
} from '../src/index';

console.log('🎨 Portable Content Styling System Demo\n');

// 1. Create and register adapters
console.log('1. Creating and registering adapters...');

const baseAdapter = new BaseStyleAdapter(defaultTheme);
const mockAdapter = createMockAdapter('demo-mock', darkTheme);

registerAdapter(baseAdapter);
registerAdapter(mockAdapter);

console.log(`✅ Registered adapters: ${getAdapter('base')?.name}, ${getAdapter('demo-mock')?.name}\n`);

// 2. Validate adapters
console.log('2. Validating adapters...');

const baseValidation = validateStyleAdapter(baseAdapter);
const mockValidation = validateStyleAdapter(mockAdapter);

console.log(`Base adapter validation: ${baseValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
console.log(`Mock adapter validation: ${mockValidation.valid ? '✅ Valid' : '❌ Invalid'}\n`);

// 3. Test adapter functionality
console.log('3. Testing adapter functionality...');

async function testAdapters() {
  const baseTest = await testStyleAdapter(baseAdapter);
  const mockTest = await testStyleAdapter(mockAdapter);
  
  console.log(`Base adapter test: ${baseTest.valid ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Mock adapter test: ${mockTest.valid ? '✅ Passed' : '❌ Failed'}\n`);
}

testAdapters();

// 4. Demonstrate style creation
console.log('4. Creating styles with different adapters...');

const styleDefinition = {
  container: {
    backgroundColor: 'theme.colors.background.primary',
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'theme.colors.text.primary',
  },
  button: {
    backgroundColor: 'theme.colors.primary',
    padding: 12,
    borderRadius: 6,
  },
};

const baseStyles = baseAdapter.createStyles(styleDefinition);
const mockStyles = mockAdapter.createStyles(styleDefinition);

console.log('Base adapter styles:', baseStyles);
console.log('Mock adapter styles:', mockStyles, '\n');

// 5. Demonstrate style combination
console.log('5. Combining styles...');

const additionalStyles = { marginTop: 20, opacity: 0.9 };
const combinedBase = baseAdapter.combineStyles(baseStyles.container, additionalStyles);
const combinedMock = mockAdapter.combineStyles(mockStyles, 'additional-class');

console.log('Combined base styles:', combinedBase);
console.log('Combined mock styles:', combinedMock, '\n');

// 6. Theme customization
console.log('6. Theme customization...');

const customTheme = mergeThemes(defaultTheme, {
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    text: {
      primary: '#2c3e50',
    },
  },
  spacing: {
    md: 20,
  },
});

const customAdapter = new BaseStyleAdapter(customTheme);
const customStyles = customAdapter.createStyles(styleDefinition);

console.log('Custom theme primary color:', getThemeColor(customTheme, 'primary'));
console.log('Custom adapter styles:', customStyles, '\n');

// 7. Capability detection
console.log('7. Adapter capabilities...');

console.log(`Base adapter supports responsive: ${hasCapability(baseAdapter, 'responsive')}`);
console.log(`Base adapter supports dark mode: ${hasCapability(baseAdapter, 'darkMode')}`);
console.log(`Mock adapter supports animations: ${hasCapability(mockAdapter, 'animations')}`);
console.log(`Mock adapter supports variants: ${hasCapability(mockAdapter, 'variants')}\n`);

// 8. Theme variants
console.log('8. Creating theme variants...');

const brandTheme = createThemeVariant(defaultTheme, {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  text: {
    primary: '#1f2937',
  },
});

console.log('Brand theme colors:', {
  primary: brandTheme.colors.primary,
  secondary: brandTheme.colors.secondary,
  textPrimary: brandTheme.colors.text.primary,
});

console.log('\n🎉 Styling system demo completed!');

export { baseAdapter, mockAdapter, customTheme, brandTheme };
