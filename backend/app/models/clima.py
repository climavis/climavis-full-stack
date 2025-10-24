"""
Modelo de datos climáticos usando SQLAlchemy
"""

from sqlalchemy import Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class DatoClimatico(Base):
    """Modelo para datos climáticos históricos"""
    __tablename__ = "datos_climaticos"
    
    id = Column(Integer, primary_key=True, index=True)
    estado = Column(String, index=True, nullable=False)
    fecha = Column(Date, nullable=False)
    temperatura_max = Column(Float)
    temperatura_min = Column(Float)
    temperatura_promedio = Column(Float)
    precipitacion = Column(Float)
    humedad = Column(Float)
    
    def __repr__(self):
        return f"<DatoClimatico(estado='{self.estado}', fecha='{self.fecha}')>"


class Prediccion(Base):
    """Modelo para predicciones climáticas"""
    __tablename__ = "predicciones"
    
    id = Column(Integer, primary_key=True, index=True)
    estado = Column(String, index=True, nullable=False)
    anio = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    temperatura_predicha = Column(Float)
    precipitacion_predicha = Column(Float)
    confianza = Column(Float)  # Nivel de confianza de la predicción (0-1)
    
    def __repr__(self):
        return f"<Prediccion(estado='{self.estado}', anio={self.anio}, mes={self.mes})>"
