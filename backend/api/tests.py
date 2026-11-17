from types import SimpleNamespace
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from google.genai import errors as genai_errors
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import ChatSession, Message, User


def google_idinfo(**overrides):
    info = {
        "email": "recruiter@example.com",
        "email_verified": True,
        "given_name": "Test",
        "family_name": "User",
        "picture": "https://example.com/avatar.png",
    }
    info.update(overrides)
    return info


@override_settings(GOOGLE_CLIENT_ID="test-client-id")
class GoogleLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @mock.patch("api.views.id_token.verify_oauth2_token")
    def test_first_login_creates_user_and_token(self, verify):
        verify.return_value = google_idinfo()
        res = self.client.post("/api/auth/google/", {"token": "abc"}, format="json")

        self.assertEqual(res.status_code, 200)
        user = User.objects.get(email="recruiter@example.com")
        self.assertEqual(res.data["token"], Token.objects.get(user=user).key)
        self.assertEqual(res.data["user"]["profile_picture_url"], "https://example.com/avatar.png")
        self.assertFalse(user.has_usable_password())
        self.assertEqual(verify.call_args.kwargs["audience"], "test-client-id")

    @mock.patch("api.views.id_token.verify_oauth2_token")
    def test_second_login_reuses_user(self, verify):
        verify.return_value = google_idinfo()
        self.client.post("/api/auth/google/", {"token": "abc"}, format="json")
        verify.return_value = google_idinfo(picture="https://example.com/new.png")
        res = self.client.post("/api/auth/google/", {"token": "abc"}, format="json")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().profile_picture_url, "https://example.com/new.png")

    @mock.patch("api.views.id_token.verify_oauth2_token", side_effect=ValueError("bad audience"))
    def test_invalid_credential_is_rejected(self, verify):
        res = self.client.post("/api/auth/google/", {"token": "abc"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    @mock.patch("api.views.id_token.verify_oauth2_token")
    def test_unverified_email_is_rejected(self, verify):
        verify.return_value = google_idinfo(email_verified=False)
        res = self.client.post("/api/auth/google/", {"token": "abc"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_missing_credential(self):
        res = self.client.post("/api/auth/google/", {}, format="json")
        self.assertEqual(res.status_code, 400)


class AuthedTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="a@example.com", email="a@example.com")
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")


class SessionAndUserTests(AuthedTestCase):
    def test_current_user(self):
        res = self.client.get("/api/auth/user/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["email"], "a@example.com")

    def test_requires_token(self):
        res = APIClient().get("/api/chats/")
        self.assertEqual(res.status_code, 401)

    def test_logout_deletes_token(self):
        res = self.client.post("/api/auth/logout/")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_create_rename_pin_and_delete_chat(self):
        chat_id = self.client.post("/api/chats/").data["id"]
        self.client.patch(f"/api/chats/{chat_id}/", {"title": "Renamed", "pinned": True}, format="json")
        listed = self.client.get("/api/chats/").data
        self.assertEqual(listed[0]["title"], "Renamed")
        self.assertTrue(listed[0]["pinned"])

        self.assertEqual(self.client.delete(f"/api/chats/{chat_id}/").status_code, 204)
        self.assertEqual(self.client.get("/api/chats/").data, [])
        self.assertTrue(ChatSession.objects.get(id=chat_id).is_deleted)

    def test_cannot_read_someone_elses_chat(self):
        other = User.objects.create_user(username="b@example.com", email="b@example.com")
        chat = ChatSession.objects.create(user=other)
        self.assertEqual(self.client.get(f"/api/chats/{chat.id}/").status_code, 404)


def gemini_reply(text):
    return SimpleNamespace(text=text)


def gemini_error(code, status_name):
    return genai_errors.APIError(code, {"error": {"code": code, "status": status_name, "message": status_name}})


@override_settings(
    GEMINI_API_KEY="test-key",
    GEMINI_MODEL="test-model",
    GEMINI_FALLBACK_MODELS=["fallback-model"],
    MESSAGES_PER_HOUR=5,
)
class MessageTests(AuthedTestCase):
    def setUp(self):
        super().setUp()
        self.chat = ChatSession.objects.create(user=self.user)
        self.url = f"/api/chats/{self.chat.id}/messages/"
        patcher = mock.patch("api.views.get_gemini_client")
        self.gemini = patcher.start().return_value
        self.addCleanup(patcher.stop)

    def test_sends_message_and_stores_both_turns(self):
        self.gemini.models.generate_content.return_value = gemini_reply("Hello from Gemini")
        res = self.client.post(self.url, {"text": "Explain recursion"}, format="multipart")

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["user_message"]["text"], "Explain recursion")
        self.assertEqual(res.data["bot_message"]["text"], "Hello from Gemini")
        self.assertEqual(res.data["chat"]["title"], "Explain recursion")
        self.assertEqual(Message.objects.filter(session=self.chat).count(), 2)
        self.assertEqual(self.gemini.models.generate_content.call_args.kwargs["model"], "test-model")

        # A reload reads the same history back.
        detail = self.client.get(f"/api/chats/{self.chat.id}/").data
        self.assertEqual([m["text"] for m in detail["messages"]], ["Explain recursion", "Hello from Gemini"])

    def test_earlier_turns_are_sent_as_context(self):
        Message.objects.create(session=self.chat, text="My name is Ravi", is_from_user=True)
        Message.objects.create(session=self.chat, text="Nice to meet you", is_from_user=False)
        self.gemini.models.generate_content.return_value = gemini_reply("You are Ravi")
        self.client.post(self.url, {"text": "What is my name?"}, format="multipart")

        contents = self.gemini.models.generate_content.call_args.kwargs["contents"]
        self.assertEqual([c.role for c in contents], ["user", "model", "user"])
        self.assertEqual(contents[0].parts[0].text, "My name is Ravi")
        self.assertEqual(contents[-1].parts[0].text, "What is my name?")

    def test_image_only_message(self):
        self.gemini.models.generate_content.return_value = gemini_reply("Nice cat")
        image = SimpleUploadedFile("cat.png", b"\x89PNG fake", content_type="image/png")
        res = self.client.post(self.url, {"file_upload": image}, format="multipart")

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["user_message"]["attachment"], {"name": "cat.png", "type": "image/png"})
        self.assertEqual(res.data["chat"]["title"], "Image: cat.png")
        part = self.gemini.models.generate_content.call_args.kwargs["contents"][-1].parts[0]
        self.assertEqual(part.inline_data.mime_type, "image/png")

    def test_rejects_non_image_upload(self):
        pdf = SimpleUploadedFile("cv.pdf", b"%PDF", content_type="application/pdf")
        res = self.client.post(self.url, {"file_upload": pdf}, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.gemini.models.generate_content.assert_not_called()

    def test_empty_message_rejected(self):
        res = self.client.post(self.url, {"text": "   "}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_gemini_failure_does_not_store_message(self):
        self.gemini.models.generate_content.side_effect = gemini_error(429, "RESOURCE_EXHAUSTED")
        res = self.client.post(self.url, {"text": "hi"}, format="multipart")

        self.assertEqual(res.status_code, 502)
        self.assertIn("too many requests", res.data["error"])
        self.assertEqual(Message.objects.count(), 0)
        # Both the main and the fallback model were tried.
        self.assertEqual(self.gemini.models.generate_content.call_count, 2)

    def test_falls_back_when_main_model_is_overloaded(self):
        self.gemini.models.generate_content.side_effect = [
            gemini_error(503, "UNAVAILABLE"),
            gemini_reply("Reply from the fallback"),
        ]
        res = self.client.post(self.url, {"text": "hi"}, format="multipart")

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["bot_message"]["text"], "Reply from the fallback")
        models = [c.kwargs["model"] for c in self.gemini.models.generate_content.call_args_list]
        self.assertEqual(models, ["test-model", "fallback-model"])
        self.assertEqual(Message.objects.get(is_from_user=False).metadata["model"], "fallback-model")

    def test_all_models_overloaded(self):
        self.gemini.models.generate_content.side_effect = gemini_error(503, "UNAVAILABLE")
        res = self.client.post(self.url, {"text": "hi"}, format="multipart")

        self.assertEqual(res.status_code, 502)
        self.assertIn("busy", res.data["error"])
        self.assertEqual(Message.objects.count(), 0)

    def test_bad_request_does_not_try_fallback(self):
        self.gemini.models.generate_content.side_effect = gemini_error(400, "INVALID_ARGUMENT")
        res = self.client.post(self.url, {"text": "hi"}, format="multipart")

        self.assertEqual(res.status_code, 502)
        self.assertEqual(self.gemini.models.generate_content.call_count, 1)

    def test_empty_gemini_reply_gets_fallback_text(self):
        self.gemini.models.generate_content.return_value = gemini_reply(None)
        res = self.client.post(self.url, {"text": "hi"}, format="multipart")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["bot_message"]["text"])

    def test_hourly_limit(self):
        self.gemini.models.generate_content.return_value = gemini_reply("ok")
        for _ in range(5):
            self.assertEqual(self.client.post(self.url, {"text": "x"}, format="multipart").status_code, 201)
        res = self.client.post(self.url, {"text": "x"}, format="multipart")
        self.assertEqual(res.status_code, 429)

    @override_settings(GEMINI_API_KEY=None)
    def test_missing_api_key(self):
        res = self.client.post(self.url, {"text": "hi"}, format="multipart")
        self.assertEqual(res.status_code, 503)

    def test_other_users_chat_is_not_found(self):
        other = User.objects.create_user(username="b@example.com", email="b@example.com")
        chat = ChatSession.objects.create(user=other)
        res = self.client.post(f"/api/chats/{chat.id}/messages/", {"text": "hi"}, format="multipart")
        self.assertEqual(res.status_code, 404)


class HealthTests(TestCase):
    @override_settings(GEMINI_API_KEY="k", GOOGLE_CLIENT_ID="c", DEBUG=True)
    def test_health_reports_booleans_only(self):
        res = self.client.get("/api/health/")
        body = res.json()
        self.assertEqual(res.status_code, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(set(body["checks"]), {"secret_key", "gemini_api_key", "google_client_id", "database", "migrations"})
        self.assertNotIn("k", [v for v in body["checks"].values() if isinstance(v, str)])
