## BUILD ##
## equals node lts
FROM node:18.12-bullseye-slim AS BUILD

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

RUN npm ci && npm run build imgrec-ui

## RUN ##
FROM nginx:alpine

# Copy the necessary files from the first stage (BUILD) to the second stage (RUN)
COPY --from=BUILD /app/dist/apps/imgrec-ui /usr/share/nginx/html

# Copy the nginx configuration from your local code
COPY apps/imgrec-ui/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
