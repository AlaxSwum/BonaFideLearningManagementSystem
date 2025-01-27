import os
import tempfile
from io import BytesIO
import vimeo
from django.conf import settings
from googleapiclient.http import MediaIoBaseUpload

def save_image_to_drive(self, image_file):
    """Upload image to Google Drive and store the URL"""
    try:
        print("\n=== DEBUG: save_image_to_drive ===")
        print("Image file type:", type(image_file))
        print("Image file name:", image_file.name)
        print("Image file size:", image_file.size)
        print("================================\n")
        
        # Get or create file manager
        if not hasattr(self, 'file_manager'):
            CourseFileManager.objects.create(course=self)

        service = self._get_drive_service()

        # Delete existing image if it exists
        if self.file_manager.image_file_id:
            try:
                service.files().delete(fileId=self.file_manager.image_file_id).execute()
                self.file_manager.image_file_id = None
                self.image_url = None
                self.file_manager.save()
            except Exception as e:
                print(f"Error deleting existing image: {str(e)}")

        # Create course folder if it doesn't exist
        if not self.file_manager.drive_folder_id:
            # First check if root folder exists
            root_query = "name='LMS Course Materials' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            root_results = service.files().list(q=root_query, spaces='drive', fields='files(id)').execute()
            root_items = root_results.get('files', [])
            
            if root_items:
                root_folder_id = root_items[0]['id']
            else:
                # Create root folder if it doesn't exist
                root_metadata = {
                    'name': 'LMS Course Materials',
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                root_folder = service.files().create(body=root_metadata, fields='id').execute()
                root_folder_id = root_folder['id']

            # Create course folder under root
            folder_metadata = {
                'name': self.title,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [root_folder_id]
            }
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            self.file_manager.drive_folder_id = folder['id']
            self.file_manager.save()

        # Create a copy of the file content
        file_content = b''
        for chunk in image_file.chunks():
            file_content += chunk

        # Reset file pointer
        image_file.seek(0)

        # Prepare metadata
        file_metadata = {
            'name': f'{self.title}_image{os.path.splitext(image_file.name)[1]}',
            'parents': [self.file_manager.drive_folder_id]
        }

        # Create media with the copied content
        media = MediaIoBaseUpload(
            BytesIO(file_content),
            mimetype=image_file.content_type,
            resumable=True
        )

        # Upload file
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webContentLink'
        ).execute()

        # Store file ID
        self.file_manager.image_file_id = file['id']
        
        # Make the file publicly accessible
        service.permissions().create(
            fileId=file['id'],
            body={
                'type': 'anyone',
                'role': 'reader',
                'allowFileDiscovery': True
            },
            fields='id'
        ).execute()

        # Get the webContentLink and modify it for direct access
        web_content_link = file.get('webContentLink', '')
        self.image_url = web_content_link.replace('&export=download', '') + '&export=view'
        
        self.file_manager.save()
        self.save()

        print(f"Image uploaded successfully to Google Drive: {self.image_url}")
        return True

    except Exception as e:
        print(f"Error uploading image to Google Drive: {str(e)}")
        return False

def save_video_to_vimeo(self, video_file):
    """Upload video to Vimeo and store the URL"""
    try:
        # Get or create file manager
        if not hasattr(self, 'file_manager'):
            CourseFileManager.objects.create(course=self)

        # Delete existing video if it exists
        if self.introduction_video_url:
            print(f"Deleting existing video: {self.introduction_video_url}")
            self.delete_from_vimeo(self.introduction_video_url)
            self.introduction_video_url = None
            self.introduction_video_thumbnail = None
            self.save()

        # Initialize Vimeo client
        client = vimeo.VimeoClient(
            token=settings.VIMEO_ACCESS_TOKEN,
            key=settings.VIMEO_CLIENT_ID,
            secret=settings.VIMEO_CLIENT_SECRET
        )

        # Create a temporary file to handle the upload
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            for chunk in video_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            print(f"Starting video upload to Vimeo for course: {self.title}")
            # Upload to Vimeo
            video_uri = client.upload(temp_file_path, data={
                'name': f'{self.title} - Introduction Video',
                'description': f'Introduction video for the course: {self.title}'
            })

            # Get the video data
            response = client.get(video_uri).json()
            print(f"Video upload successful, response: {response}")
            
            # Store video URL and thumbnail
            self.introduction_video_url = response['link']
            if response.get('pictures') and response['pictures'].get('sizes'):
                self.introduction_video_thumbnail = response['pictures']['sizes'][-1]['link']
            
            self.save()
            print(f"Video uploaded successfully to Vimeo: {self.introduction_video_url}")
            return True

        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)

    except Exception as e:
        print(f"Error uploading video to Vimeo: {str(e)}")
        return False 