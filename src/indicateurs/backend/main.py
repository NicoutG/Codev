from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
from datetime import timedelta

from database import get_db, init_db
from config import CORS_ORIGINS, ACCESS_TOKEN_EXPIRE_MINUTES, UPLOAD_DIR
from auth import (
    authenticate_user, create_access_token, get_current_user, 
    require_role, User
)
from services.metadata_service import MetadataService
from services.user_service import UserService
from services.indicator_service import IndicatorService
from services.import_service import ImportService
from services.export_service import ExportService
from services.calculation_service import CalculationService
from services.formulaire_service import FormulaireService
from data.predefined_indicators import PREDEFINED_INDICATORS

app = FastAPI(title="Polytech Stats API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    # Create predefined indicators if they don't exist
    db = next(get_db())
    try:
        from services.user_service import UserService
        user_service = UserService(db)
        
        # Ensure admin user exists
        admin = user_service.get_user_by_username("admin")
        if not admin:
            admin = user_service.create_user(
                username="admin",
                email="admin@polytech.fr",
                password="admin123",
                role="modificateur"
            )
        
        indicator_service = IndicatorService(db)
        existing = indicator_service.get_predefined_indicators()
        if len(existing) == 0:
            # Create predefined indicators
            for indicator_data in PREDEFINED_INDICATORS:
                indicator_service.create_indicator(
                    title=indicator_data["title"],
                    description=indicator_data["description"],
                    spec_json=indicator_data["spec_json"],
                    created_by_id=admin.id,
                    is_predefined=True
                )
    except Exception as e:
        # Log error but don't crash the app
        print(f"Warning: Could not initialize predefined indicators: {e}")
    finally:
        db.close()

# ==================== AUTHENTICATION ====================

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

@app.post("/api/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ==================== USERS ====================

@app.post("/api/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Create a new user (modificateur only)"""
    user_service = UserService(db)
    try:
        user = user_service.create_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            role=user_data.role
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """List all users"""
    user_service = UserService(db)
    return user_service.get_all_users()

# ==================== METADATA ====================

class TablesRequest(BaseModel):
    tables: List[str]

@app.get("/api/metadata/tables", response_model=List[str])
async def get_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available tables"""
    service = MetadataService(db)
    return service.list_tables()

@app.get("/api/metadata/tables/{table}/columns", response_model=List[str])
async def get_columns(
    table: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get columns for a table"""
    service = MetadataService(db)
    return service.list_columns(table)

@app.post("/api/metadata/columns", response_model=List[str])
async def get_columns_for_tables(
    request: TablesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get columns for multiple tables"""
    service = MetadataService(db)
    return service.list_columns_for_tables(request.tables)

# ==================== INDICATORS ====================

class IndicatorCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    spec_json: Dict[str, Any]

class IndicatorUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    spec_json: Optional[Dict[str, Any]] = None

class IndicatorResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    spec_json: Dict[str, Any]
    is_predefined: bool
    created_by_id: int
    created_at: str

class CalculateRequest(BaseModel):
    periode: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

@app.get("/api/indicators", response_model=List[IndicatorResponse])
async def list_indicators(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all indicators"""
    service = IndicatorService(db)
    indicators = service.list_indicators()
    return indicators

@app.get("/api/indicators/{indicator_id}", response_model=IndicatorResponse)
async def get_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get indicator by ID"""
    service = IndicatorService(db)
    indicator = service.get_indicator(indicator_id)
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    return indicator

@app.post("/api/indicators", response_model=IndicatorResponse)
async def create_indicator(
    indicator_data: IndicatorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Create a new indicator"""
    service = IndicatorService(db)
    indicator = service.create_indicator(
        title=indicator_data.title,
        description=indicator_data.description,
        spec_json=indicator_data.spec_json,
        created_by_id=current_user.id
    )
    return indicator

@app.put("/api/indicators/{indicator_id}", response_model=IndicatorResponse)
async def update_indicator(
    indicator_id: int,
    indicator_data: IndicatorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Update an indicator"""
    service = IndicatorService(db)
    update_data = indicator_data.dict(exclude_unset=True)
    indicator = service.update_indicator(indicator_id, **update_data)
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    return indicator

@app.delete("/api/indicators/{indicator_id}")
async def delete_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Delete an indicator"""
    service = IndicatorService(db)
    success = service.delete_indicator(indicator_id)
    if not success:
        raise HTTPException(status_code=404, detail="Indicator not found")
    return {"message": "Indicator deleted"}

@app.post("/api/indicators/{indicator_id}/calculate")
async def calculate_indicator(
    indicator_id: int,
    request: CalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate an indicator"""
    service = IndicatorService(db)
    calc_service = CalculationService(db)
    
    indicator = service.get_indicator(indicator_id)
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    try:
        results = calc_service.calculate_indicator(
            indicator.spec_json,
            periode=request.periode,
            filters=request.filters
        )
        
        # Save result
        from dao.indicator_dao import IndicatorDao
        dao = IndicatorDao(db)
        dao.save_result(
            indicator_id=indicator_id,
            periode=request.periode or "custom",
            valeurs_json={"results": results},
            filters_json=request.filters
        )
        
        return {"results": results, "indicator_id": indicator_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/indicators/{indicator_id}/results")
async def get_indicator_results(
    indicator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get calculation results for an indicator"""
    service = IndicatorService(db)
    results = service.get_results(indicator_id)
    return results

@app.get("/api/indicators/{indicator_id}/sql-preview")
async def get_sql_preview(
    indicator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SQL preview for an indicator"""
    service = IndicatorService(db)
    try:
        sql = service.generate_sql(indicator_id)
        return {"sql": sql}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/indicators/templates/predefined")
async def get_predefined_indicators(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all predefined indicators"""
    service = IndicatorService(db)
    return service.get_predefined_indicators()

# ==================== IMPORT ====================

@app.post("/api/import/excel")
async def import_excel(
    file: UploadFile = File(...),
    type_donnee: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Import Excel file"""
    import_service = ImportService(db)
    
    # Save uploaded file
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Parse Excel to get metadata
        metadata = import_service.parse_excel(str(file_path))
        
        # Detect data type if not provided
        if not type_donnee:
            type_donnee = import_service.detect_data_type(file.filename, metadata["columns"])
        
        # Import to database
        result = import_service.import_to_database(
            str(file_path),
            type_donnee,
            current_user.id
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Clean up uploaded file
        if file_path.exists():
            os.remove(file_path)

@app.post("/api/import/validate")
async def validate_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Validate Excel file structure"""
    import_service = ImportService(db)
    
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        metadata = import_service.parse_excel(str(file_path))
        type_donnee = import_service.detect_data_type(file.filename, metadata["columns"])
        
        return {
            "valid": True,
            "metadata": metadata,
            "detected_type": type_donnee
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }
    finally:
        if file_path.exists():
            os.remove(file_path)

@app.get("/api/import/history")
async def get_import_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get import history"""
    import_service = ImportService(db)
    imports = import_service.get_import_history(current_user.id)
    return imports

# ==================== EXPORT ====================

@app.post("/api/export/excel")
async def export_indicator_excel(
    indicator_id: int = Query(..., description="Indicator ID"),
    template_type: str = Query("default", description="Template type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export indicator results to Excel"""
    indicator_service = IndicatorService(db)
    export_service = ExportService(db)
    calc_service = CalculationService(db)
    
    indicator = indicator_service.get_indicator(indicator_id)
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    # Calculate results
    results = calc_service.calculate_indicator(indicator.spec_json)
    
    # Export to Excel
    excel_file = export_service.export_indicator_results(
        results,
        indicator.title,
        template_type
    )
    
    filename = f"{indicator.title.replace(' ', '_')}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ==================== FORMULAIRES ====================

class FormulaireCreate(BaseModel):
    nom: str
    demandeur: str
    template_type: str
    indicator_ids: List[int]

class FormulaireUpdate(BaseModel):
    nom: Optional[str] = None
    demandeur: Optional[str] = None
    template_type: Optional[str] = None
    indicator_ids: Optional[List[int]] = None

@app.get("/api/formulaires")
async def list_formulaires(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all formulaires"""
    service = FormulaireService(db)
    return service.list_formulaires()

@app.get("/api/formulaires/{formulaire_id}")
async def get_formulaire(
    formulaire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get formulaire by ID"""
    service = FormulaireService(db)
    formulaire = service.get_formulaire(formulaire_id)
    if not formulaire:
        raise HTTPException(status_code=404, detail="Formulaire not found")
    return formulaire

@app.post("/api/formulaires")
async def create_formulaire(
    formulaire_data: FormulaireCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["modificateur"]))
):
    """Create a new formulaire"""
    service = FormulaireService(db)
    formulaire = service.create_formulaire(
        nom=formulaire_data.nom,
        demandeur=formulaire_data.demandeur,
        template_type=formulaire_data.template_type,
        created_by_id=current_user.id,
        indicator_ids=formulaire_data.indicator_ids
    )
    return formulaire

@app.post("/api/formulaires/{formulaire_id}/generate")
async def generate_formulaire(
    formulaire_id: int,
    request: CalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate complete formulaire data"""
    service = FormulaireService(db)
    try:
        data = service.generate_formulaire_data(
            formulaire_id,
            periode=request.periode,
            filters=request.filters
        )
        return data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/formulaires/{formulaire_id}/export")
async def export_formulaire(
    formulaire_id: int,
    request: CalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export formulaire to Excel"""
    service = FormulaireService(db)
    export_service = ExportService(db)
    
    formulaire = service.get_formulaire(formulaire_id)
    if not formulaire:
        raise HTTPException(status_code=404, detail="Formulaire not found")
    
    # Generate data
    formulaire_data = service.generate_formulaire_data(
        formulaire_id,
        periode=request.periode,
        filters=request.filters
    )
    
    # Export
    excel_file = export_service.export_formulaire(
        formulaire_data,
        formulaire.template_type
    )
    
    filename = f"{formulaire.nom.replace(' ', '_')}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
