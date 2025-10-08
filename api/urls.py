from django.urls import path
from .views import (
    ChatSessionListCreateView,
    ChatSessionDetailView,
    MessageListCreateView,
    GoogleLoginView
)
from .views import create_chat

urlpatterns = [

    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),

    # /api/chats/ -> List user's chats (GET) or create a new chat (POST)
    path('chats/', ChatSessionListCreateView.as_view(), name='chat-session-list-create'),

    # /api/chats/<id>/ -> Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific chat
    path('chats/<int:pk>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),

    # /api/chats/<session_id>/messages/ -> List messages in a chat (GET) or add a new message (POST)
    path('chats/<int:session_pk>/messages/', MessageListCreateView.as_view(), name='message-list-create'),

    path('chats/new/', create_chat, name='create-chat'),

]