from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.security import get_password_hash

class UserDao:
    def get_by_username(self, db: Session, username: str) -> User | None:
        return db.query(User).filter(User.username == username).first()
    
    def get_by_id(self, db: Session, user_id: int) -> User | None:
        return db.query(User).filter(User.id == user_id).first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> list[User]:
        return db.query(User).offset(skip).limit(limit).all()
    
    def create(self, db: Session, username: str, email: str, password: str, role: UserRole) -> User:
        hashed_password = get_password_hash(password)
        db_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role=role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def update(self, db: Session, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if key == "password" and value:
                setattr(user, "hashed_password", get_password_hash(value))
            elif value is not None:
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
    
    def delete(self, db: Session, user: User) -> None:
        db.delete(user)
        db.commit()
