#!/bin/bash

# Update NEXTAUTH_URL for production
echo "Updating NEXTAUTH_URL for production environment..."
echo "https://success.com" | vercel env add NEXTAUTH_URL production --yes

# Update NEXTAUTH_URL for preview
echo "Updating NEXTAUTH_URL for preview environment..."
echo "https://success-nextjs.vercel.app" | vercel env add NEXTAUTH_URL preview --yes

echo "Done! Environment variables updated."
echo "Triggering a new deployment..."
