from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Custom user model. Inherits fields like username, email, password, etc.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # Automatically updates on save
    profile_picture_url = models.URLField(max_length=255, blank=True, null=True) 

class ChatSession(models.Model):
    """
    A conversation session. Can be linked to a user or be anonymous (guest).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # Automatically updates on save

    pinned = models.BooleanField(default=False)

    # --- NEW: Soft Deletion Fields ---
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # Default ordering for queries: newest updated chats first
        ordering = ['-pinned', '-updated_at']

    def __str__(self):
        username = self.user.username if self.user else "Guest"
        return f'{username} - {self.title}'

class Message(models.Model):
    """
    A single message within a ChatSession. Can contain text and/or a file.
    """
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    is_from_user = models.BooleanField()  # True if from the human user, False if from the AI
    timestamp = models.DateTimeField(auto_now_add=True) # Serves as created_at

    # --- NEW: File Upload and Metadata Fields ---
    file_upload = models.FileField(upload_to='user_uploads/', null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True) # e.g., {'tool_used': 'weather_api'}

    class Meta:
        # Default ordering for messages: oldest first (chronological order)
        ordering = ['timestamp']

    def __str__(self):
        return f'Message in session {self.session.id} at {self.timestamp}'

class MessageFeedback(models.Model):
    """
    Stores user feedback (e.g., thumbs up/down) for a specific AI-generated message.
    """
    class Rating(models.IntegerChoices):
        THUMBS_UP = 1, 'Thumbs Up'
        THUMBS_DOWN = -1, 'Thumbs Down'

    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    rating = models.IntegerField(choices=Rating.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Feedback for Message {self.message.id} -> {self.get_rating_display()}'