from datetime import date, timedelta

import pytest


@pytest.mark.asyncio
async def test_manager_can_view_team_daily(client, manager_token, seeded_users_and_team, today_standup):
    team = seeded_users_and_team["team"]
    response = await client.get(
        f"/standups/team/{team.id}/daily",
        params={"date": date.today().isoformat()},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_manager_can_view_team_summary(client, manager_token, seeded_users_and_team, today_standup):
    team = seeded_users_and_team["team"]
    start = date.today() - timedelta(days=1)
    end = date.today() + timedelta(days=1)
    response = await client.get(
        f"/standups/team/{team.id}/summary",
        params={"start_date": start.isoformat(), "end_date": end.isoformat()},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_entries"] >= 1
