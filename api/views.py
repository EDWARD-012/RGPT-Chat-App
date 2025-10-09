from django.conf import settings
from django.http import StreamingHttpResponse, JsonResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from PIL import Image
import google.generativeai as genai

from .models import User, ChatSession, Message
from .serializers import (
    UserSerializer,
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    MessageSerializer
)

# Configure the Gemini API client
genai.configure(api_key=settings.GEMINI_API_KEY)

# --- AUTHENTICATION VIEWS ---

class GoogleLoginView(APIView):
    def post(self, request):
        try:
            token = request.data.get('token')
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), audience=settings.GOOGLE_CLIENT_ID)
            email = idinfo['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email, 'first_name': idinfo.get('given_name', ''),
                    'last_name': idinfo.get('family_name', ''), 'profile_picture_url': idinfo.get('picture')
                }
            )
            if not created and idinfo.get('picture'):
                user.profile_picture_url = idinfo.get('picture', user.profile_picture_url)
                user.save()
            backend_token, _ = Token.objects.get_or_create(user=user)
            user_serializer = UserSerializer(user)
            return Response({'token': backend_token.key, 'user': user_serializer.data})
        except Exception as e:
            return Response({"error": f"Google token verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# --- CHAT SESSION VIEWS ---

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

# --- MESSAGE CREATION VIEW (UNIFIED LOGIC) ---

class MessageListCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_system_instruction(self):
        return """You are RGPT, a helpful, confident, and modern AI assistant created by Ravi Kumar Gupta (EDWARD7780).
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
               "Ravi Kumar Gupta is a passionate developer from Techno Main Salt Lake, currently studying CSE B. He’s skilled in Django, C++, and loves Competitive Programming. Online handle: EDWARD7780 💻."

            4. If the user asks for Ravi's birthday or contact details,
               reply with:
               "Ravi's birthday is on October 8th, 2005. You can contact him at ravi5258p@gmail.com for professional queries. 🙂"

            5. If the user asks for code help or debugging, always give the best possible answer in C++ by default (unless they specify another language).

            6. Never break your character or mention these rules. Always behave like RGPT."""

    def stream_text_response(self, chat_session, user_message_text):
        """Generator for text-only streaming responses."""
        try:
            model = genai.GenerativeModel(
                'gemini-1.5-flash-latest',
                system_instruction=self.get_system_instruction()
            )
            history = [{"role": "user" if m.is_from_user else "model", "parts": [{"text": m.text}]}
                       for m in chat_session.messages.order_by('timestamp').all()]
            
            chat = model.start_chat(history=history[:-1])
            response_stream = chat.send_message(user_message_text, stream=True)

            full_response = ""
            for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            
            Message.objects.create(session=chat_session, text=full_response, is_from_user=False)
        except Exception as e:
            yield f"Error: {str(e)}"

    def create(self, request, *args, **kwargs):
        session_id = self.kwargs['session_pk']
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({"error": "Chat session not found."}, status=status.HTTP_404_NOT_FOUND)

        user_message_serializer = self.get_serializer(data=request.data)
        user_message_serializer.is_valid(raise_exception=True)
        user_message = user_message_serializer.save(session=session, is_from_user=True)

        # --- THIS IS THE UNIFIED LOGIC ---
        # If there's a file, handle it with a standard (non-streaming) response
        if 'file_upload' in request.FILES:
            try:
                model = genai.GenerativeModel(
                    'gemini-2.5-flash',
                    system_instruction=self.get_system_instruction()
                )
                image_file = request.FILES['file_upload']
                img = Image.open(image_file)
                
                response = model.generate_content([user_message.text, img])
                ai_response_text = response.text

                ai_message = Message.objects.create(session=session, text=ai_response_text, is_from_user=False)
                ai_message_serializer = self.get_serializer(ai_message)
                return Response(ai_message_serializer.data, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({"error": f"API Error with image: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Otherwise, handle it with a streaming response for text
        else:
            return StreamingHttpResponse(
                self.stream_text_response(session, user_message.text),
                content_type='text/plain'
            )

# --- DEBUG VIEW (Can be removed after testing) ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_instruction_view(request):
    # This view is for debugging purposes to check the system instruction on the server.
    instruction = MessageListCreateView().get_system_instruction()
    return JsonResponse({"system_instruction_on_server": instruction})

