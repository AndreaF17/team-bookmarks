FROM python:3.9
WORKDIR /opt/bookmarks-api
COPY bookmarks-api/requirements.txt /opt/bookmarks-api/requirements.txt 
RUN pip install --no-cache-dir --upgrade -r /opt/bookmarks-api/requirements.txt
COPY bookmarks-api/app /opt/bookmarks-api/app
CMD ["fastapi", "run", "app/main.py", "--port", "80"]
