# LucasGPT Quick Start Guide

Get LucasGPT running in 5 minutes!

## Automated Setup (Recommended)

### Windows (PowerShell):
```powershell
.\setup.ps1
```

### Mac/Linux (Bash):
```bash
chmod +x setup.sh
./setup.sh
```

## Manual Setup

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set a secure password:
```env
ADMIN_PASSWORD=your_secure_password_here
```

Generate and add a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET` in `.env`.

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## Run the Application

### Terminal 1 - Start Backend:
```bash
cd backend
npm start
```

You should see:
```
🚀 LucasGPT Backend running on port 4000
📡 Accepting requests from: http://localhost:5173
👤 Admin username: lucas
```

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready in Xms
➜  Local:   http://localhost:5173/
```

## Test the Application

1. **User Side:**
   - Open: `http://localhost:5173`
   - Enter your name (optional)
   - Click "Start Chat"
   - Send a message: "Hello Lucas!"

2. **Admin Side:**
   - Open: `http://localhost:5173/admin/login`
   - Username: `lucas`
   - Password: (what you set in backend/.env)
   - Click on the conversation
   - Reply to the user
   - Watch it appear instantly on the user's page!

## Common Issues

**Port already in use:**
```bash
# Find what's using port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process or change PORT in backend/.env
```

**Can't connect to backend:**
- Make sure backend is running
- Check `VITE_API_BASE_URL` in frontend/.env is correct
- Try: `curl http://localhost:4000/api/health`

**Login not working:**
- Double-check password in backend/.env
- Make sure JWT_SECRET is set
- Clear browser localStorage and try again

## What's Next?

See the main [README.md](README.md) for:
- Complete API documentation
- Production deployment to GitHub Pages
- Ubuntu server setup with systemd
- Security best practices
- Advanced configuration

## Project Structure

```
lucasgpt/
├── backend/              # Express API + SQLite
│   ├── server.js
│   ├── routes/
│   └── middleware/
├── frontend/             # React + Vite
│   └── src/
│       ├── pages/
│       └── components/
└── README.md            # Full documentation
```

## Key Features

- Real-time message polling (3 second updates)
- Persistent conversations via localStorage
- JWT-based admin authentication
- Rate limiting (10 messages/minute)
- Dark mode ChatGPT-style UI
- Mobile responsive
- SQLite database (no external services needed)

Enjoy your LucasGPT! 🚀
