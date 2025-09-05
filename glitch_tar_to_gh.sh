#!/bin/bash

# This script iterates through all .tgz files in the current directory,
# extracts them, renames the 'app' folder, and cleans up.

for file in *.tgz; do
  # Get the name and strip the date string
  # 'sed' is used to remove everything from "-2025" to the end of the line
  NAME=$(echo "$file" | sed 's/-2025.*\.tgz//')
  
  # Skip if the directory already exists
  if [ -d "$NAME" ]; then
    echo "Directory '$NAME' already exists. Skipping '$file'."
    continue
  fi

  # Create a temporary directory for extraction
  temp_dir=$(mktemp -d)

  # Extract the archive into the temporary directory
  tar -xzf "$file" -C "$temp_dir"

  # Check if the 'app' directory exists inside the extracted folder
  if [ -d "$temp_dir/app" ]; then
    # Remove the .git directory if it exists inside the app folder
    if [ -d "$temp_dir/app/.git" ]; then
      echo "Found .git directory in '$file'. Removing it."
      rm -rf "$temp_dir/app/.git"
    fi

    # Move and rename the 'app' directory to the desired NAME
    mv "$temp_dir/app" "$NAME"
    echo "Extracted '$file' and renamed 'app' to '$NAME'."
  else
    echo "Error: 'app' directory not found in '$file'. Skipping."
  fi

  # Clean up the temporary directory
  rm -r "$temp_dir"
done

