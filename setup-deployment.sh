#!/bin/bash

# Diff Pod MVP - Deployment Setup Script
echo "🚀 Setting up deployment for Diff Pod MVP..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first:"
    echo "   macOS: brew install git"
    echo "   Or download from: https://git-scm.com/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the diff-pod project directory"
    exit 1
fi

# Initialize git repository
echo "📁 Initializing git repository..."
git init

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit - Diff Pod MVP with demo data"

echo ""
echo "✅ Git repository initialized successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name it: diff-pod-mvp"
echo "   - Don't initialize with README (you already have one)"
echo "   - Click 'Create repository'"
echo ""
echo "2. Connect to GitHub (replace YOUR_USERNAME with your GitHub username):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/diff-pod-mvp.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Click 'New Project'"
echo "   - Import your GitHub repository"
echo "   - Click 'Deploy'"
echo ""
echo "🎉 Your MVP will be live in minutes!" 