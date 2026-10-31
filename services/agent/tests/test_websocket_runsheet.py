"""Unit tests for FastAPI WebSocket run sheet real-time status endpoints."""

import pytest
from fastapi.testclient import TestClient
from server import app, runsheet_manager


@pytest.fixture(autouse=True)
def clean_manager():
    """Resets runsheet manager state before each test."""
    runsheet_manager.active_connections.clear()
    runsheet_manager.room_states.clear()
    runsheet_manager.aliases.clear()
    yield
    runsheet_manager.active_connections.clear()
    runsheet_manager.room_states.clear()
    runsheet_manager.aliases.clear()


def test_websocket_connect_and_ping():
    """Tests establishing a WebSocket connection and receiving the welcome and pong messages."""
    client = TestClient(app)
    with client.websocket_connect("/ws/runsheet/evt-1") as ws:
        welcome = ws.receive_json()
        assert welcome["type"] == "connected"
        assert welcome["room_id"] == "evt-1"
        assert welcome["active_watchers"] >= 1

        # Ping-pong test
        ws.send_json({"type": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"
        assert "timestamp" in pong


def test_websocket_report_delay_broadcast():
    """Tests reporting an activity delay and receiving the broadcast across clients."""
    client = TestClient(app)
    with client.websocket_connect("/ws/runsheet/evt-1") as coordinator:
        # Coordinator welcome
        c_welcome = coordinator.receive_json()
        assert c_welcome["type"] == "connected"

        with client.websocket_connect("/ws/runsheet/evt-1") as attendee:
            # Attendee welcome
            a_welcome = attendee.receive_json()
            assert a_welcome["type"] == "connected"

            # Coordinator reports delay
            coordinator.send_json({
                "type": "report_delay",
                "activity_id": "act-1",
                "delay_minutes": 20,
            })

            # Coordinator gets ack
            ack = coordinator.receive_json()
            assert ack["type"] == "ack"
            assert ack["action"] == "report_delay"
            assert ack["activity_id"] == "act-1"

            # Attendee receives real-time broadcast
            broadcast = attendee.receive_json()
            assert broadcast["type"] == "delay_reported"
            assert broadcast["activity_id"] == "act-1"
            assert broadcast["delay_minutes"] == 20
            assert broadcast["room_id"] == "evt-1"


def test_websocket_update_status_broadcast():
    """Tests updating an activity status to completed and receiving the broadcast."""
    client = TestClient(app)
    with client.websocket_connect("/ws/runsheet/evt-1") as coordinator:
        coordinator.receive_json()

        with client.websocket_connect("/ws/runsheet/evt-1") as attendee:
            attendee.receive_json()

            coordinator.send_json({
                "type": "update_status",
                "activity_id": "act-2",
                "status": "completed",
            })

            ack = coordinator.receive_json()
            assert ack["type"] == "ack"
            assert ack["action"] == "update_status"

            broadcast = attendee.receive_json()
            assert broadcast["type"] == "status_updated"
            assert broadcast["activity_id"] == "act-2"
            assert broadcast["status"] == "completed"


def test_websocket_launch_runsheet_and_alias():
    """Tests launching a runsheet, registering alias hash, and broadcasting to both."""
    client = TestClient(app)
    hash_code = "rs-priya-rahul-9a8f"

    with client.websocket_connect(f"/ws/runsheet/{hash_code}") as guest:
        guest.receive_json()

        with client.websocket_connect("/ws/runsheet/evt-1") as coordinator:
            coordinator.receive_json()

            # Coordinator launches runsheet and registers hash
            coordinator.send_json({
                "type": "launch_runsheet",
                "is_launched": True,
                "hash_code": hash_code,
            })

            ack = coordinator.receive_json()
            assert ack["type"] == "ack"
            assert ack["is_launched"] is True

            # Guest connected via hash code receives the broadcast
            broadcast = guest.receive_json()
            assert broadcast["type"] == "runsheet_launched"
            assert broadcast["is_launched"] is True
            assert broadcast["hash_code"] == hash_code


def test_websocket_sync_activities():
    """Tests syncing full schedule activities list."""
    client = TestClient(app)
    with client.websocket_connect("/ws/runsheet/evt-1") as coordinator:
        coordinator.receive_json()

        with client.websocket_connect("/ws/runsheet/evt-1") as attendee:
            attendee.receive_json()

            sample_schedule = [
                {"id": "act-1", "activityName": "Varmala", "status": "upcoming"},
                {"id": "act-2", "activityName": "Pheras", "status": "upcoming"},
            ]
            coordinator.send_json({
                "type": "sync_activities",
                "schedule": sample_schedule,
            })

            ack = coordinator.receive_json()
            assert ack["type"] == "ack"
            assert ack["count"] == 2

            broadcast = attendee.receive_json()
            assert broadcast["type"] == "activities_synced"
            assert len(broadcast["schedule"]) == 2


def test_websocket_generic_broadcast():
    """Tests generic custom payload pass-through broadcast."""
    client = TestClient(app)
    with client.websocket_connect("/ws/runsheet/evt-1") as ws1:
        ws1.receive_json()
        with client.websocket_connect("/ws/runsheet/evt-1") as ws2:
            ws2.receive_json()

            ws1.send_json({"type": "custom_announcement", "text": "Dinner is now open!"})
            received = ws2.receive_json()
            assert received["type"] == "custom_announcement"
            assert received["text"] == "Dinner is now open!"


def test_rest_broadcast_endpoint():
    """Tests the HTTP REST broadcast fallback endpoint."""
    client = TestClient(app)
    with client.websocket_connect("/ws/runsheet/evt-broadcast") as attendee:
        attendee.receive_json()

        # Send broadcast via REST
        res = client.post("/api/runsheet/evt-broadcast/broadcast", json={
            "type": "delay_reported",
            "activity_id": "act-rest-1",
            "delay_minutes": 10,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "broadcast_sent"
        assert data["recipients"] == 1

        # Attendee receives it over WebSocket
        msg = attendee.receive_json()
        assert msg["type"] == "delay_reported"
        assert msg["activity_id"] == "act-rest-1"
        assert msg["delay_minutes"] == 10

