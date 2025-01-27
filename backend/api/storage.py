from django.core.files.storage import Storage
from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
import mimetypes

class CustomStorage(Storage):
    def __init__(self):
        credentials = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_DRIVE_SETTINGS['CREDENTIALS_FILE']
        )
        self.service = build('drive', 'v3', credentials=credentials)
        self.folder_id = settings.GOOGLE_DRIVE_SETTINGS['PARENT_FOLDER_ID']

    def _save(self, name, content):
        # Get the correct mime type
        content_type, _ = mimetypes.guess_type(name)
        if content_type is None:
            content_type = 'application/octet-stream'

        file_metadata = {
            'name': name,
            'parents': [self.folder_id]
        }

        # Ensure content is at the start
        if hasattr(content, 'seek'):
            content.seek(0)

        # Create media
        media = MediaIoBaseUpload(
            content,
            mimetype=content_type,
            resumable=True,
            chunksize=1024*1024
        )

        try:
            # Upload to Drive
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,webViewLink',
                supportsAllDrives=True
            ).execute()

            print(f"Successfully uploaded to Drive: {file.get('webViewLink')}")
            return file.get('webViewLink')
        except Exception as e:
            print(f"Error uploading to Drive: {str(e)}")
            raise

    def exists(self, name):
        return False  # Always create new file

    def url(self, name):
        if name.startswith('http'):
            return name
        return f"https://drive.google.com/file/d/{name}/view"

    def get_available_name(self, name, max_length=None):
        return name

    def get_valid_name(self, name):
        return name

    def path(self, name):
        return name

    def delete(self, name):
        pass  # Implement if needed

    def size(self, name):
        return 0  # Implement if needed 