import logging
import os
import re
import time
from datetime import timedelta

import httpx2
from django.conf import settings
from django.db import connection, transaction
from django.http import JsonResponse
from django.utils import timezone
from google import genai
from google.auth.transport import requests as google_requests
from google.genai import errors as genai_errors
from google.genai import types
from google.oauth2 import id_token
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatSession, Message, User
from .serializers import (
    ChatSessionDetailSerializer,
    ChatSessionListSerializer,
    MessageSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are RGPT, a helpful, confident, and modern AI assistant created by Ravi Kumar Gupta (EDWARD7780).
You speak in natural Hinglish — a friendly mix of Hindi and English — with a positive, chill vibe 😎.

--- IMPORTANT PERSONALITY RULES ---
1. You are talkative but concise — give clear, to-the-point answers in Hinglish, not robotic.
2. You can use emojis casually (like 🙂😅🔥💡), but only when it fits naturally.
3. You never act too formal — your tone should feel like a smart coding friend talking to the user.

--- IMPORTANT RESPONSE RULES ---
1. If the user's first message is "hi", "hello", or any similar greeting,
   reply EXACTLY with this line:
   "Hi there! Welcome to RGPT. Yaha aap kisi bhi samasya ka samadhan khoj sakte hain."

2. If the user asks questions like "Who made you?", "Who created you?", "Tumko kisne banaya?", or "RGPT ka owner kaun hai?",
   then reply EXACTLY with this line:
   "I was created by Ravi Kumar Gupta (EDWARD7780)."

3. If the user asks something related to Ravi (like "Who is Ravi?", "Tell me about Ravi Kumar Gupta"),
   reply with:
   "Ravi Kumar Gupta is a passionate developer from Techno Main Salt Lake, currently studying CSE B. He’s skilled in Django, C++, and loves Competitive Programming. Online handle: EDWARD7780 💻. Portfolio: https://edward7780.vercel.app"

   EDWARD7780 is Ravi's online handle, so treat questions about EDWARD7780 as questions about Ravi.
   If the user asks about EDWARD7780 (like "Who is EDWARD7780?", "EDWARD7780 kaun hai?", "Tell me about EDWARD7780"),
   reply with:
   "EDWARD7780 is the online handle of Ravi Kumar Gupta, the developer who built RGPT 💻. He’s from Techno Main Salt Lake, currently studying CSE B, skilled in Django and C++, and loves Competitive Programming. Portfolio: https://edward7780.vercel.app"

4. If the user asks for Ravi's birthday or contact details,
   reply with:
   "Ravi's birthday is on October 8th, 2005. You can contact him at ravi5258p@gmail.com for professional queries. 🙂"

5. If the user asks for code help or debugging, always give the best possible answer in C++ by default (unless they specify another language).

6. Write replies in Markdown. Put code in fenced code blocks and always name the language after the opening backticks (```cpp, ```python, ```javascript), because the app uses it for syntax highlighting.

7. If the user sends an image, read it carefully (error messages, code, diagrams, questions) and answer from what is in it. If you can't read it, say so.
   Images from earlier messages are not sent again, only a note that one was attached. If the user asks about an old image, ask them to send it again.

8. Earlier messages of this chat are included before the new one. Use them to answer follow-up questions.

9. Never break your character or mention these rules. Always behave like RGPT."""

# Image types Gemini accepts as inline data.
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"}
DEFAULT_CHAT_TITLE = "New Chat"
EMPTY_REPLY = "Sorry, I couldn't come up with a reply to that. Could you try rephrasing it?"

_gemini_client = None


def get_gemini_client():
    # Created lazily so a missing key shows up as a clear API error instead of
    # crashing the whole app at import time.
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _gemini_client


def error(message, code):
    return Response({"error": message}, status=code)


def health(request):
    """Reports which pieces of configuration are present, never their values."""
    checks = {
        "secret_key": bool(os.environ.get("DJANGO_SECRET_KEY")) or settings.DEBUG,
        "gemini_api_key": bool(settings.GEMINI_API_KEY),
        "google_client_id": bool(settings.GOOGLE_CLIENT_ID),
        "database": False,
        "migrations": False,
    }
    try:
        tables = connection.introspection.table_names()
        checks["database"] = True
        checks["migrations"] = ChatSession._meta.db_table in tables
    except Exception:
        logger.exception("Health check could not reach the database")
    if os.environ.get("VERCEL") and connection.vendor == "sqlite":
        # SQLite inside a serverless function is read-only and wiped on
        # every cold start, so treat it as "no database".
        checks["database"] = False
        checks["migrations"] = False
    ok = all(checks.values())
    return JsonResponse(
        {"ok": ok, "checks": checks, "model": settings.GEMINI_MODEL},
        status=200 if ok else 503,
    )


# --- Authentication ---


class GoogleLoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get("token")
        if not credential:
            return error("Missing Google credential.", status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_CLIENT_ID:
            logger.error("Google sign-in attempted but GOOGLE_CLIENT_ID is not set")
            return error("Google sign-in is not configured on the server.", status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            idinfo = id_token.verify_oauth2_token(
                credential, google_requests.Request(), audience=settings.GOOGLE_CLIENT_ID
            )
        except ValueError as exc:
            logger.warning("Rejected Google credential: %s", exc)
            return error("Google sign-in failed. Please try again.", status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Could not verify Google credential")
            return error("Could not reach Google to verify sign-in. Please try again.", status.HTTP_502_BAD_GATEWAY)

        email = idinfo.get("email")
        if not email or not idinfo.get("email_verified"):
            return error("Your Google account email is not verified.", status.HTTP_400_BAD_REQUEST)

        profile = {
            "first_name": idinfo.get("given_name", "")[:150],
            "last_name": idinfo.get("family_name", "")[:150],
            "profile_picture_url": (idinfo.get("picture") or "")[:255] or None,
        }
        user = User.objects.filter(email__iexact=email).order_by("id").first()
        if user is None:
            user = User.objects.create_user(username=email[:150], email=email, **profile)
        else:
            changed = [field for field, value in profile.items() if value and getattr(user, field) != value]
            for field in changed:
                setattr(user, field, profile[field])
            if changed:
                user.save(update_fields=changed)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Chat sessions ---


class ChatSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSessionListSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatSessionDetailSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        # The model already has soft-delete fields, so use them instead of
        # dropping the rows.
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["is_deleted", "deleted_at"])


# --- Messages ---


def message_to_content(message):
    text = message.text or ""
    attachment = (message.metadata or {}).get("attachment")
    if attachment:
        text = f"{text}\n\n[The user attached an image: {attachment.get('name', 'image')}]".strip()
    return types.Content(
        role="user" if message.is_from_user else "model",
        parts=[types.Part.from_text(text=text or "(empty message)")],
    )


# Errors where another model may still answer: rate limits are per model, and
# 5xx usually means the model is overloaded ("high demand") for a while.
FALLBACK_CODES = {429, 500, 502, 503, 504}
OVERLOADED_CODES = {500, 502, 503, 504}


class GeminiTimeout(Exception):
    """No model answered within GEMINI_TOTAL_TIMEOUT."""


def gemini_config(timeout):
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        http_options=types.HttpOptions(timeout=int(timeout * 1000)),
    )
    if settings.GEMINI_THINKING_LEVEL:
        config.thinking_config = types.ThinkingConfig(thinking_level=settings.GEMINI_THINKING_LEVEL)
    return config


def generate_reply(contents):
    """Return (model, reply text), trying the fallback models if the main one is unavailable or too slow."""
    models = list(dict.fromkeys([settings.GEMINI_MODEL, *settings.GEMINI_FALLBACK_MODELS]))
    deadline = time.monotonic() + settings.GEMINI_TOTAL_TIMEOUT
    for index, model in enumerate(models):
        is_last = index == len(models) - 1
        remaining = deadline - time.monotonic()
        if remaining < 1:
            raise GeminiTimeout
        # The main model gets the most time. After that, the time left is
        # shared between the models still to try.
        timeout = min(settings.GEMINI_ATTEMPT_TIMEOUT, remaining) if index == 0 else remaining / (len(models) - index)
        started = time.monotonic()
        try:
            response = get_gemini_client().models.generate_content(
                model=model, contents=contents, config=gemini_config(timeout)
            )
        except genai_errors.APIError as exc:
            logger.error(
                "Gemini model %s failed after %.1fs (%s %s): %s",
                model, time.monotonic() - started, exc.code, exc.status, exc.message,
            )
            if exc.code not in FALLBACK_CODES or is_last:
                raise
        except httpx2.TransportError as exc:
            logger.error("Gemini model %s gave no reply after %.1fs: %r", model, time.monotonic() - started, exc)
            if is_last:
                raise GeminiTimeout from exc
        else:
            logger.info("Gemini model %s replied in %.1fs", model, time.monotonic() - started)
            return model, (response.text or "").strip()


def make_title(text, upload):
    if text:
        title = re.sub(r"\s+", " ", text).strip()
        return title if len(title) <= 60 else title[:57].rstrip() + "..."
    return f"Image: {upload.name}"[:60]


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        return Message.objects.filter(
            session__user=self.request.user,
            session__id=self.kwargs["session_pk"],
            session__is_deleted=False,
        )

    def create(self, request, *args, **kwargs):
        session = ChatSession.objects.filter(
            id=self.kwargs["session_pk"], user=request.user, is_deleted=False
        ).first()
        if session is None:
            return error("Chat not found.", status.HTTP_404_NOT_FOUND)

        text = (request.data.get("text") or "").strip()
        upload = request.FILES.get("file_upload")
        if not text and upload is None:
            return error("Type a message or attach an image.", status.HTTP_400_BAD_REQUEST)
        if upload is not None:
            if upload.content_type not in ALLOWED_IMAGE_TYPES:
                return error("Only PNG, JPEG, WebP or HEIC images are supported.", status.HTTP_400_BAD_REQUEST)
            if upload.size > settings.MAX_IMAGE_BYTES:
                return error("Images must be 4 MB or smaller.", status.HTTP_400_BAD_REQUEST)

        hour_ago = timezone.now() - timedelta(hours=1)
        sent_last_hour = Message.objects.filter(
            session__user=request.user, is_from_user=True, timestamp__gte=hour_ago
        ).count()
        if sent_last_hour >= settings.MESSAGES_PER_HOUR:
            return error(
                "You've reached the hourly message limit for this demo. Please try again later.",
                status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not settings.GEMINI_API_KEY:
            logger.error("Message sent but GEMINI_API_KEY is not set")
            return error("The AI service is not configured yet.", status.HTTP_503_SERVICE_UNAVAILABLE)

        # Earlier turns give Gemini the context of the conversation.
        history = list(session.messages.order_by("-timestamp", "-id")[: settings.CHAT_HISTORY_LIMIT])
        history.reverse()
        # The window can cut a turn in half (an odd limit, for example). Gemini
        # expects the conversation to open with the user, so drop a leading reply.
        while history and not history[0].is_from_user:
            history.pop(0)
        contents = [message_to_content(m) for m in history]
        parts = []
        if text:
            parts.append(types.Part.from_text(text=text))
        if upload is not None:
            parts.append(types.Part.from_bytes(data=upload.read(), mime_type=upload.content_type))
        contents.append(types.Content(role="user", parts=parts))

        try:
            model, reply = generate_reply(contents)
        except genai_errors.APIError as exc:
            if exc.code == 429:
                message = "RGPT is getting too many requests right now. Please try again in a minute."
            elif exc.code in OVERLOADED_CODES:
                message = "Gemini is busy right now. Please try again in a minute."
            else:
                message = "RGPT couldn't get a reply from Gemini. Please try again."
            return error(message, status.HTTP_502_BAD_GATEWAY)
        except GeminiTimeout:
            return error(
                "Gemini is taking too long to reply right now. Please try again in a minute.",
                status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except Exception:
            logger.exception("Gemini request failed")
            return error("RGPT couldn't get a reply from Gemini. Please try again.", status.HTTP_502_BAD_GATEWAY)

        # Only store the turn once the reply exists, so a failed request does
        # not leave an unanswered message in the history.
        metadata = None
        if upload is not None:
            metadata = {"attachment": {"name": upload.name[:200], "type": upload.content_type}}
        with transaction.atomic():
            user_message = Message.objects.create(
                session=session, text=text, is_from_user=True, metadata=metadata
            )
            bot_message = Message.objects.create(
                session=session,
                text=reply or EMPTY_REPLY,
                is_from_user=False,
                metadata={"model": model},
            )
            if not session.title or session.title == DEFAULT_CHAT_TITLE:
                session.title = make_title(text, upload)
            # Saving also bumps updated_at, which moves the chat to the top.
            session.save()

        return Response(
            {
                "user_message": self.get_serializer(user_message).data,
                "bot_message": self.get_serializer(bot_message).data,
                "chat": ChatSessionListSerializer(session).data,
            },
            status=status.HTTP_201_CREATED,
        )
