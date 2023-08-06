## BUILD ##
## equals node lts
FROM node:18.12-buster AS BUILD


# ARG GITLAB_AUTH_TOKEN
# ENV GITLAB_AUTH_TOKEN $GITLAB_AUTH_TOKEN

# ARG VERSION
# ENV VERSION $VERSION

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

RUN npm ci && npm run build imgrec-ui

## RUN ##
FROM nginx:alpine
COPY /nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=BUILD $APP_HOME/dist/apps/imgrec-ui /usr/share/nginx/html
EXPOSE 80
