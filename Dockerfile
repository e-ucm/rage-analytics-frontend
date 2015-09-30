FROM node

ENV REPO_URL="https://github.com/e-ucm/rage-analytics-frontend" \
    REPO_TAG="master" \
    USER_NAME="user" \
    WORK_DIR="/app"

# setup user, group and workdir
RUN groupadd -r ${USER_NAME} \
    && useradd -r -d ${WORK_DIR} -g ${USER_NAME} ${USER_NAME} \
    && mkdir ${WORK_DIR} \
    && chown ${USER_NAME}:${USER_NAME} ${WORK_DIR}
USER ${USER_NAME}
ENV HOME=${WORK_DIR}
WORKDIR ${WORK_DIR}

# retrieve sources
RUN git clone -b "$REPO_TAG" --single-branch "$REPO_URL" .

# get dependencies sorted out
RUN npm install

# configure & gen apidoc
RUN npm run fast-setup

# expose & run
EXPOSE 3350
CMD [ "npm", "run", "docker-start" ]

# EXPECTS: a2 at 3000
