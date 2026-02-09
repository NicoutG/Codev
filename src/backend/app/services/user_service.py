from sqlalchemy.orm import Session
from app.dao.user_dao import UserDao
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password
from fastapi import HTTPException, status

class UserService:
    def __init__(self):
        self.dao = UserDao()
    
    def authenticate_user(self, db: Session, username: str, password: str) -> User | None:
        user = self.dao.get_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
    
    def get_user(self, db: Session, user_id: int) -> User:
        user = self.dao.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        return user
    
    def get_all_users(self, db: Session, skip: int = 0, limit: int = 100) -> list[User]:
        return self.dao.get_all(db, skip, limit)
    
    def create_user(self, db: Session, user_data: UserCreate) -> User:
        # Vérifier si l'utilisateur existe déjà
        existing_user = self.dao.get_by_username(db, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce nom d'utilisateur est déjà utilisé"
            )
        
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé"
            )
        
        return self.dao.create(
            db,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            role=user_data.role
        )
    
    def update_user(self, db: Session, user_id: int, user_data: UserUpdate, current_user: User) -> User:
        user = self.get_user(db, user_id)
        
        # Vérifier les conflits de username/email
        if user_data.username and user_data.username != user.username:
            existing = self.dao.get_by_username(db, user_data.username)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ce nom d'utilisateur est déjà utilisé"
                )
        
        if user_data.email and user_data.email != user.email:
            existing = db.query(User).filter(User.email == user_data.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cet email est déjà utilisé"
                )
        
        update_data = user_data.model_dump(exclude_unset=True)
        return self.dao.update(db, user, **update_data)
    
    def delete_user(self, db: Session, user_id: int, current_user: User) -> None:
        user = self.get_user(db, user_id)
        
        # Empêcher la suppression de soi-même
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas supprimer votre propre compte"
            )
        
        self.dao.delete(db, user)
    
    def change_password(self, db: Session, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mot de passe actuel incorrect"
            )
        
        self.dao.update(db, user, password=new_password)
