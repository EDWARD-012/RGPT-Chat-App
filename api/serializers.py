from rest_framework import serializers
from .models import User, ChatSession, Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'profile_picture_url' # <-- ADD THIS LINE
        ]

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages."""
    class Meta:
        model = Message
        fields = ['id', 'text', 'is_from_user', 'timestamp', 'file_upload']
        read_only_fields = ['is_from_user', 'timestamp', 'id']

class ChatSessionListSerializer(serializers.ModelSerializer):
    """Serializer for listing chat sessions."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'title', 'created_at', 'updated_at','pinned']

class ChatSessionDetailSerializer(serializers.ModelSerializer):
    """Serializer for a single chat session with all its messages."""
    user = UserSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True) # Nest all messages

    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'title', 'messages', 'created_at', 'updated_at','pinned']