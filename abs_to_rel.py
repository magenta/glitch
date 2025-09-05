import os
import re

def fix_html_paths(directory):
    """
    Recursively finds all .html files in a directory and removes the leading
    slash from href="/..." and src="/..." attributes.

    Args:
        directory (str): The root directory to start the search.
    """
    # Regex to find href="/..." or src="/..." with the leading slash
    # The (href|src) part captures 'href' or 'src' and a group.
    # The second group captures the path.
    # We use a non-greedy match (.*?) to not capture too much.
    path_regex = re.compile(r'(href|src)="(/.+?)"')

    print(f"Starting search in directory: {directory}")
    print("-" * 30)

    # Walk through all directories and files recursively
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            # Check if the file is an HTML file
            if filename.endswith('.html'):
                filepath = os.path.join(dirpath, filename)
                print(f"Processing file: {filepath}")

                try:
                    # Read the entire file content
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Find all matches and replace them
                    original_content = content
                    modified_content = path_regex.sub(lambda m: f'{m.group(1)}="{m.group(2)[1:]}"', content)

                    # Only write back if a change was made
                    if original_content != modified_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(modified_content)
                        print("  -> Paths updated.")
                    else:
                        print("  -> No changes needed.")

                except Exception as e:
                    print(f"  -> Error processing {filepath}: {e}")

    print("-" * 30)
    print("Script finished.")

if __name__ == "__main__":
    # Get the directory from the user. You can change this to a specific path.
    # The script will process the current directory if no path is given.
    user_directory = input("Enter the directory to process (leave blank for current directory): ")
    if not user_directory:
        user_directory = os.getcwd()

    if os.path.isdir(user_directory):
        fix_html_paths(user_directory)
    else:
        print(f"Error: The directory '{user_directory}' does not exist.")

