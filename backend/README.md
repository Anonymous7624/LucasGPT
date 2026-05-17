# LucasGPT Backend

Express + SQLite backend API for LucasGPT.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

Server runs on `http://localhost:4000`

## Environment Variables

Create a `.env` file:

```env
PORT=4000
ADMIN_USERNAME=lucas
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_long_random_secret
FRONTEND_ORIGIN=http://localhost:5173
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## API Endpoints

See main README for complete API documentation.

## Production Deployment

For Ubuntu deployment with systemd:

1. Edit `lucasgpt.service` with your paths and username
2. Install service:
   ```bash
   sudo cp lucasgpt.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable lucasgpt
   sudo systemctl start lucasgpt
   ```

3. Check status:
   ```bash
   sudo systemctl status lucasgpt
   sudo journalctl -u lucasgpt -f
   ```

See main README for complete deployment instructions.
