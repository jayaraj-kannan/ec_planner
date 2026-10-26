"""Unit tests for ADK A2UI rendering callback utilities."""

import json
import pytest
from google.genai import types
from app.a2ui_utils import (
    LlmResponse,
    _wrap_a2ui_part,
    _iter_json_values,
    _extract_a2ui_messages,
    _sanitize_image_components,
    _component_ids_and_refs,
    _surface_is_renderable,
    a2ui_callback,
    _FALLBACK_TEXT,
    _IMAGE_NOTE,
)


class TestA2UIUtils:
    """Test suite for A2UI data re-wrapping and sanitization."""

    def test_wrap_a2ui_part(self):
        msg = {"beginRendering": {"surfaceId": "test_surface"}}
        part = _wrap_a2ui_part(msg)
        assert isinstance(part, types.Part)
        assert part.inline_data is not None
        assert b"<a2a_datapart_json>" in part.inline_data.data
        assert b"application/json+a2ui" in part.inline_data.data

    def test_iter_json_values(self):
        text = '{"a": 1} \n junk \n {"b": 2} [1, 2, 3]'
        values = list(_iter_json_values(text))
        assert len(values) == 3
        assert values[0] == {"a": 1}
        assert values[1] == {"b": 2}
        assert values[2] == [1, 2, 3]

    def test_extract_a2ui_messages_clean_and_fenced(self):
        fenced_text = """```json
{"beginRendering": {"surfaceId": "s1"}}
{"surfaceUpdate": {"surfaceId": "s1", "components": []}}
```"""
        messages = _extract_a2ui_messages(fenced_text)
        assert len(messages) == 2
        assert "beginRendering" in messages[0]
        assert "surfaceUpdate" in messages[1]

    def test_extract_a2ui_messages_with_envelope(self):
        wrapped = '<a2a_datapart_json>{"kind":"data","data":{"surfaceUpdate":{"surfaceId":"s2"}}}</a2a_datapart_json>'
        messages = _extract_a2ui_messages(wrapped)
        assert len(messages) == 1
        assert "surfaceUpdate" in messages[0]

    def test_sanitize_image_components(self):
        messages = [
            {
                "surfaceUpdate": {
                    "surfaceId": "s1",
                    "components": [
                        {
                            "id": "img1",
                            "component": {
                                "Image": {"url": {"literalString": "local_cake.png"}}
                            },
                        },
                        {
                            "id": "img2",
                            "component": {
                                "Image": {"url": {"literalString": "https://example.com/cake.jpg"}}
                            },
                        },
                    ],
                }
            }
        ]
        _sanitize_image_components(messages)
        comps = messages[0]["surfaceUpdate"]["components"]
        assert comps[0]["component"]["Text"]["text"]["literalString"] == _IMAGE_NOTE
        assert comps[1]["component"]["Image"]["url"]["literalString"] == "https://example.com/cake.jpg"

    def test_component_ids_and_refs(self):
        components = [
            {"id": "root", "component": {"Card": {"child": "c1"}}},
            {"id": "c1", "component": {"Column": {"children": {"explicitList": ["c2", "c3"]}}}},
            {"id": "c2", "component": {"Text": {"text": "Hello"}}},
        ]
        ids, refs = _component_ids_and_refs(components)
        assert "root" in ids
        assert "c1" in ids
        assert "c2" in ids
        assert "c1" in refs
        assert "c2" in refs
        assert "c3" in refs

    def test_surface_is_renderable(self):
        # Empty messages
        assert _surface_is_renderable([]) is False

        # Valid renderable surface
        valid = [
            {"beginRendering": {"surfaceId": "s1", "root": "c1"}},
            {"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "c1", "component": {"Text": {"text": "Hi"}}}]}},
        ]
        assert _surface_is_renderable(valid) is True

    def test_a2ui_callback_plain_text(self):
        resp = LlmResponse(
            content=types.Content(
                parts=[types.Part.from_text(text="Just a plain conversational text message.")]
            )
        )
        result = a2ui_callback(None, resp)
        assert result is None

    def test_a2ui_callback_with_valid_a2ui(self):
        a2ui_json = (
            json.dumps({"beginRendering": {"surfaceId": "s1", "root": "c1"}})
            + "\n"
            + json.dumps({
                "surfaceUpdate": {
                    "surfaceId": "s1",
                    "components": [{"id": "c1", "component": {"Text": {"text": "Hello"}}}],
                }
            })
        )
        resp = LlmResponse(
            content=types.Content(
                parts=[types.Part.from_text(text=a2ui_json)]
            )
        )
        result = a2ui_callback(None, resp)
        assert result is not None
        assert len(result.content.parts) == 2
        for part in result.content.parts:
            assert b"<a2a_datapart_json>" in part.inline_data.data

    def test_a2ui_callback_incomplete_a2ui_returns_fallback(self):
        lone_begin = json.dumps({"beginRendering": {"surfaceId": "s1"}})
        resp = LlmResponse(
            content=types.Content(
                parts=[types.Part.from_text(text=lone_begin)]
            )
        )
        result = a2ui_callback(None, resp)
        assert result is not None
        assert result.content.parts[0].text == _FALLBACK_TEXT
