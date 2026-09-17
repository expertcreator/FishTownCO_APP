# 📦 Shared Mobile Module

Reusable components, utilities, and APIs for Fishtownco mobile applications.

---

## 📁 Structure Overview

```
shared/
├── components/       # 14 UI components
├── api/             # API client + React Query hooks
├── constants/       # Colors, fonts, icons, images
├── theme/           # Theme provider & hooks
├── translations/    # Internationalization (i18n) with RTL support
├── stores/          # MMKV storage utilities
├── utils/           # Helper functions
└── imports/         # Convenience re-exports
```

---

## 🎨 Components (14)

### **Core UI**
- **AppText** - Styled text with props (color, fontSize, fontWeight)
- **AppButton** - 5 variants (primary, secondary, outline, transparent, ghost), icons, loading
- **AppTextInput** - 3 variants (default, borderless, underline), left/right icons

### **Forms**
- **AppFloatingLabelFormField** - Animated floating label input
- **AppFormField** - Standard form field with label
- **RadioGroup** - Radio button group (horizontal/vertical)

### **Lists & Loaders**
- **AppList** - Optimized FlashList wrapper
- **Loader** - Fullscreen or inline, with blur option
- **AppLottieLoader** - Lottie animation loader

### **Specialized**
- **OtpTimer** - Countdown timer for OTP resend
- **Toast** - Notification system (success, error, info, warn) with i18n support
- **AppImage** - Optimized Expo Image component
- **AppBottomSheet** - Bottom sheet modal
- **KeyboardAwareContainer** - Auto-adjusts for keyboard

---

## 📖 Quick Start

### **1. Components**

```typescript
import AppButton from '@/shared/components/Button';
import AppText from '@/shared/components/Text';
import AppTextInput from '@/shared/components/TextInput';

<AppButton variant="primary" title="Submit" onPress={handleSubmit} />
<AppText color="#333" fontSize={18} fontWeight="bold">Hello</AppText>
<AppTextInput value={text} onChangeText={setText} placeholder="Search" />
```

### **2. Toast Notifications**

```typescript
// Setup once in _layout.tsx
import { ToastifyProvider } from '@/shared/components/Toast';
<ToastifyProvider />

// Use anywhere
import { Toastify } from '@/shared/components/Toast';
Toastify.success('Success!');
Toastify.error('Error!');

// Or with hook
import { useToast } from '@/shared/components/Toast';
const toast = useToast();
toast.success('Saved!');
```

### **3. API Hooks**

```typescript
import { useFetch, useMutation } from '@/shared/api';

// GET request
const { data, isLoading } = useFetch('/users');

// POST/PUT/DELETE
const { mutate } = useMutation('/users');
mutate({ name: 'John' }, {
  onSuccess: () => toast.success('Created!'),
  onError: () => toast.error('Failed!'),
});
```

### **4. Theme**

```typescript
import { ThemeProvider, useColors } from '@/shared/theme';

// Setup once
<ThemeProvider><App /></ThemeProvider>

// Use anywhere
const colors = useColors();
<View style={{ backgroundColor: colors.background }} />
```

### **5. Translations (i18n)**

```typescript
import { t, setLocale } from '@/shared/translations';
import { useI18nStore } from '@/shared/translations';

// Use translations
<AppText>{t('welcome.title')}</AppText>
<AppText>{t('auth.login')}</AppText>

// Change language
await setLocale('languageCode'); // e.g., 'en', 'ar', 'fr', 'es', etc.

// Get current language
const { locale } = useI18nStore();
```

### **6. Storage (MMKV)**

```typescript
import { mmkv } from '@/shared/stores/mmkvStorage';

mmkv.set('user.name', 'John');
const name = mmkv.getString('user.name');
mmkv.delete('user.name');
```

---

## 🎨 Styling

### **Using Theme Colors**
```typescript
import { useColors } from '@/shared/theme';
import { colors } from '@/shared/constants';

const themeColors = useColors(); // Dynamic (dark/light)

<AppText style={{ color: themeColors.text }}>Dynamic</AppText>
<AppText style={{ color: colors.primary }}>Static</AppText>
```

### **Using Constants**
```typescript
import { fonts, fontSizes, colors } from '@/shared/constants';
import { moderateScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.h1,
    color: colors.primary,
    padding: moderateScale(16), // Responsive
  },
});
```

---

## 📚 Component Props Reference

### **AppButton**
```typescript
<AppButton
  variant="primary|secondary|outline|transparent|ghost"
  title="Text"
  onPress={() => {}}
  loading={false}
  disabled={false}
  icon={IconComponent}
  iconPosition="left|right|center"
  rounded={false}
  width={number}
  height={number}
  style={ViewStyle}
/>
```

### **AppTextInput**
```typescript
<AppTextInput
  value={string}
  onChangeText={(text) => {}}
  placeholder="Text"
  variant="default|borderless|underline"
  leftIcon={IconComponent}
  rightIcon={IconComponent}
  onLeftIconPress={() => {}}
  onRightIconPress={() => {}}
  secureTextEntry={false}
  style={TextStyle}
  containerStyle={ViewStyle}
/>
```

### **Loader**
```typescript
<Loader
  visible={boolean}
  mode="fullscreen|inline"
  size="small|large"
  color="#007AFF"
  blur={false}
  blurIntensity={20}
/>
```

### **AppList**
```typescript
<AppList
  data={array}
  renderItem={({ item }) => <Component />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={100}
  horizontal={false}
  ListEmptyComponent={<Empty />}
/>
```

### **OtpTimer**
```typescript
<OtpTimer
  minutes={2}
  seconds={0}
  onResend={() => {}}
  autoStart={true}
  labelText="Resend OTP"
/>
```

