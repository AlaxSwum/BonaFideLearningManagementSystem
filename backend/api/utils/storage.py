from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import os
from django.conf import settings
from datetime import datetime
import uuid

def get_google_drive_service():
    # Use service account authentication instead of user authentication
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    credentials = service_account.Credentials.from_service_account_file(
        settings.GOOGLE_DRIVE_SETTINGS['CREDENTIALS_FILE'],
        scopes=SCOPES
    )
    
    from googleapiclient.discovery import build
    service = build('drive', 'v3', credentials=credentials)
    return service

def upload_file_to_drive(file_path, file_name):
    try:
        service = get_google_drive_service()
        file_metadata = {'name': file_name}
        
        from googleapiclient.http import MediaFileUpload
        media = MediaFileUpload(file_path, resumable=True)
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        
        return file.get('id')
    except Exception as e:
        print(f"Error uploading to Google Drive: {str(e)}")
        raise

def upload_to_drive(file, folder="1UuAsAvzkq6ku8Dzf6VKN01eulOuMaTW_"):
    """
    Upload a file to Google Drive
    
    Args:
        file: The file object to upload
        folder: The folder ID in Google Drive
        
    Returns:
        str: The thumbnail URL of the uploaded file, or None if upload fails
    """
    try:
        service = get_google_drive_service()
        
        # Print service account info for debugging
        about = service.about().get(fields="user").execute()
        print(f"Using service account: {about['user']['emailAddress']}")
        
        # First verify the folder exists and is accessible
        try:
            folder_info = service.files().get(fileId=folder).execute()
            print(f"Successfully accessed folder: {folder_info['name']}")
        except Exception as e:
            print(f"Error verifying folder: {str(e)}")
            print("Please ensure the folder is shared with the service account email above")
            # Try creating the file without a parent folder
            file_metadata = {
                'name': file.name
            }
        else:
            # Folder exists, include it as parent
            file_metadata = {
                'name': file.name,
                'parents': [folder]
            }

        # Create media object from file
        media = MediaIoBaseUpload(
            file,
            mimetype=file.content_type,
            resumable=True
        )

        # Upload file to Drive
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

        # Update file permissions to make it publicly viewable
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        service.permissions().create(
            fileId=file['id'],
            body=permission
        ).execute()

        # Return thumbnail URL
        return f"https://drive.google.com/thumbnail?id={file['id']}&sz=w500"

    except Exception as e:
        print(f"Error uploading to Google Drive: {str(e)}")
        return None

def get_or_create_folder(service, folder_name):
    """Get or create a folder in Google Drive"""
    # Check if folder exists
    response = service.files().list(
        q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces='drive'
    ).execute()

    if response.get('files'):
        # Return existing folder ID
        return response['files'][0]['id']
    else:
        # Create new folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(
            body=folder_metadata,
            fields='id'
        ).execute()
        return folder['id']

def verify_folder_access(folder_id="1UuAsAvzkq6ku8Dzf6VKN01eulOuMaTW_"):
    """Verify folder access and list contents"""
    try:
        service = get_google_drive_service()
        
        # Get service account email
        about = service.about().get(fields="user").execute()
        print(f"\nService Account: {about['user']['emailAddress']}")
        
        try:
            # Try to get folder metadata
            folder = service.files().get(
                fileId=folder_id,
                fields="id, name, owners, permissions"
            ).execute()
            
            print(f"\nFolder Details:")
            print(f"Name: {folder.get('name')}")
            print(f"ID: {folder.get('id')}")
            print("\nPermissions:")
            for perm in folder.get('permissions', []):
                print(f"- {perm.get('emailAddress', 'N/A')}: {perm.get('role')}")
                
            # List files in folder
            results = service.files().list(
                q=f"'{folder_id}' in parents",
                fields="files(id, name)"
            ).execute()
            
            files = results.get('files', [])
            if files:
                print("\nFiles in folder:")
                for file in files:
                    print(f"- {file['name']}")
            else:
                print("\nNo files in folder")
                
        except Exception as e:
            print(f"\nError accessing folder: {str(e)}")
            print("Please ensure the folder is shared with the service account")
            
    except Exception as e:
        print(f"\nError connecting to Drive: {str(e)}")

# Add this to test the folder access
if __name__ == "__main__":
    verify_folder_access() 