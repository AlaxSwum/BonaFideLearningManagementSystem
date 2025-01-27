# Google Drive Settings
GOOGLE_DRIVE_SETTINGS = {
    'CREDENTIALS_FILE': os.path.join(BASE_DIR, 'credentials.json'),
    'SCOPES': ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
    'FOLDER_STRUCTURE': {
        'ROOT': None  # Will create a root folder if not exists
    }
}

# Vimeo Settings
VIMEO = {
    'CLIENT_ID': '625934c8923c2a099f075dd5dfd8444fef818dc2',
    'ACCESS_TOKEN': '4e0f3d7923af69bd4d05b8c262bf206b',
    'CLIENT_SECRET': 'qsebRjmm/OXASsPVANW+pHEX5PXt+l/aYLYFe4+mg8JMH8xxqQVEMv0oH8ERnp04LvzAav+EFFRaf0X+8b6dcbHGLWSBws0jg7VBTAfbd9Jo/jfHRZZpLxKxgKWjHWx5',
    'SCOPES': 'private purchased create edit delete interact upload promo_codes stats video_files public'
}

VIMEO_CLIENT_ID = VIMEO['CLIENT_ID']
VIMEO_ACCESS_TOKEN = VIMEO['ACCESS_TOKEN']
VIMEO_CLIENT_SECRET = VIMEO['CLIENT_SECRET'] 