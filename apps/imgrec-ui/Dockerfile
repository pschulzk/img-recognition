## BUILD ##
## equals node lts
FROM node:18-bullseye-slim AS BUILD

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

RUN npm ci && npm run build imgrec-ui

## RUN ##
FROM nginx:alpine
COPY $APP_HOME/apps/imgrec-ui/nginx /etc/nginx/nginx.conf
COPY --from=BUILD $APP_HOME/dist/apps/imgrec-ui /usr/share/nginx/html
EXPOSE 80
