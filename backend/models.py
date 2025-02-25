from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Date, Table, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(10), nullable=False)
    xp = Column(Integer, nullable=False)
    total_required = Column(Integer, nullable=False)
    
    # User-specific achievement data will be in UserAchievement

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    unlocked = Column(Boolean, default=False)
    date_unlocked = Column(Date, nullable=True)
    progress = Column(Integer, default=0)
    
    achievement = relationship("Achievement")
    user = relationship("User", back_populates="achievements")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    progress = Column(Integer, default=0)
    due_date = Column(Date, nullable=True)
    materials = Column(JSON, nullable=True)  # Store list as JSON
    status = Column(String(50), nullable=False)
    thumbnail = Column(String(255), nullable=True)
    last_modified = Column(Date, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User", back_populates="projects")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    projects_completed = Column(Integer, default=0)
    total_xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    avatar = Column(String(255), nullable=True)
    
    achievements = relationship("UserAchievement", back_populates="user")
    projects = relationship("Project", back_populates="user")

class CombinedData(Base):
    __tablename__ = "combined_data"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=True)
    materials_required = Column(JSON, nullable=True)  # Store list as JSON
    steps = Column(JSON, nullable=True)  # Store list as JSON
    tips = Column(JSON, nullable=True)  # Store list as JSON
    difficulty = Column(String(50), nullable=True)
    time_required = Column(String(100), nullable=True)
    embedding = Column(JSON, nullable=True)  # Store embedding array as JSON
