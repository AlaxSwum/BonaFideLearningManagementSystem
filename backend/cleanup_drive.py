from google.oauth2 import service_account
from googleapiclient.discovery import build
import os

def get_drive_service():
    # Path to your credentials file
    credentials_path = 'credentials.json'
    
    # If credentials file exists, use it to create the Drive service
    if os.path.exists(credentials_path):
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/drive']
        )
        return build('drive', 'v3', credentials=credentials)
    else:
        raise FileNotFoundError("credentials.json not found")

def list_and_delete_files():
    try:
        # Get Drive service
        service = get_drive_service()
        
        # List all files in the LMS Course Materials folder
        print("Fetching files...")
        
        # You can modify this query to be more specific
        results = service.files().list(
            q="name contains 'Fundamental' or name contains 'hello' or name contains 'Hi' or name contains 'leonado' or name contains 'vvvv'",
            fields="files(id, name)"
        ).execute()
        
        items = results.get('files', [])
        
        if not items:
            print('No files found.')
            return
        
        print('\nFound the following files:')
        for item in items:
            print(f"{item['name']} ({item['id']})")
        
        # Ask for confirmation before deletion
        confirm = input('\nDo you want to delete these files? (yes/no): ')
        
        if confirm.lower() == 'yes':
            print('\nDeleting files...')
            for item in items:
                try:
                    service.files().delete(fileId=item['id']).execute()
                    print(f"Deleted {item['name']}")
                except Exception as e:
                    print(f"Error deleting {item['name']}: {str(e)}")
            print('\nDeletion complete!')
        else:
            print('Deletion cancelled.')
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    list_and_delete_files() 