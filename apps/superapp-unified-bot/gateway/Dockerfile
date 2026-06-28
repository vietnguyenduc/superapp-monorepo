FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    httpx==0.25.2 \
    pydantic==2.5.2

COPY gateway_server.py /app/

EXPOSE 7130

CMD ["uvicorn", "gateway_server:app", "--host", "0.0.0.0", "--port", "7130"]
