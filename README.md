# Warmth - Mental Health Companion App

A complete full-stack mental health companion with AI-powered chat, mood tracking, and journaling features.

## 🏗️ Project Structure

```
WarmthApp/
├── backend/                # Python Flask API server
│   ├── app/               # Main application code
│   ├── requirements.txt   # Python dependencies
│   ├── run.py            # Backend entry point
│   └── setup_nltk.py     # NLTK data setup
│
├── mobile/                # React Native mobile app
│   ├── src/
│   │   ├── screens/      # App screens (Login, Chat, Journal)
│   │   ├── services/     # API and Supabase services
│   │   ├── contexts/     # React contexts
│   │   ├── navigation/   # App navigation
│   │   └── types/        # TypeScript definitions
│   ├── App.tsx          # Mobile app entry point
│   └── package.json     # Node.js dependencies
│
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **Python 3.8+** - [Download here](https://python.org/)
3. **Expo Go App** on your phone (from App Store/Play Store)
4. **Supabase Account** - [Sign up here](https://supabase.com/)

### Step 1: Set Up Backend

```bash
# Navigate to backend directory
cd WarmthApp/backend

# Create Python virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download required NLTK data
python setup_nltk.py

# Start the backend server
python run.py
```

The backend will start at `http://127.0.0.1:5000`

### Step 2: Set Up Mobile App

```bash
# Navigate to mobile directory (in a new terminal)
cd WarmthApp/mobile

# Install Node.js dependencies
npm install

# Start the mobile app
npm start
```

### Step 3: Run on Your Phone

1. Open **Expo Go** app on your phone
2. Scan the QR code shown in the terminal
3. The app will load and connect to your backend

## 📱 Features

### Backend (Python + Flask + Supabase)
- **AI Chat Integration**: Connects with Ollama LLM for intelligent conversations
- **Supabase Database**: Cloud-based user data storage
- **Mood Tracking**: Analyzes and logs user emotional states
- **Memory System**: Remembers important user details
- **Authentication**: Secure user login and registration
- **REST API**: Clean endpoints for mobile app communication

### Mobile App (React Native + Expo)
- **Authentication Screen**: Login with email/password or Google
- **Chat Interface**: Beautiful message bubbles with real-time responses
- **Journal/Diary**: Mood tracking and daily journal entries
- **Responsive UI**: Clean, modern design optimized for mobile
- **Offline Support**: Works seamlessly with network interruptions

## 🔧 Configuration

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Run the SQL setup script in your Supabase SQL editor (see `backend/setup.sql`)
3. Update your Supabase credentials in:
   - `backend/app/config.py`
   - `mobile/src/services/supabase.ts`

### Backend Configuration

Edit `backend/app/config.py`:

```python
# Update these with your Supabase values
SUPABASE_URL = 'your-supabase-url'
SUPABASE_KEY = 'your-supabase-anon-key'
SUPABASE_SERVICE_KEY = 'your-supabase-service-key'

# LLM Configuration
OLLAMA_MODEL = 'llama3.2'  # Or your preferred model
```

### Mobile App Configuration

Edit `mobile/src/services/api.ts`:

```typescript
// Update this if your backend runs on different host/port
const API_BASE_URL = 'http://127.0.0.1:5000';
```

## 🧪 Testing

### Test Backend Only
```bash
cd WarmthApp/backend
python -c "from app import create_app; print('Backend loads successfully')"
```

### Test Mobile App Only
```bash
cd WarmthApp/mobile
npx tsc --noEmit  # Check TypeScript compilation
```

### Full Integration Test
1. Start backend: `cd backend && python run.py`
2. Start mobile app: `cd mobile && npm start`
3. Test login, chat, and journal features

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Send message to AI chat |
| `/auth/login` | POST | User authentication |
| `/mood` | POST | Log mood entry |
| `/mood/history` | GET | Get mood history |

## 🔒 Security

- **Supabase Auth**: Uses JWT tokens for secure authentication
- **Environment Variables**: Sensitive data stored in environment
- **Input Validation**: All user inputs validated and sanitized
- **CORS Protection**: Configured for mobile app access only

## 🚀 Deployment

### Backend Deployment (Optional)
- **Heroku**: Easy deployment with PostgreSQL
- **Railway**: Modern hosting platform
- **DigitalOcean**: Full control over server

### Mobile App Deployment
- **Expo EAS Build**: Build for iOS/Android stores
- **Code Signing**: Set up certificates for app stores
- **App Store Submission**: Follow platform guidelines

## 🛠️ Development

### Backend Development
```bash
cd WarmthApp/backend
pip install -r requirements.txt
python run.py  # Start in development mode
```

### Mobile Development
```bash
cd WarmthApp/mobile
npm start      # Start Expo development server
```

### Adding New Features
1. **Backend**: Add routes in `app/web/`, services in `app/services/`
2. **Mobile**: Add screens in `src/screens/`, update navigation

## 📝 Project Setup Scripts

### Setup Script (Windows)
```batch
@echo off
echo Setting up Warmth App...

echo Setting up backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python setup_nltk.py

echo Setting up mobile app...
cd ../mobile
npm install

echo Setup complete!
echo To start:
echo 1. Backend: cd backend && python run.py
echo 2. Mobile: cd mobile && npm start
```

### Setup Script (Mac/Linux)
```bash
#!/bin/bash
echo "Setting up Warmth App..."

echo "Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python setup_nltk.py

echo "Setting up mobile app..."
cd ../mobile
npm install

echo "Setup complete!"
echo "To start:"
echo "1. Backend: cd backend && python run.py"
echo "2. Mobile: cd mobile && npm start"
```

## 🐛 Troubleshooting

### Backend Issues
- **Port 5000 in use**: Change port in `run.py`
- **Supabase connection**: Check API keys and network
- **Ollama not running**: Install and start Ollama service

### Mobile Issues
- **Metro bundler errors**: `npx kill-port 8081`
- **Cannot connect to backend**: Check if both devices are on same WiFi
- **Build failures**: `npm install --force`

### Common Solutions
```bash
# Clear Metro cache
cd mobile && npx expo start --clear

# Reinstall dependencies
cd mobile && rm -rf node_modules package-lock.json && npm install

# Reset Python environment
cd backend && rm -rf venv && python -m venv venv
```

## 📄 License

This project is for educational purposes. Please ensure you comply with all terms of service for third-party services used.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository

---

**Built with ❤️ for mental wellness support**