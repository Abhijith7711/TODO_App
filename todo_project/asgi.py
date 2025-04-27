import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter

# Set default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todo_project.settings')

# Setup Django
django.setup()

# Import your websocket application
from todo_project.websocket import websocket_application

# Create the ProtocolTypeRouter
application = ProtocolTypeRouter({
    # HTTP requests go to normal Django ASGI app
    "http": get_asgi_application(),

    # WebSocket requests go to your websocket_application
    "websocket": websocket_application,
})
