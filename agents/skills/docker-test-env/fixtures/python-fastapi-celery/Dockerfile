FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# Override CMD in docker-compose for the worker service:
#   command: celery -A app.celery_worker worker --loglevel=info
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
