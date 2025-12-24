#!/bin/bash
# Script to convert all @prisma/client imports to lib/types

echo "Converting Prisma imports to lib/types..."

# Find all files with @prisma/client imports
files=$(grep -r "from '@prisma/client'" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v .next | cut -d: -f1 | sort -u)

count=0
for file in $files; do
  # Skip if file doesn't exist
  if [ ! -f "$file" ]; then
    continue
  fi

  # Calculate relative path to lib/types
  dir=$(dirname "$file")
  depth=$(echo "$dir" | tr '/' '\n' | wc -l)
  relpath=$(printf '../%.0s' $(seq 1 $depth))lib/types

  # Replace @prisma/client imports with lib/types
  sed -i "s|from '@prisma/client'|from '${relpath}'|g" "$file"
  sed -i 's|import { PrismaClient }|// PrismaClient removed|g' "$file"

  count=$((count + 1))
  if [ $((count % 50)) -eq 0 ]; then
    echo "Converted $count files..."
  fi
done

echo "Converted $count files total!"
