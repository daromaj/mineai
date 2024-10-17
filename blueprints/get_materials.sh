#!/bin/bash

output_file="unique_materials.json"

# Initialize or clear the output file
echo "[]" > "$output_file"

# Create a temporary file for unique entries
temp_file=$(mktemp)

# Counter to track processed files
file_counter=0

# Iterate over each JSON file in the directory
for file in ./blueprints/*.json; do
    # Extract unique name and mat_id fields from nested structures
    jq -c '.. | select(type == "object" and has("name") and has("mat_id")) | {name: .name, mat_id: .mat_id}' "$file" | sort -u >> "$temp_file"

    # Increment the counter
    ((file_counter++))

    # Every 20 files, recalculate unique entries and reset the temp file
    if ((file_counter % 20 == 0)); then
        echo "$file_counter"
        sort -u "$output_file" "$temp_file" > "merged_output.json"
        mv "merged_output.json" "$output_file"
        > "$temp_file"      
        echo "Merging complete for $file_counter"  
    fi
done

# Process any remaining entries in the temp file
if [ -s "$temp_file" ]; then
    sort -u "$output_file" "$temp_file" > "final_output.json"
    mv "final_output.json" "$output_file"
fi

# Clean up temporary file
rm "$temp_file"

echo "Unique entries saved to $output_file"
