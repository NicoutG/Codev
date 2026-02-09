from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class ReportIndicatorConfig(BaseModel):
    indicator_id: int
    chart_type: Optional[str] = None  # bar, line, pie, area, etc.
    chart_config: Optional[dict] = None  # Options de configuration du graphique
    display_order: int = 0


class ReportBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ReportCreate(ReportBase):
    indicator_ids: List[int] = Field(default_factory=list)
    indicator_configs: List[ReportIndicatorConfig] = Field(default_factory=list)


class ReportUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    indicator_ids: Optional[List[int]] = None
    indicator_configs: Optional[List[ReportIndicatorConfig]] = None


class IndicatorInReport(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    chart_type: Optional[str] = None
    chart_config: Optional[dict] = None
    display_order: int = 0

    class Config:
        from_attributes = True


class ReportResponse(ReportBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    indicators: List[IndicatorInReport] = []

    class Config:
        from_attributes = True


class ReportExecutionResult(BaseModel):
    indicator_id: int
    indicator_title: str
    chart_type: Optional[str] = None
    execution_result: Any  # Résultat de l'exécution de l'indicateur


class ReportGenerateResponse(BaseModel):
    report_id: int
    report_title: str
    generated_at: datetime
    results: List[ReportExecutionResult]
