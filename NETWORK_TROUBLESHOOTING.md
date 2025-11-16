# 🔧 Network Connection Troubleshooting

## 🚨 Current Issue: "Network request failed"

### **Root Cause Found:**
Backend server is NOT running on port 5000, which means mobile app cannot connect to it.

## ✅ SOLUTION: Start Backend Server Properly

### **Step 1: Open VS Code Terminal**
1. **Open VS Code**
2. **Terminal → New Terminal** (Ctrl+Shift+`)
3. Navigate to backend folder:
   ```bash
   cd E:\WarmthApp\backend
   ```

### **Step 2: Activate Virtual Environment (if created)**
```bash
# If you created venv during setup
venv\Scripts\activate

# If no venv, skip this step
```

### **Step 3: Start Python Backend**
```bash
python run.py
```

**Expected Output:**
```
--- Starting Warmth Server at http://127.0.0.1:5000 ---
Debug mode: False
* Running on all addresses (0.0.0.0)
* Running on http://192.168.31.19:5000
* Running on http://127.0.0.1:5000
Press Ctrl+C to quit
```

### **Step 4: Verify Backend is Running**
Open browser and go to: `http://192.168.31.19:5000`
- Should show "404 Not Found" (this means server is responding!)
- If connection refused, backend is not running

### **Step 5: Start Mobile App**
In a NEW terminal:
```bash
cd E:\WarmthApp\mobile
npm start
```

### **Step 6: Test in Expo Go**
1. Scan QR code with Expo Go app
2. Try sending a chat message
3. **Should work now!** 🎉

## 🐛 Common Issues & Fixes

### **Issue: Backend not starting**
**Fix:** Make sure you're in the correct directory:
```bash
# WRONG: E:\WarmthApp\mobile\backend
# RIGHT: E:\WarmthApp\backend
python run.py
```

### **Issue: Virtual environment issues**
**Fix:** Skip venv activation if not created:
```bash
# Just run directly:
cd E:\WarmthApp\backend
python run.py
```

### **Issue: Port 5000 already in use**
**Fix:** Kill the process:
```bash
npx kill-port 5000
python run.py
```

### **Issue: Different IP address**
**Fix:** Get your current IP:
```bash
ipconfig | grep "IPv4" | head -1
```
Then update `mobile/src/services/api.ts`:
```typescript
// Replace 192.168.31.19 with your actual IP
const API_BASE_URL = 'http://YOUR_IP_HERE:5000';
```

### **Issue: Firewall blocking connection**
**Fix:** Allow Python through Windows Firewall when prompted

## 🔍 Testing Checklist

Before testing in Expo Go:
- [ ] Backend terminal shows "Running on all addresses (0.0.0.0)"
- [ ] Browser opens `http://192.168.31.19:5000` (shows 404)
- [ ] Mobile app starts without errors
- [ ] Phone and computer on same WiFi network

## 💡 Quick Test Commands

**Test backend connectivity:**
```bash
# In browser, go to:
http://192.168.31.19:5000
```

**Test network from command line:**
```bash
curl http://192.168.31.19:5000
```

---

**🎉 The network error should be resolved once the backend is running properly!**