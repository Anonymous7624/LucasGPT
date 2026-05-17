#!/bin/bash

echo "================================================"
echo "  LucasGPT Setup Script"
echo "================================================"
echo ""

# Backend Setup
echo "Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    
    # Generate JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/change_this_to_a_long_random_secret/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/change_this_to_a_long_random_secret/$JWT_SECRET/" .env
    fi
    
    echo "✓ Backend .env created with secure JWT secret"
    echo "⚠️  IMPORTANT: Edit backend/.env and change ADMIN_PASSWORD!"
else
    echo "✓ Backend .env already exists"
fi

echo "Installing backend dependencies..."
npm install
echo "✓ Backend dependencies installed"

cd ..

# Frontend Setup
echo ""
echo "Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
    echo "✓ Frontend .env created"
else
    echo "✓ Frontend .env already exists"
fi

echo "Installing frontend dependencies..."
npm install
echo "✓ Frontend dependencies installed"

cd ..

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit backend/.env and change ADMIN_PASSWORD"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "5. Login to admin at http://localhost:5173/admin/login"
echo ""
echo "================================================"
