import asyncio
from collections.abc import AsyncGenerator
from datetime import date

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app as fastapi_app
from app.models import Team, TeamMember, User, UserRole
from app.security import get_password_hash


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop


@pytest.fixture()
async def app() -> AsyncGenerator[FastAPI, None]:
    yield fastapi_app


@pytest.fixture()
async def test_db(app: FastAPI) -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with async_session() as session:
        yield session

    await engine.dispose()


@pytest.fixture()
async def client(app: FastAPI, test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c


@pytest.fixture()
async def seeded_users_and_team(test_db: AsyncSession):
    member = User(
        email="member@example.com",
        full_name="Member User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.MEMBER,
    )
    manager = User(
        email="manager@example.com",
        full_name="Manager User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.MANAGER,
    )
    team = Team(name="Team A")

    test_db.add_all([member, manager, team])
    await test_db.commit()
    await test_db.refresh(member)
    await test_db.refresh(manager)
    await test_db.refresh(team)

    member_membership = TeamMember(team_id=team.id, user_id=member.id, is_manager=False)
    manager_membership = TeamMember(team_id=team.id, user_id=manager.id, is_manager=True)
    test_db.add_all([member_membership, manager_membership])
    await test_db.commit()

    return {
        "member": member,
        "manager": manager,
        "team": team,
    }


async def _get_token(client: AsyncClient, username: str, password: str) -> str:
    response = await client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture()
async def member_token(client: AsyncClient, seeded_users_and_team):
    return await _get_token(client, "member@example.com", "password123")


@pytest.fixture()
async def manager_token(client: AsyncClient, seeded_users_and_team):
    return await _get_token(client, "manager@example.com", "password123")


@pytest.fixture()
async def today_standup(test_db: AsyncSession, seeded_users_and_team):
    from app.models import StandupEntry

    member = seeded_users_and_team["member"]
    team = seeded_users_and_team["team"]

    entry = StandupEntry(
        user_id=member.id,
        team_id=team.id,
        date=date.today(),
        yesterday="Did X",
        today="Will do Y",
        blockers="None",
    )
    test_db.add(entry)
    await test_db.commit()
    await test_db.refresh(entry)
    return entry