### **RadioGroup**
```typescript
<RadioGroup
  options={[
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ]}
  value={selectedValue}
  onValueChange={setSelectedValue}
  direction="vertical|horizontal"
  activeColor="#007AFF"
/>
```

---

## 🌐 API Client

### **Setup**
```typescript
import { createApiClient } from '@/shared/api/client';

export const api = createApiClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

// Use directly
const response = await api.get('/users');
const user = await api.post('/users', data);
```

### **Hooks**
```typescript
// useFetch - GET requests with caching
const { data, isLoading, error, refetch } = useFetch('/endpoint');

// useMutation - POST/PUT/DELETE
const { mutate, isLoading } = useMutation('/endpoint');
mutate(payload, { onSuccess, onError });
```

---

## 🎨 Constants Available

```typescript
import { 
  colors,        // Color palette
  fonts,         // Font families
  fontSizes,     // Typography scale (h1, h2, h3, p, caption)
  iconSizes,     // Icon sizes (xs, sm, md, lg, xl, xxl)
  Icons,         // Icon imports
  Images,        // Image imports
  texts,         // Static texts
} from '@/shared/constants';
```

---

## 🌍 Theme Colors

```typescript
const colors = useColors();

colors.primary       // Primary brand color
colors.secondary     // Secondary color
colors.red, green, blue, yellow, purple, pink, indigo
colors.background    // Screen background
colors.surface       // Card/surface background
colors.card          // Card background
colors.text          // Primary text
colors.textSecondary // Secondary text
colors.textTertiary  // Tertiary text
colors.border        // Border color
colors.disabled      // Disabled state
colors.placeholder   // Placeholder text
```

---

## 📝 Complete Example

```typescript
import { useState } from 'react';
import AppTextInput from '@/shared/components/TextInput';
import AppButton from '@/shared/components/Button';
import AppText from '@/shared/components/Text';
import Loader from '@/shared/components/Loader';
import KeyboardAwareContainer from '@/shared/components/KeyboardAwareContainer';
import { useToast } from '@/shared/components/Toast';
import { useMutation } from '@/shared/api';
import { t } from '@/shared/translations';
import { colors, fonts, fontSizes } from '@/shared/constants';
import { useColors } from '@/shared/theme';
import { moderateScale } from 'react-native-size-matters';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToast();
  const themeColors = useColors();
  
  const { mutate: login, isLoading } = useMutation('/auth/login');
  
  const handleLogin = () => {
    login({ email, password }, {
      onSuccess: () => {
        toast.success(t('auth.loginSuccess'));
      },
      onError: () => {
        toast.error(t('auth.loginError'));
      },
    });
  };
  
  return (
    <KeyboardAwareContainer>
      <Loader visible={isLoading} mode="fullscreen" blur={true} />
      
      <AppText 
        fontSize={fontSizes.h1} 
        fontWeight="bold" 
        color={themeColors.primary}
        style={styles.title}
      >
        {t('auth.welcome')}
      </AppText>
      
      <AppTextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        variant="underline"
        containerStyle={styles.input}
      />
      
      <AppTextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        variant="underline"
        containerStyle={styles.input}
      />
      
      <AppButton
        variant="primary"
        title={t('auth.loginButton')}
        onPress={handleLogin}
        loading={isLoading}
        style={styles.button}
      />
    </KeyboardAwareContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: moderateScale(32),
  },
  input: {
    marginBottom: moderateScale(16),
  },
  button: {
    marginTop: moderateScale(24),
    width: '100%',
  },
});
```

---

## 🎯 Best Practices

1. ✅ Use shared components instead of native React Native components
2. ✅ Use `useColors()` for dynamic theming instead of hardcoded colors
3. ✅ Use `t()` for all user-facing text (i18n support)
4. ✅ Use `useFetch`/`useMutation` for API calls (automatic caching & error handling)
5. ✅ Use `mmkv` for fast local storage
6. ✅ Use constants (`fonts`, `fontSizes`, `colors`) for consistency
7. ✅ Use `moderateScale()` for responsive designs
8. ✅ Use `ToastifyProvider` in _layout.tsx
9. ✅ Use `ThemeProvider` to wrap your app

---

## 📦 Folder Details

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `components/` | 14 reusable UI components | Button, Text, TextInput, Toast, Loader, List, etc. |
| `api/` | API client & hooks | client.ts, useFetch.ts, useMutation.ts |
| `constants/` | Design tokens | colors.ts, fonts.ts, fontSizes.ts, images.ts |
| `theme/` | Theme system | ThemeContext.tsx (Provider, useTheme, useColors) |
| `translations/` | i18n with RTL | index.ts, resources.ts, store.ts, languageIcons.ts |
| `stores/` | Storage utils | mmkvStorage.ts (MMKV wrapper + Zustand integration) |
| `utils/` | Helpers | deviceId.ts, i18n.ts |
| `imports/` | Re-exports | Convenience imports for icons, ui, utils |

---

## 🚀 Features

- ✅ **14 Production-Ready Components** - Buttons, inputs, lists, loaders, modals
- ✅ **Theme System** - Auto dark/light mode with 15+ theme colors
- ✅ **Internationalization** - Multi-language support with RTL/LTR detection
- ✅ **API Layer** - React Query hooks with error handling
- ✅ **Fast Storage** - MMKV integration (fastest RN storage)
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Responsive** - react-native-size-matters integration
- ✅ **Optimized** - FlashList for 60fps lists
- ✅ **Toast Notifications** - Built-in notification system
- ✅ **Consistent Design** - Shared fonts, colors, sizes

---

**Built with ❤️ for Fishtownco mobile apps**
