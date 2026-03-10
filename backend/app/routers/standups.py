from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_current_team_member
from ..models import StandupEntry, TeamMember, User, UserRole
from ..schemas import StandupCreate, StandupRead, StandupSummary, StandupUpdate
from ..security import get_current_active_user


router = APIRouter(prefix="/standups", tags=["standups"])


@router.post("/", response_model=StandupRead, status_code=status.HTTP_201_CREATED)
async def create_standup(
    standup_in: StandupCreate,
    db: AsyncSession = Depends(get_db),
    membership: TeamMember = Depends(get_current_team_member),
    current_user: User = Depends(get_current_active_user),
):
    # Ensure membership team matches payload
    if membership.team_id != standup_in.team_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this team")

    # Only one standup per user per day per team
    existing = await db.execute(
        select(StandupEntry).where(
            StandupEntry.user_id == current_user.id,
            StandupEntry.team_id == standup_in.team_id,
            StandupEntry.date == standup_in.date,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Standup already submitted for this date")

    entry = StandupEntry(
        user_id=current_user.id,
        team_id=standup_in.team_id,
        date=standup_in.date,
        yesterday=standup_in.yesterday,
        today=standup_in.today,
        blockers=standup_in.blockers,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/me", response_model=List[StandupRead])
async def list_my_standups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    team_id: Optional[int] = None,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    query = select(StandupEntry).where(StandupEntry.user_id == current_user.id)
    if team_id is not None:
        query = query.where(StandupEntry.team_id == team_id)
    if start_date is not None:
        query = query.where(StandupEntry.date >= start_date)
    if end_date is not None:
        query = query.where(StandupEntry.date <= end_date)

    result = await db.execute(query.order_by(StandupEntry.date.desc()))
    return result.scalars().all()


@router.patch("/{standup_id}", response_model=StandupRead)
async def update_standup(
    standup_id: int,
    standup_in: StandupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(StandupEntry).where(StandupEntry.id == standup_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standup not found")
    if entry.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit another user's standup")

    update_data = standup_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/team/{team_id}/daily", response_model=List[StandupRead])
async def get_team_daily_standups(
    team_id: int,
    date_: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
    membership: TeamMember = Depends(get_current_team_member),
):
    # Only managers or admins can view team daily standups
    if not membership.is_manager and membership.user.role not in {UserRole.ADMIN}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can view team standups")

    result = await db.execute(
        select(StandupEntry).where(
            StandupEntry.team_id == team_id,
            StandupEntry.date == date_,
        )
    )
    return result.scalars().all()


@router.get("/team/{team_id}/summary", response_model=StandupSummary)
async def get_team_summary(
    team_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    membership: TeamMember = Depends(get_current_team_member),
):
    if not membership.is_manager and membership.user.role not in {UserRole.ADMIN}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can view team summaries")

    result = await db.execute(
        select(func.count(StandupEntry.id)).where(
            StandupEntry.team_id == team_id,
            StandupEntry.date >= start_date,
            StandupEntry.date <= end_date,
        )
    )
    total_entries = result.scalar_one() or 0

    return StandupSummary(date=start_date, team_id=team_id, total_entries=total_entries)
