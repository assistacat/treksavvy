# build react
FROM node:18 AS react-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# build flask and copy react build
FROM python:3.11-slim
WORKDIR /app/server
COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY server ./

# copy react build into server folder
COPY --from=react-build /app/client/build ../client/build

ENV PORT=5000
EXPOSE 5000

CMD ["python", "app.py"]
