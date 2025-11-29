#!/bin/bash
echo "🔧 Starting build process..."
echo "📦 Installing dependencies..."
npm install
echo "🔄 Running TypeScript compilation..."
npm run build
echo "🗄️ Generating Prisma Client..."
npx prisma generate
echo "✅ Build completed successfully!"
