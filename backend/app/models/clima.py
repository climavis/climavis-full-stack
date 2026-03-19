"""
Modelos ORM para datos climáticos – PostgreSQL.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    UniqueConstraint, Index,
)
from sqlalchemy.sql import func

from ..database import Base


class ClimateRecord(Base):
    """Registro diario de clima por estado."""

    __tablename__ = "climate_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String(60), nullable=False)
    date = Column(Date, nullable=False)

    # Temperatura (°C)
    temp_max = Column(Float)
    temp_min = Column(Float)
    temp_mean = Column(Float)

    # Precipitación (mm)
    precipitation = Column(Float)

    # Viento (km/h)
    wind_max = Column(Float)
    wind_gusts = Column(Float)
    wind_direction = Column(Float)  # grados dominantes

    # Humedad relativa (%)
    humidity_max = Column(Float)
    humidity_min = Column(Float)
    humidity_mean = Column(Float)

    # Radiación solar (MJ/m²)
    radiation = Column(Float)

    # Meta
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("state", "date", name="uq_state_date"),
        Index("ix_climate_state", "state"),
        Index("ix_climate_date", "date"),
        Index("ix_climate_state_date", "state", "date"),
    )

    def __repr__(self):
        return f"<ClimateRecord(state='{self.state}', date='{self.date}')>"


class SyncStatus(Base):
    """Lleva registro del estado de sincronización por estado."""

    __tablename__ = "sync_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String(60), nullable=False, unique=True)
    last_synced_date = Column(Date)
    last_sync_at = Column(DateTime(timezone=True))
    records_count = Column(Integer, default=0)
    status = Column(String(20), default="pending")  # pending | syncing | ok | error
    error_message = Column(String(500))

    __table_args__ = (Index("ix_sync_state", "state"),)

    def __repr__(self):
        return f"<SyncStatus(state='{self.state}', last='{self.last_synced_date}')>"
