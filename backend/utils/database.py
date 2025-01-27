"""
Database connection utilities for MySQL using PyMySQL.
This module provides a clean interface for database operations.
"""

import pymysql
from pymysql.cursors import DictCursor
from typing import Optional, Dict, Any, List
import logging
from .db_connection import get_db_connection

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Manages MySQL database connections with proper resource handling."""
    
    def __init__(
        self,
        host: str,
        user: str,
        password: str,
        database: Optional[str] = None,
        port: int = 3306
    ):
        """
        Initialize database connection parameters.
        
        Args:
            host: Database server hostname
            user: Database username
            password: Database password
            database: Name of the database to connect to
            port: Database port number (default: 3306)
        """
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port
        self.connection = None
        self.cursor = None

    def connect(self) -> None:
        """
        Establish connection to the MySQL database.
        
        Raises:
            pymysql.Error: If connection fails
        """
        try:
            self.connection = pymysql.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port,
                charset='utf8mb4',
                cursorclass=DictCursor,
                autocommit=True
            )
            self.cursor = self.connection.cursor()
            logger.info("Database connection established successfully")
        except pymysql.Error as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def disconnect(self) -> None:
        """Safely close database connection and cursor."""
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
            logger.info("Database connection closed successfully")
        except pymysql.Error as e:
            logger.error(f"Error closing database connection: {e}")

    def execute_query(self, query: str, params: Optional[tuple] = None) -> Optional[Dict]:
        """
        Execute a SQL query and return results.
        
        Args:
            query: SQL query string
            params: Query parameters (optional)
            
        Returns:
            Query results as dictionary or None if no results
            
        Raises:
            pymysql.Error: If query execution fails
        """
        try:
            self.cursor.execute(query, params or ())
            return self.cursor.fetchall()
        except pymysql.Error as e:
            logger.error(f"Query execution failed: {e}")
            self.connection.rollback()
            raise

    def create_database(self, db_name: str) -> None:
        """
        Create a new database.
        
        Args:
            db_name: Name of database to create
        """
        try:
            self.cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            logger.info(f"Database {db_name} created successfully")
        except pymysql.Error as e:
            logger.error(f"Failed to create database {db_name}: {e}")
            raise

    def drop_database(self, db_name: str) -> None:
        """
        Drop an existing database.
        
        Args:
            db_name: Name of database to drop
        """
        try:
            self.cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
            logger.info(f"Database {db_name} dropped successfully")
        except pymysql.Error as e:
            logger.error(f"Failed to drop database {db_name}: {e}")
            raise

    def __enter__(self):
        """Context manager entry point."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit point."""
        self.disconnect()

def setup_database(config: Dict[str, Any]) -> None:
    """
    Set up the database with proper error handling.
    
    Args:
        config: Database configuration dictionary
    """
    try:
        with DatabaseConnection(
            host=config['HOST'],
            user=config['USER'],
            password=config['PASSWORD'],
            port=int(config['PORT'])
        ) as db:
            db.drop_database('bonafide_db')
            db.create_database('bonafide_db')
            logger.info("Database setup completed successfully")
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise

class CourseDB:
    @staticmethod
    async def create_course(course_data: dict) -> Optional[dict]:
        conn = await get_db_connection()
        try:
            cursor = conn.cursor()
            query = """
                INSERT INTO courses (
                    instructor_id, title, description, level_id, 
                    category_id, subcategory_id, course_image, 
                    promotional_video, status
                ) VALUES (
                    %(instructor_id)s, %(title)s, %(description)s, 
                    %(level_id)s, %(category_id)s, %(subcategory_id)s, 
                    %(course_image)s, %(promotional_video)s, %(status)s
                )
            """
            cursor.execute(query, course_data)
            course_id = cursor.lastrowid
            conn.commit()
            
            # Fetch the created course
            return await CourseDB.get_course_by_id(course_id)
        finally:
            conn.close()

    @staticmethod
    async def get_course_by_id(course_id: int) -> Optional[dict]:
        conn = await get_db_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT c.*, cl.name as level_name, 
                       cat.name as category_name, 
                       sub.name as subcategory_name
                FROM courses c
                LEFT JOIN course_levels cl ON c.level_id = cl.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN subcategories sub ON c.subcategory_id = sub.id
                WHERE c.id = %s
            """
            cursor.execute(query, (course_id,))
            return cursor.fetchone()
        finally:
            conn.close()

    @staticmethod
    async def get_courses_by_instructor(instructor_id: int) -> List[dict]:
        conn = await get_db_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT c.*, cl.name as level_name, 
                       cat.name as category_name, 
                       sub.name as subcategory_name
                FROM courses c
                LEFT JOIN course_levels cl ON c.level_id = cl.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN subcategories sub ON c.subcategory_id = sub.id
                WHERE c.instructor_id = %s
                ORDER BY c.created_at DESC
            """
            cursor.execute(query, (instructor_id,))
            return cursor.fetchall()
        finally:
            conn.close()

    @staticmethod
    async def update_course(course_id: int, course_data: dict) -> Optional[dict]:
        conn = await get_db_connection()
        try:
            cursor = conn.cursor()
            query = """
                UPDATE courses 
                SET title = %(title)s,
                    description = %(description)s,
                    level_id = %(level_id)s,
                    category_id = %(category_id)s,
                    subcategory_id = %(subcategory_id)s,
                    course_image = %(course_image)s,
                    promotional_video = %(promotional_video)s,
                    status = %(status)s
                WHERE id = %(id)s
            """
            cursor.execute(query, {**course_data, 'id': course_id})
            conn.commit()
            
            return await CourseDB.get_course_by_id(course_id)
        finally:
            conn.close()

    @staticmethod
    async def delete_course(course_id: int) -> bool:
        conn = await get_db_connection()
        try:
            cursor = conn.cursor()
            query = "DELETE FROM courses WHERE id = %s"
            cursor.execute(query, (course_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

# Example usage:
if __name__ == "__main__":
    db_config = {
        'HOST': 'bonafidelearningplatform.cxw46i8kyevs.eu-north-1.rds.amazonaws.com',
        'USER': 'admin',
        'PASSWORD': 'BonaFide1122',
        'PORT': '3306'
    }
    
    setup_database(db_config) 