from django.contrib import admin
from .models import User, ChatSession, Message, MessageFeedback

# Register your models here to make them accessible in the admin panel.
admin.site.register(User)
admin.site.register(ChatSession)
admin.site.register(Message)
admin.site.register(MessageFeedback)