from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from .models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: UserRole = UserRole.MEMBER


class UserRead(UserBase):
    id: int
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    role: UserRole


class StandupBase(BaseModel):
    date: date
    yesterday: str
    today: str
    blockers: Optional[str] = None


class StandupCreate(StandupBase):
    team_id: int


class StandupUpdate(BaseModel):
    yesterday: Optional[str] = None
    today: Optional[str] = None
    blockers: Optional[str] = None


class StandupRead(StandupBase):
    id: int
    user_id: int
    team_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StandupSummary(BaseModel):
    date: date
    team_id: int
    total_entries: int
