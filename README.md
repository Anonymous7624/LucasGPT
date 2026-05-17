# LucasGPT

A full-stack web application where users can chat with Lucas, who responds manually from an admin dashboard. Think ChatGPT interface, but with real human responses!

## Features

### User Features
- **User Authentication**: Sign up and log in to save conversations
- **Guest Mode**: Use the app without creating an account (conversations are temporary)
- **File Uploads**: Attach PDFs and images to messages
- **Modern Dark UI**: Clean, ChatGPT-inspired interface
- **Persistent Conversations**: Registered users can return and see previous conversations
- **Real-time Updates**: Message polling updates every 3 seconds
- **Mobile Responsive**: Works on all devices

### Admin Features
- **Secure JWT Authentication**: Admin login with MongoDB-backed accounts
- **Dashboard**: View and manage all conversations
- **File Management**: View, preview, and download user-uploaded files
- **Reply with Files**: Attach PDFs and images to replies
- **Status Management**: Mark conversations as open, answered, or closed
- **Guest Detection**: See which conversations are from guests vs registered users
- **Auto-refresh**: Dashboard updates every 5 seconds

### Guest Session Management
- **Heartbeat System**: Guest sessions send heartbeat every 30 seconds
- **Auto-cleanup**: Guest conversations deleted after 5 minutes of inactivity
- **Session Cleanup**: Guest data deleted when tab closes (using beforeunload)

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
- MongoDB (local instance)
- Mongoose (for models)
- MongoDB GridFS (for file storage)
- JWT authentication
- bcrypt for password hashing
- Multer for file uploads
- CORS protection
- Rate limiting
- Hosted on your Ubuntu PC

## Project Structure

```
lucasgpt/
├── backend/
│   ├── server.js              # Main Express server
│   ├── db.js                  # MongoDB connection & GridFS setup
│   ├── package.json
│   ├── .env.example           # Environment variables template
│   ├── lucasgpt.service       # systemd service file
│   ├── models/
│   │   ├── User.js            # User model (accounts)
│   │   ├── Conversation.js    # Conversation model
│   │   ├── Message.js         # Message model
│   │   └── File.js            # File metadata model
│   ├── middleware/
│   │   └── auth.js            # JWT & role-based auth
│   ├── routes/
│   │   ├── auth.js            # Signup, login, me endpoints
│   │   ├── guest.js           # Guest session management
│   │   ├── conversations.js   # User conversation endpoints
│   │   ├── admin.js           # Admin endpoints
│   │   └── files.js           # File view/download endpoints
│   └── utils/
│       └── cleanup.js         # Guest cleanup job
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
        │   ├── LoginPage.jsx          # User login page
        │   ├── SignupPage.jsx         # User signup page
        │   ├── AdminLogin.jsx         # Admin login page
        │   └── AdminDashboard.jsx     # Admin dashboard
        ├── components/
        │   ├── ChatWindow.jsx         # Main chat component
        │   ├── MessageBubble.jsx      # Individual message with files
        │   └── ConversationList.jsx   # Conversation sidebar
        └── styles/
            └── index.css              # Global styles
```

## Quick Start

### Prerequisites

#### Install MongoDB on Ubuntu

1. **Import MongoDB public GPG key:**
   ```bash
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   ```

2. **Add MongoDB repository:**
   ```bash
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   ```

3. **Install MongoDB:**
   ```bash
   sudo apt update
   sudo apt install -y mongodb-org
   ```

4. **Start MongoDB:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

5. **Verify MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   mongosh --eval "db.version()"
   ```

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
   MONGODB_URI=mongodb://127.0.0.1:27017/lucasgpt
   JWT_SECRET=your_long_random_secret_here
   ADMIN_USERNAME=lucas
   ADMIN_PASSWORD=your_secure_password_here
   FRONTEND_ORIGIN=http://localhost:5173
   MAX_TOTAL_UPLOAD_BYTES=10737418240
   GUEST_TIMEOUT_MINUTES=5
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

   The backend will:
   - Connect to MongoDB
   - Create/update the admin account automatically
   - Start the guest cleanup job
   - Run on `http://localhost:4000`

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
2. You can:
   - Continue as guest (temporary session)
   - Create an account and sign in
   - Upload files (PDFs and images)
