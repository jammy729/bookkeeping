#!/bin/bash

# Start both backend and frontend in parallel

echo "Starting bookkeeping application..."
echo ""

# Start backend in background
cd backend
pnpm run start:dev &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to initialize
sleep 3

# Start frontend in background
cd ../frontend
pnpm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
echo ""
echo "Application is running!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID; echo ''; echo 'Stopping services...'; exit" INT TERM
wait