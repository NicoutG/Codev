from sqlalchemy.orm import Session
from models import User
from auth import get_password_hash
from typing import Optional

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, username: str, email: str, password: str, role: str) -> User:
        """Create a new user"""
        if self.get_user_by_username(username):
            raise ValueError("Username already exists")
        if self.get_user_by_email(email):
            raise ValueError("Email already exists")
        
        user = User(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            role=role
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_all_users(self):
        """Get all users"""
        return self.db.query(User).all()
    
    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """Update user"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if key == "password":
                user.password_hash = get_password_hash(value)
            elif hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