3. Open `http://localhost:5173/admin/login` in another tab
4. Login with your admin credentials (from `.env`)
5. Reply to messages and upload files from admin dashboard

## API Endpoints

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user account |
| POST | `/api/auth/login` | User/admin login |
| GET | `/api/auth/me` | Get current user info (protected) |

### Guest Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/guest/start` | Start guest session |
| POST | `/api/guest/:guestSessionId/heartbeat` | Update heartbeat |
| POST | `/api/guest/:guestSessionId/end` | End guest session |

### Conversation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversations` | Create conversation (registered user) |
| GET | `/api/conversations` | Get user's conversations (protected) |
| GET | `/api/conversations/:id/messages` | Get messages (owner/guest/admin) |
| POST | `/api/conversations/:id/messages` | Send message with files |

### File Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/:fileId/view` | View file (inline) |
| GET | `/api/files/:fileId/download` | Download file |

### Admin Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/conversations` | Get all conversations |
| GET | `/api/admin/conversations/:id` | Get conversation details |
| POST | `/api/admin/conversations/:id/reply` | Reply with files |
| PATCH | `/api/admin/conversations/:id/status` | Update status |

## Database Schema

### users collection
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (optional),
  password_hash: String (required),
  role: String (enum: 'user', 'admin'),
  created_at: Date
}
```

### conversations collection
```javascript
{
  _id: ObjectId,
  owner_user_id: ObjectId (ref: User, nullable),
  guest_session_id: String (nullable),
  display_name: String (nullable),
  status: String (enum: 'open', 'answered', 'closed'),
  is_guest: Boolean,
  last_heartbeat_at: Date,
  created_at: Date,
  updated_at: Date
}
```

### messages collection
```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId (ref: Conversation),
  sender: String (enum: 'user', 'lucas'),
  content: String,
  file_ids: [ObjectId] (ref: File),
  created_at: Date
}
```

### files collection
```javascript
{
  _id: ObjectId,
  gridfs_file_id: ObjectId,
  conversation_id: ObjectId (ref: Conversation),
  message_id: ObjectId (ref: Message, nullable),
  original_name: String,
  mime_type: String,
  size_bytes: Number,
  uploaded_by: String (enum: 'user', 'guest', 'admin'),
  created_at: Date
}
```

### GridFS (uploads.files & uploads.chunks)
Files are stored in MongoDB GridFS for efficient streaming and retrieval.

## Production Deployment

### Backend Deployment (Ubuntu PC)

1. **Ensure MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Install Node.js on Ubuntu:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd LucasGPT/backend
   npm install
   ```

4. **Create production `.env`:**
   ```env
   PORT=4000
   MONGODB_URI=mongodb://127.0.0.1:27017/lucasgpt
   JWT_SECRET=your_very_long_random_secret
   ADMIN_USERNAME=lucas
   ADMIN_PASSWORD=your_very_secure_password
   FRONTEND_ORIGIN=https://yourusername.github.io
   MAX_TOTAL_UPLOAD_BYTES=10737418240
   GUEST_TIMEOUT_MINUTES=5
   ```

5. **Test the server:**
   ```bash
   npm start
   ```

6. **Setup systemd service (optional but recommended):**

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

7. **Configure firewall (if enabled):**
   ```bash
   sudo ufw allow 4000
   ```

8. **Get your public IP:**
   ```bash
   curl ifconfig.me
   ```

9. **Port forwarding:**
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

## How It Works

### Admin Account Initialization
On backend startup, the server:
1. Connects to MongoDB
2. Checks if admin account exists (using `ADMIN_USERNAME` from `.env`)
3. If it exists, updates the password hash with current `ADMIN_PASSWORD`
4. If it doesn't exist, creates a new admin account
5. Admin role is set to `admin`, normal users have role `user`

### File Storage System
- Files are uploaded via multipart/form-data
- Files are streamed to MongoDB GridFS (no memory buffering)
- File metadata is stored in `files` collection
- GridFS stores actual file data in `uploads.files` and `uploads.chunks`
- Total storage limit enforced before accepting uploads
- Only browser-viewable PDFs and images allowed
- Files are served with correct Content-Type for viewing in browser

