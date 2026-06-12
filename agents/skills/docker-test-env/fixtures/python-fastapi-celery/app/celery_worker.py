import os
from celery import Celery

celery_app = Celery(
    "app",
    broker=os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0"),
    include=["app.tasks"],
)
