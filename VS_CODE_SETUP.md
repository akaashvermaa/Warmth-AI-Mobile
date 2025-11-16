# 📱 VS Code Virtual Phone Setup Guide

## 🚀 Quick Start with VS Code Emulator

### **Step 1: Install VS Code Extensions**
Open VS Code and install these extensions:
1. **React Native Tools** (by Microsoft) - Essential for React Native development
2. **ES7+ React/Redux/React-Native snippets** - Code snippets
3. **TypeScript Importer** - Auto imports
4. **Python** (by Microsoft) - For backend debugging

### **Step 2: Set Up Android Emulator**

**Option A: Android Studio (Recommended)**
1. Download Android Studio: https://developer.android.com/studio
2. Install it
3. Open Android Studio
4. Go to **Tools → Device Manager**
5. Click **Create Device**
6. Choose:
   - **Hardware**: Pixel 6 or Pixel 7
   - **System**: Latest Android version (API 33+)
   - **AVD Name**: Warmth_Test_Device
7. Click **Finish**
8. Start the emulator by clicking the Play button

**Option B: Command Line (Faster)**
```bash
# After installing Android Studio
# Accept licenses
flutter doctor --android-licenses

# List available devices
flutter devices

# Or use Android CLI
emulator -list-avds
```

### **Step 3: Open Project in VS Code**

1. Open VS Code
2. **File → Open Folder**
3. Select: `E:\WarmthApp`
4. Wait for VS Code to load

### **Step 4: Run the App in VS Code**

**Method A: Debug Panel**
1. Press **Ctrl+Shift+D** (Debug panel)
2. Select:
   - **"Debug Android"** for Android emulator
   - **"Debug iOS"** for iOS simulator (Mac only)
   - **"Debug Expo (Web)"** for web browser
3. Click **Play button** (green triangle)

**Method B: Command Palette**
1. Press **Ctrl+Shift+P**
2. Type: **"React Native: Run Android"**
3. Select and press Enter

**Method C: Run Tasks**
1. Press **Ctrl+Shift+P**
2. Type: **"Tasks: Run Task"**
3. Select:
   - **"Start Full Development Environment"** (runs both backend + mobile)
   - Or run them separately

### **Step 5: Start Backend (if not auto-started)**

1. Press **Ctrl+Shift+P**
2. Type: **"Tasks: Run Task"**
3. Select **"Start Backend"**

### **🎯 VS Code Shortcuts**

| Shortcut | Action |
|----------|--------|
| **Ctrl+Shift+D** | Open Debug panel |
| **Ctrl+Shift+P** | Command palette |
| **F5** | Start debugging |
| **Ctrl+F5** | Run without debugging |
| **Shift+F5** | Stop debugging |

### **🔧 Debug Features**

Once running, you can:
- **Live Reload**: Changes automatically update in emulator
- **Hot Reloading**: Press **R** in emulator for quick refresh
- **Debug Console**: See logs and errors
- **Breakpoints**: Set breakpoints in TypeScript/React code
- **Inspect Elements**: Use React DevTools

### **📱 Emulator Controls**

| Control | Function |
|---------|----------|
| **Ctrl+M** | Open developer menu |
| **R** | Reload app |
| **D** | Open debug menu |
| **Cmd+M** (Mac) | Same as Ctrl+M |

### **🐛 Troubleshooting**

**Emulator not starting:**
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <avd_name>
```

**Metro bundler issues:**
```bash
# Clear cache
cd mobile
npx react-native start --reset-cache
```

**Port conflicts:**
```bash
# Kill processes on ports 8081, 5000
npx kill-port 8081 5000
```

### **🎉 Success Indicators**

You'll know it's working when:
1. ✅ Android emulator opens and shows device home screen
2. ✅ VS Code shows "Connected" in debug console
3. ✅ Warmth app installs and launches on emulator
4. ✅ Backend shows "Starting Warmth Server" in terminal

---

## 📋 Checklist Before Starting

- [ ] VS Code installed
- [ ] React Native Tools extension installed
- [ ] Android Studio installed
- [ ] Android emulator created
- [ ] Project opened in VS Code (E:\WarmthApp)
- [ ] Backend running on port 5000

**🚀 Ready to develop! Your virtual phone is waiting!**