from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    level_info: str  # e.g., 'Beginner', 'Intermediate', 'Expert'
    category_id: int
    subcategory_id: Optional[int] = None
    course_image: Optional[str] = None
    promotional_video: Optional[str] = None
    status: str = 'draft'
    introduction_video: Optional[str] = None

class CourseCreate(CourseBase):
    instructor_id: int

class CourseUpdate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    instructor_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Additional models for related entities
class CourseLevel(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

class Category(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

class Subcategory(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str] = None 