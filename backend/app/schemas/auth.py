from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str  # mobile or email
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    role: str
    department_id: str | None = None
    registration_status: str = "APPROVED"


class UserResponse(BaseModel):
    id: str
    name: str
    mobile: str
    email: str
    role: str
    department_id: str | None = None
    registration_status: str = "APPROVED"


import re

from pydantic import BaseModel, field_validator


class RegisterRequest(BaseModel):
    firebase_token: str | None = None
    name: str
    mobile: str
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters in length.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one alphabetical letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one numeric digit.")
        return v


class RegistrationResponse(BaseModel):
    id: str
    name: str
    mobile: str
    email: str
    role: str
    registration_status: str
    message: str


class PendingRegistrationItem(BaseModel):
    id: str
    name: str
    mobile: str
    email: str
    role: str
    registration_status: str
    created_at: datetime


class RejectRegistrationRequest(BaseModel):
    reason: str


class BulkApproveRequest(BaseModel):
    user_ids: list[str]


class BulkApproveResponse(BaseModel):
    status: str
    approved_count: int
    approved_ids: list[str]
    failed_ids: list[str]
