from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from todo.consumers import TaskConsumer

# Define the WebSocket URL patterns
websocket_urlpatterns = [
    re_path(r'^ws/tasks/$', TaskConsumer.as_asgi()),
]

# Define the application
websocket_application = AuthMiddlewareStack(
    URLRouter(websocket_urlpatterns)
) 