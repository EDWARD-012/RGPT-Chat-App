from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import ChatSession, Message
from .serializers import (
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    MessageSerializer
)
import google.generativeai as genai
from PIL import Image # <-- Import the Image library

# Add these imports at the top
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import User

from .serializers import UserSerializer 

# Configure the Gemini API client
genai.configure(api_key=settings.GEMINI_API_KEY)

# --- Chat Session Views (no changes here) ---

class ChatSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSessionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user, is_deleted=False)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatSessionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user, is_deleted=False)

# --- Message View (with NEW Image Handling Logic) ---

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        session_id = self.kwargs['session_pk']
        return Message.objects.filter(session__user=self.request.user, session__id=session_id)

    def create(self, request, *args, **kwargs):
        session_id = self.kwargs['session_pk']
        try:
            session = ChatSession.objects.get(id=session_id, user=self.request.user)
        except ChatSession.DoesNotExist:
            return Response({"error": "Chat session not found."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Save the user's message (and file if it exists)
        user_message_serializer = self.get_serializer(data=request.data)
        user_message_serializer.is_valid(raise_exception=True)
        user_message = user_message_serializer.save(session=session, is_from_user=True)

        # 2. Prepare content for Gemini (Text and/or Image)
        model = genai.GenerativeModel('gemini-2.5-flash') # Use a model that supports vision
        
        # --- NEW: Image handling logic ---
        try:
            gemini_content = []
            if user_message.text:
                gemini_content.append(user_message.text)
            
            if 'file_upload' in request.FILES:
                image_file = request.FILES['file_upload']
                img = Image.open(image_file)
                gemini_content.append(img)
            
            if not gemini_content:
                 return Response({"error": "No text or image provided."}, status=status.HTTP_400_BAD_REQUEST)
            
            # 3. Call the Gemini API with the content
            response = model.generate_content(gemini_content)
            ai_response_text = response.text
        
        except Exception as e:
            return Response({"error": f"API Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 4. Save the AI's response
        ai_message = Message.objects.create(
            session=session,
            text=ai_response_text,
            is_from_user=False
        )

        # 5. Return the AI's response to the frontend
        ai_message_serializer = self.get_serializer(ai_message)
        return Response(ai_message_serializer.data, status=status.HTTP_201_CREATED)
    
class GoogleLoginView(APIView):
    def post(self, request):
        try:
            token = request.data.get('token')
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())

            email = idinfo['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': idinfo.get('given_name', ''),
                    'last_name': idinfo.get('family_name', ''),
                    'profile_picture_url': idinfo.get('picture', None) # <-- SAVE PICTURE URL
                }
            )
            
            # Update picture URL for existing users as well
            if not created and idinfo.get('picture'):
                user.profile_picture_url = idinfo.get('picture')
                user.save()

            backend_token, _ = Token.objects.get_or_create(user=user)
            user_serializer = UserSerializer(user)

            # Return both the token and the serialized user data
            return Response({
                'token': backend_token.key,
                'user': user_serializer.data
            })

        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatSession
# views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat(request):
    chat = ChatSession.objects.create(user=request.user, title="New Chat")
    return Response({"id": chat.id})
