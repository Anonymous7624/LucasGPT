# LucasGPT

A full-stack web application where users can chat with Lucas, who responds manually from an admin dashboard. Think ChatGPT interface, but with real human responses!

## Features

### User Features
- Clean, ChatGPT-inspired dark mode interface
- Start conversations with optional display name
- Real-time message polling (updates every 3 seconds)
- Persistent conversation in localStorage
- Mobile responsive design
- Waiting indicator when Lucas hasn't replied yet

### Admin Features
- Secure JWT-based authentication
- Dashboard showing all conversations
- Real-time updates of new messages
- Reply to users directly
- Mark conversations as open, answered, or closed
- View conversation history and metadata

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Hosted on GitHub Pages

### Backend
- Node.js
- Express
- SQLite database
- JWT authentication
- bcrypt for password security
- CORS protection
- Rate limiting
- Hosted on your Ubuntu PC

## Project Structure

```
lucasgpt/
├── backend/
│   ├── server.js              # Main Express server
│   ├── db.js                  # SQLite database setup
│   ├── package.json
│   ├── .env.example           # Environment variables template
│   ├── lucasgpt.service       # systemd service file
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── routes/
│       ├── auth.js            # Login endpoint
│       └── conversations.js   # Conversation & message endpoints
└── frontend/
    ├── package.json
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind CSS config
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx            # Router setup
        ├── api.js             # API client
        ├── pages/
        │   ├── ChatPage.jsx           # Public chat interface
        │   ├── AdminLogin.jsx         # Admin login page
        │   └── AdminDashboard.jsx     # Admin dashboard
        ├── components/
        │   ├── ChatWindow.jsx         # Main chat component
        │   ├── MessageBubble.jsx      # Individual message
        │   └── ConversationList.jsx   # Conversation sidebar
        └── styles/
            └── index.css              # Global styles
```

## Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your settings:**
   ```env
   PORT=4000
   ADMIN_USERNAME=lucas
   ADMIN_PASSWORD=your_secure_password_here
   JWT_SECRET=your_long_random_secret_here
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   **IMPORTANT:** Change the default password and generate a secure JWT secret!

   Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:4000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:4000
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

### Test the Application

1. Open `http://localhost:5173` in your browser
2. Start a conversation and send a message
3. Open `http://localhost:5173/admin/login` in another tab
4. Login with your admin credentials
5. Reply to the user's message
6. Watch it appear in real-time on the user's page!

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/:id/messages` | Get messages for a conversation |
| POST | `/api/conversations/:id/messages` | Send a user message |

### Admin Endpoints (Require JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/conversations/admin/conversations` | Get all conversations |
| GET | `/api/conversations/admin/conversations/:id` | Get specific conversation |
| POST | `/api/conversations/admin/conversations/:id/reply` | Reply to conversation |
| PATCH | `/api/conversations/admin/conversations/:id/status` | Update conversation status |

## Production Deployment

### Backend Deployment (Ubuntu PC)

1. **Install Node.js on Ubuntu:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd LucasGPT/backend
   npm install
   ```

3. **Create production `.env`:**
   ```env
   PORT=4000
   ADMIN_USERNAME=lucas
   ADMIN_PASSWORD=your_very_secure_password
   JWT_SECRET=your_very_long_random_secret
   FRONTEND_ORIGIN=https://yourusername.github.io
   ```

4. **Test the server:**
   ```bash
   npm start
   ```

5. **Setup systemd service (optional but recommended):**

   Edit `lucasgpt.service` and update:
   - Replace `YOUR_USERNAME` with your Ubuntu username
   - Replace `/path/to/LucasGPT/backend` with actual path

   Install the service:
   ```bash
   sudo cp lucasgpt.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable lucasgpt
   sudo systemctl start lucasgpt
   ```

   Check status:
   ```bash
   sudo systemctl status lucasgpt
   ```

   View logs:
   ```bash
   sudo journalctl -u lucasgpt -f
   ```

6. **Configure firewall (if enabled):**
   ```bash
   sudo ufw allow 4000
   ```

7. **Get your public IP:**
   ```bash
   curl ifconfig.me
   ```

8. **Port forwarding:**
   Configure your router to forward external port 4000 to your Ubuntu PC's local IP on port 4000.

### Frontend Deployment (GitHub Pages)

1. **Update `frontend/.env` for production:**
   ```env
   VITE_API_BASE_URL=http://YOUR_PUBLIC_IP:4000
   ```

   Replace `YOUR_PUBLIC_IP` with your actual public IP address from above.

2. **Update `vite.config.js` base path:**
   
   The base should match your GitHub repository name:
   ```js
   base: '/LucasGPT/',  // Change to your repo name
   ```

3. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

4. **Deploy to GitHub Pages:**

   Option A - Using gh-pages package:
   ```bash
   npm install -g gh-pages
   gh-pages -d dist
   ```

   Option B - Manual deployment:
   ```bash
   # Create gh-pages branch
   git checkout --orphan gh-pages
   
   # Copy dist contents
   cp -r frontend/dist/* .
   
   # Commit and push
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

5. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to Pages section
   - Select `gh-pages` branch
   - Save

6. **Access your site:**
   `https://yourusername.github.io/LucasGPT/`

## Security Notes

- Never commit `.env` files to Git
- Always use strong passwords for admin login
- Generate a secure, random JWT secret
- CORS is configured to only accept requests from your frontend domain
- Rate limiting prevents message spam (10 messages per minute)
- Input validation prevents SQL injection and XSS
- JWT tokens expire after 7 days

## Database Schema

### conversations table
```sql
id           TEXT PRIMARY KEY
display_name TEXT (nullable)
status       TEXT DEFAULT 'open'  -- open, answered, closed
created_at   TEXT
updated_at   TEXT
```

### messages table
```sql
id              TEXT PRIMARY KEY
conversation_id TEXT (foreign key)
sender          TEXT  -- 'user' or 'lucas'
content         TEXT
created_at      TEXT
```

## Troubleshooting

### Backend won't start
- Check if port 4000 is already in use: `lsof -i :4000`
- Verify `.env` file exists and has all required variables
- Check Node.js is installed: `node --version`

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check backend is running: `curl http://localhost:4000/api/health`
- Check CORS settings in backend `.env`

### Admin login not working
- Verify credentials in backend `.env`
- Check JWT_SECRET is set
- Clear browser localStorage and try again

### Messages not updating
- Check browser console for errors
- Verify backend is accessible from frontend
- Check CORS configuration

### GitHub Pages shows 404
- Ensure `base` in `vite.config.js` matches repo name
- Check GitHub Pages is enabled in repository settings
- Verify files were deployed to `gh-pages` branch

## Development Tips

### Watch mode for backend
```bash
cd backend
npm run dev
```

### Clear conversation history (development)
```bash
cd backend
rm database.sqlite
npm start
```

### View database contents
```bash
cd backend
sqlite3 database.sqlite
sqlite> SELECT * FROM conversations;
sqlite> SELECT * FROM messages;
sqlite> .quit
```

### Update admin password
1. Edit `backend/.env`
2. Restart the backend server

## Future Enhancements

- [ ] Email notifications when new messages arrive
- [ ] File upload support
- [ ] Conversation search and filtering
- [ ] Export conversation history
- [ ] Multiple admin users
- [ ] Message editing and deletion
- [ ] Rich text formatting
- [ ] User avatars
- [ ] Custom domain support

## License

MIT License - Feel free to use this project however you like!

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs: `sudo journalctl -u lucasgpt -f`
3. Check browser console for frontend errors
4. Verify environment variables are set correctly

---

Built with ❤️ by Lucas
