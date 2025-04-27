import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Todo
from .serializers import TodoSerializer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)
User = get_user_model()

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get the token from the query string
            query_string = self.scope.get('query_string', b'').decode()
            logger.debug(f"WebSocket connection attempt with query string: {query_string}")
            
            query_params = dict(param.split('=') for param in query_string.split('&') if param)
            token = query_params.get('token', '')
            
            if not token:
                logger.error("No token provided in WebSocket connection")
                await self.close()
                return
            
            # Authenticate the user
            self.user = await self.get_user_from_token(token)
            
            if not self.user:
                logger.error("Failed to authenticate user with token")
                await self.close()
                return
            
            # Create a unique group name for this user
            self.group_name = "tasks"
            
            # Join the user's group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
            logger.info(f"WebSocket connected successfully for user {self.user.id}")
            
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {str(e)}")
            await self.close()
            return

    async def disconnect(self, close_code):
        try:
            # Leave the user's group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f"WebSocket disconnected for user {self.user.id} with code {close_code}")
        except Exception as e:
            logger.error(f"Error in WebSocket disconnect: {str(e)}")

    async def receive(self, text_data):
        try:
            logger.debug(f"Received WebSocket message: {text_data}")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {str(e)}")

    # Task update handlers
    async def task_created(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'task_created',
                'task': event['task']
            }))
            logger.debug(f"Sent task_created event for task {event['task'].get('id')}")
        except Exception as e:
            logger.error(f"Error sending task_created event: {str(e)}")

    async def task_updated(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'task_updated',
                'task': event['task']
            }))
            logger.debug(f"Sent task_updated event for task {event['task'].get('id')}")
        except Exception as e:
            logger.error(f"Error sending task_updated event: {str(e)}")

    async def task_deleted(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'task_deleted',
                'task_id': event['task_id']
            }))
            logger.debug(f"Sent task_deleted event for task {event['task_id']}")
        except Exception as e:
            logger.error(f"Error sending task_deleted event: {str(e)}")
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # Validate the token
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')
            if user_id:
                user = User.objects.get(id=user_id)
                logger.debug(f"Successfully authenticated user {user_id}")
                return user
            else:
                logger.error("No user_id found in token payload")
        except Exception as e:
            logger.error(f"Error authenticating WebSocket: {str(e)}")
        return None 