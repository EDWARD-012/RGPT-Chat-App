"""
Django settings for the RGPT backend.

Everything that differs between local development and the Vercel deployment
comes from environment variables. See .env.example in the repo root for the
full list.
"""

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Local development reads a .env file from the repo root (or backend/).
# On Vercel the variables come from the project settings instead.
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")


def env_list(name):
    return [item.strip() for item in os.environ.get(name, "").split(",") if item.strip()]


DEBUG = os.environ.get("DJANGO_DEBUG", "").lower() in ("1", "true", "yes")

# Never commit the real key. In production it must come from DJANGO_SECRET_KEY;
# the fallback only exists so manage.py works on a fresh local checkout.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY") or (
    "local-dev-only-not-secret" if DEBUG else ""
)

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "rgpt.edward7780.com",
    # Branch and per-deployment URLs on Vercel.
    ".vercel.app",
    *env_list("DJANGO_ALLOWED_HOSTS"),
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    *env_list("DJANGO_CSRF_TRUSTED_ORIGINS"),
]

# Vercel terminates TLS in front of the function.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# The Google sign-in popup needs to talk back to the opener window.
SECURE_CROSS_ORIGIN_OPENER_POLICY = None


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "rgpt_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "rgpt_backend.wsgi.application"


# Database. Serverless functions have no persistent disk, so production needs
# a hosted Postgres in DATABASE_URL. SQLite is only for local development.
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=int(os.environ.get("DB_CONN_MAX_AGE", "0")),
        conn_health_checks=True,
    )
}
if DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql":
    # Pooled connection strings (pgbouncer in transaction mode) do not
    # support server-side cursors.
    DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static files (only the Django admin uses them). Vercel runs collectstatic
# during the build and serves STATIC_ROOT from its CDN.
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "api.User"

# The frontend is served from the same origin on Vercel, so CORS only matters
# when the Vite dev server talks to Django directly.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    *env_list("CORS_ALLOWED_ORIGINS"),
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# Google sign-in. The frontend already needs VITE_GOOGLE_CLIENT_ID at build
# time, so reuse it when GOOGLE_CLIENT_ID is not set separately.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID") or os.environ.get("VITE_GOOGLE_CLIENT_ID")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
# Also asked when the main model is slow, rate limited or overloaded.
GEMINI_FALLBACK_MODELS = env_list("GEMINI_FALLBACK_MODELS") or ["gemini-3.6-flash", "gemini-3.5-flash-lite"]
# If the first model hasn't started answering after this many seconds, the
# fallbacks are asked too and the first reply wins.
GEMINI_HEDGE_AFTER = float(os.environ.get("GEMINI_HEDGE_AFTER", "5"))
# The SDK waits forever by default. Stop waiting for Gemini after this many
# seconds, well inside Vercel's 60 second function limit.
GEMINI_TOTAL_TIMEOUT = float(os.environ.get("GEMINI_TOTAL_TIMEOUT", "48"))
# Optional, e.g. LOW or MINIMAL for faster replies on models that support it.
GEMINI_THINKING_LEVEL = os.environ.get("GEMINI_THINKING_LEVEL", "").strip().upper() or None

# How many earlier messages from the same chat are sent to Gemini as context.
CHAT_HISTORY_LIMIT = int(os.environ.get("CHAT_HISTORY_LIMIT", "30"))
# Messages one user can send per hour, so a public demo can't drain the API quota.
MESSAGES_PER_HOUR = int(os.environ.get("MESSAGES_PER_HOUR", "40"))
# Vercel rejects request bodies over 4.5 MB, so keep uploads under that.
MAX_IMAGE_BYTES = 4 * 1024 * 1024

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
