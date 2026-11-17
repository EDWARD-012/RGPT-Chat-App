from rest_framework import serializers

from .models import ChatSession, Message, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "profile_picture_url"]


class MessageSerializer(serializers.ModelSerializer):
    # Uploaded images are passed straight to Gemini and not stored (serverless
    # functions have no persistent disk), so only the file name is kept.
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "text", "is_from_user", "timestamp", "attachment"]
        read_only_fields = fields

    def get_attachment(self, message):
        return (message.metadata or {}).get("attachment")


class ChatSessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ["id", "title", "created_at", "updated_at", "pinned"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ["id", "title", "messages", "created_at", "updated_at", "pinned"]
        read_only_fields = ["id", "messages", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        # The sidebar groups chats by updated_at, so only a new message should
        # move a chat. Saving just these fields leaves updated_at alone when a
        # chat is renamed or pinned.
        instance.save(update_fields=list(validated_data))
        return instance
