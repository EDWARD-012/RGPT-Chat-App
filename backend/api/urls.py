from django.urls import path

from .views import (
    ChatSessionDetailView,
    ChatSessionListCreateView,
    CurrentUserView,
    GoogleLoginView,
    LogoutView,
    MessageListCreateView,
    health,
)

urlpatterns = [
    path("health/", health, name="health"),
    path("auth/google/", GoogleLoginView.as_view(), name="google-login"),
    path("auth/user/", CurrentUserView.as_view(), name="current-user"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    # GET lists the user's chats, POST creates a new one.
    path("chats/", ChatSessionListCreateView.as_view(), name="chat-session-list-create"),
    # GET / PATCH / DELETE a single chat.
    path("chats/<int:pk>/", ChatSessionDetailView.as_view(), name="chat-session-detail"),
    # GET lists messages, POST sends a message and returns the reply.
    path(
        "chats/<int:session_pk>/messages/",
        MessageListCreateView.as_view(),
        name="message-list-create",
    ),
]
