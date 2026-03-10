import pytest


@pytest.mark.asyncio
async def test_login_success(client, seeded_users_and_team):
    response = await client.post(
        "/auth/login",
        data={"username": "member@example.com", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_failure(client, seeded_users_and_team):
    response = await client.post(
        "/auth/login",
        data={"username": "member@example.com", "password": "wrong"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 401
