from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import Todo
from .serializers import TodoSerializer, UserRegistrationSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from django.db import models
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = Todo.objects.filter(user=self.request.user)
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(description__icontains=search_query)
            )
        return queryset

    def perform_create(self, serializer):
        try:
            logger.info(f"Creating todo for user {self.request.user.id}")
            todo = serializer.save(user=self.request.user)
            logger.info(f"Todo created successfully: {todo.id}")
            self._notify_task_update('task_created', todo)
        except Exception as e:
            logger.error(f"Error creating todo: {str(e)}")
            raise

    def perform_update(self, serializer):
        try:
            todo = serializer.save()
            self._notify_task_update('task_updated', todo)
        except Exception as e:
            logger.error(f"Error updating todo: {str(e)}")
            raise

    def perform_destroy(self, instance):
        try:
            todo_id = instance.id
            instance.delete()
            self._notify_task_update('task_deleted', todo_id)
        except Exception as e:
            logger.error(f"Error deleting todo: {str(e)}")
            raise

    def _notify_task_update(self, event_type, data):
        try:
            channel_layer = get_channel_layer()
            if event_type == 'task_deleted':
                async_to_sync(channel_layer.group_send)(
                    'tasks',
                    {
                        "type": event_type,
                        "task_id": data
                    }
                )
            else:
                async_to_sync(channel_layer.group_send)(
                    'tasks',
                    {
                        "type": event_type,
                        "task": TodoSerializer(data).data
                    }
                )
        except Exception as e:
            logger.error(f"Error sending WebSocket notification: {str(e)}")
            # Don't raise the exception as this is not critical for the main operation

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST) 