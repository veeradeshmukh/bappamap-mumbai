
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str | None = "admin@bappamap.in"
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str


class AuthStatusResponse(BaseModel):
    authenticated: bool
    user: str | None = None
