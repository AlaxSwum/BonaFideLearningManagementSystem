from utils.database import setup_database
from backend.settings import DATABASES

if __name__ == "__main__":
    setup_database(DATABASES['default']) 