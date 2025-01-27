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

def list_folder_contents(folder_id="1UuAsAvzkq6ku8Dzf6VKN01eulOuMaTW_"):
    try:
        service = get_drive_service()
        
        # Get folder details
        folder = service.files().get(fileId=folder_id, fields="name, webViewLink").execute()
        print(f"\nFolder Name: {folder.get('name')}")
        print(f"Folder Link: {folder.get('webViewLink')}")
        
        # List all files in the folder
        results = service.files().list(
            q=f"'{folder_id}' in parents",
            fields="files(id, name, mimeType, webViewLink, createdTime)",
            orderBy="createdTime desc"
        ).execute()
        
        files = results.get('files', [])
        if files:
            print("\nFiles in folder:")
            for file in files:
                print(f"\nName: {file['name']}")
                print(f"Type: {file['mimeType']}")
                print(f"Link: {file['webViewLink']}")
                print(f"Created: {file['createdTime']}")
        else:
            print("\nNo files found in folder")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    list_folder_contents() 