from datetime import date

import pytest


@pytest.mark.asyncio
async def test_member_can_create_standup(client, member_token, seeded_users_and_team):
    team = seeded_users_and_team["team"]
    payload = {
        "team_id": team.id,
        "date": date.today().isoformat(),
        "yesterday": "Did A",
        "today": "Will do B",
        "blockers": "None",
    }
    response = await client.post(
        "/standups/",
        json=payload,
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["team_id"] == team.id


@pytest.mark.asyncio
async def test_member_cannot_create_duplicate_standup(client, member_token, seeded_users_and_team):
    team = seeded_users_and_team["team"]
    payload = {
        "team_id": team.id,
        "date": date.today().isoformat(),
        "yesterday": "Did A",
        "today": "Will do B",
        "blockers": "None",
    }
    response1 = await client.post(
        "/standups/",
        json=payload,
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert response1.status_code == 201

    response2 = await client.post(
        "/standups/",
        json=payload,
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert response2.status_code == 400


@pytest.mark.asyncio
async def test_member_can_update_own_standup(client, member_token, today_standup):
    response = await client.patch(
        f"/standups/{today_standup.id}",
        json={"today": "Updated"},
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert response.status_code == 200
    assert response.json()["today"] == "Updated"
