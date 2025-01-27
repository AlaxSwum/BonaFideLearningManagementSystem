import vimeo
from django.conf import settings
from functools import lru_cache
@lru_cache(maxsize=1)
def get_vimeo_client():
    return vimeo.VimeoClient(
        token=settings.VIMEO_ACCESS_TOKEN,
        key=settings.VIMEO_CLIENT_ID,
        secret=settings.VIMEO_CLIENT_SECRET
    )