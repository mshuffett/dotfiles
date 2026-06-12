from fastapi import FastAPI
from .tasks import add

app = FastAPI(title="fastapi-celery-fixture")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/tasks")
def create_task():
    task = add.delay(1, 2)
    return {"task_id": task.id, "status": "enqueued"}
