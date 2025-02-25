import json
from datetime import datetime
import numpy as np
from sqlalchemy.orm import Session
from models import Base, Achievement, User, Project, UserAchievement, CombinedData
from database import engine, SessionLocal


def convert_str_date(date_str):
    """Convert string date to datetime object"""
    if date_str:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    return None


def populate_achievements(db: Session):
    """Populate achievement data"""
    achievements_data = [
        {
            "id": 1,
            "title": "First Timer",
            "description": "Complete your first DIY project",
            "icon": "🌟",
            "xp": 100,
            "total_required": 1,
        },
        {
            "id": 2,
            "title": "Weekend Warrior",
            "description": "Complete 3 projects in one weekend",
            "icon": "⚡",
            "xp": 250,
            "total_required": 3,
        },
        {
            "id": 3,
            "title": "Tool Master",
            "description": "Use 10 different tools",
            "icon": "🔧",
            "xp": 300,
            "total_required": 10,
        },
        {
            "id": 4,
            "title": "Eco Warrior",
            "description": "Complete 5 upcycling projects",
            "icon": "♻️",
            "xp": 400,
            "total_required": 5,
        },
        {
            "id": 5,
            "title": "Safety First",
            "description": "Complete the safety tutorial",
            "icon": "🛡️",
            "xp": 50,
            "total_required": 1,
        },
        {
            "id": 6,
            "title": "Community Helper",
            "description": "Help 3 other makers with their projects",
            "icon": "🤝",
            "xp": 200,
            "total_required": 3,
        },
        {
            "id": 7,
            "title": "Perfect Streak",
            "description": "Complete 5 projects without any mistakes",
            "icon": "🎯",
            "xp": 500,
            "total_required": 5,
        },
        {
            "id": 8,
            "title": "Material Explorer",
            "description": "Use 15 different materials",
            "icon": "🧪",
            "xp": 350,
            "total_required": 15,
        },
    ]

    for ach_data in achievements_data:
        db_achievement = Achievement(**ach_data)
        db.add(db_achievement)

    db.commit()
    print("Achievement data populated successfully!")


def populate_users(db: Session):
    """Populate user data from leaderboard"""
    users_data = [
        {
            "id": 1,
            "username": "DIYMaster",
            "projects_completed": 47,
            "total_xp": 12500,
            "streak_days": 15,
            "avatar": "avatar1.jpg",
        },
        {
            "id": 2,
            "username": "CraftGenius",
            "projects_completed": 42,
            "total_xp": 11200,
            "streak_days": 12,
            "avatar": "avatar2.jpg",
        },
        {
            "id": 3,
            "username": "MakerPro",
            "projects_completed": 38,
            "total_xp": 10800,
            "streak_days": 8,
            "avatar": "avatar3.jpg",
        },
        {
            "id": 4,
            "username": "CreativeCrafter",
            "projects_completed": 35,
            "total_xp": 9500,
            "streak_days": 6,
            "avatar": "avatar4.jpg",
        },
        {
            "id": 5,
            "username": "BuildItBetter",
            "projects_completed": 31,
            "total_xp": 8900,
            "streak_days": 4,
            "avatar": "avatar5.jpg",
        },
    ]

    for user_data in users_data:
        db_user = User(**user_data)
        db.add(db_user)

    db.commit()
    print("User data populated successfully!")


def populate_user_achievements(db: Session):
    """Populate user achievements data"""
    # Hardcoded user achievement data based on original data
    user_achievements = [
        # For User 1 (DIYMaster)
        {
            "user_id": 1,
            "achievement_id": 1,  # First Timer
            "unlocked": True,
            "date_unlocked": convert_str_date("2024-01-15"),
            "progress": 1,
        },
        {
            "user_id": 1,
            "achievement_id": 5,  # Safety First
            "unlocked": True,
            "date_unlocked": convert_str_date("2024-01-10"),
            "progress": 1,
        },
        {
            "user_id": 1,
            "achievement_id": 2,  # Weekend Warrior
            "unlocked": False,
            "progress": 1,
        },
        {
            "user_id": 1,
            "achievement_id": 3,  # Tool Master
            "unlocked": False,
            "progress": 6,
        },
        {
            "user_id": 1,
            "achievement_id": 4,  # Eco Warrior
            "unlocked": False,
            "progress": 2,
        },
        {
            "user_id": 1,
            "achievement_id": 6,  # Community Helper
            "unlocked": False,
            "progress": 1,
        },
        {
            "user_id": 1,
            "achievement_id": 7,  # Perfect Streak
            "unlocked": False,
            "progress": 3,
        },
        {
            "user_id": 1,
            "achievement_id": 8,  # Material Explorer
            "unlocked": False,
            "progress": 8,
        },
    ]

    for ach_data in user_achievements:
        db_user_achievement = UserAchievement(**ach_data)
        db.add(db_user_achievement)

    db.commit()
    print("User achievement data populated successfully!")


def populate_combined_data(db: Session):
    """Populate combined data from JSON file"""
    try:
        with open(
            "../instructable/combined_data_with_embeddings.json", "r", encoding="utf-8"
        ) as f:
            combined_data = json.load(f)

        # Convert numpy arrays to lists if needed
        for item in combined_data:
            if "embedding" in item and isinstance(item["embedding"], np.ndarray):
                item["embedding"] = item["embedding"].tolist()

            db_item = CombinedData(
                title=item.get("title", "Untitled Project"),
                materials_required=item.get("materials_required", []),
                steps=item.get("steps", []),
                tips=item.get("tips", []),
                difficulty=item.get("difficulty", "Medium"),
                time_required=item.get("time_required", "Unknown"),
                embedding=item.get("embedding", []),
            )
            db.add(db_item)

        db.commit()
        print(f"Populated {len(combined_data)} items from combined data!")
    except FileNotFoundError:
        print(
            "Warning: combined_data_with_embeddings.json file not found. Skipping combined data import."
        )
    except Exception as e:
        print(f"Error importing combined data: {str(e)}")


if __name__ == "__main__":
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Get database session
    db = SessionLocal()

    try:
        # Populate all data
        populate_achievements(db)
        populate_users(db)
        populate_user_achievements(db)
        populate_combined_data(db)

        print("Database populated successfully!")
    except Exception as e:
        print(f"Error populating database: {str(e)}")
    finally:
        db.close()