### Guest Cleanup System
- Guest conversations send heartbeat every 30 seconds
- Cleanup job runs every 1 minute
- Finds guest conversations with no heartbeat for > 5 minutes (configurable)
- Deletes conversation, messages, file metadata, and GridFS files
- When guest closes tab, `beforeunload` event triggers cleanup via `sendBeacon`

### File Upload Rules
- Maximum single file size: 50MB
- Total storage limit: 10GB (configurable via `MAX_TOTAL_UPLOAD_BYTES`)
- Allowed types: PDF, JPEG, PNG, WebP, GIF
- Unlimited number of files per message (within storage limit)
- Both MIME type and extension validated
- Filenames sanitized to prevent security issues

## Security Notes

- Never commit `.env` files to Git (already in `.gitignore`)
- Always use strong passwords for admin login
- Generate a secure, random JWT secret (64+ characters)
- CORS configured to only accept requests from your frontend domain
- Rate limiting prevents spam:
  - Auth endpoints: 10 requests per 15 minutes
  - Guest creation: 5 requests per 15 minutes
  - Messages: 10 requests per minute
- Input validation prevents injection attacks
- JWT tokens expire after 30 days
- Passwords hashed with bcrypt (10 rounds)
- File uploads validated by type and extension
- Admin role required for dashboard access
- Guest sessions isolated by session ID

## Troubleshooting

### MongoDB Issues

**MongoDB won't start:**
```bash
sudo systemctl status mongod
sudo journalctl -xe
```

Check logs at `/var/log/mongodb/mongod.log`

**Connection refused:**
- Verify MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB is listening on 127.0.0.1:27017

### Backend Issues

**Backend won't start:**
- Check if port 4000 is already in use: `lsof -i :4000` (Linux) or `netstat -ano | findstr :4000` (Windows)
- Verify `.env` file exists and has all required variables
- Check Node.js is installed: `node --version`
- Check MongoDB connection

**Admin account not working:**
- Backend creates/updates admin on startup
- Check backend logs for admin initialization message
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Try restarting the backend

### Frontend Issues

**Frontend can't connect to backend:**
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check backend is running: `curl http://localhost:4000/api/health`
- Check CORS settings in backend `.env` (`FRONTEND_ORIGIN`)
- Check browser console for errors

**File uploads failing:**
- Check total storage limit
- Verify file type is allowed (PDF, JPEG, PNG, WebP, GIF)
- Check file size is under 50MB
- Check backend logs for errors

**GitHub Pages shows 404:**
- Ensure `base` in `vite.config.js` matches repo name
- Check GitHub Pages is enabled in repository settings
- Verify files were deployed to `gh-pages` branch
- Wait a few minutes after deployment

### Guest Cleanup Issues

**Guest conversations not deleting:**
- Check backend logs for cleanup job messages
- Verify `GUEST_TIMEOUT_MINUTES` in `.env`
- Check `last_heartbeat_at` field in database
- Cleanup job runs every 1 minute

## Development Tips

### View MongoDB data
```bash
mongosh
use lucasgpt
db.users.find().pretty()
db.conversations.find().pretty()
db.messages.find().pretty()
db.files.find().pretty()
```

### Clear all data (development)
```bash
mongosh
use lucasgpt
db.dropDatabase()
```

### Watch backend logs
```bash
cd backend
npm start
```

### Update admin password
1. Edit `backend/.env`
2. Change `ADMIN_PASSWORD`
3. Restart backend (admin account will be updated automatically)

### Check storage usage
```bash
mongosh
use lucasgpt
db.stats()
```

## Future Enhancements

- [ ] Email notifications when new messages arrive
- [ ] Rich text formatting (markdown support)
- [ ] Conversation search and filtering
- [ ] Export conversation history
- [ ] Multiple admin users
- [ ] Message editing and deletion
- [ ] User avatars
- [ ] Custom domain support
- [ ] Read receipts
- [ ] Conversation archiving

## License

MIT License - Feel free to use this project however you like!

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs: `sudo journalctl -u lucasgpt -f`
3. Check browser console for frontend errors
4. Verify environment variables are set correctly
5. Ensure MongoDB is running and accessible

---

Built with ❤️ by Lucas

