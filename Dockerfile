FROM charman/docker-node-chrome-thrift:latest


# To minimize Docker build time, the steps for installing Chrome and
# building the Thrift compiler (which are commented out below) have
# been moved into the (automatically built) Docker image:
#   charman/docker-node-chrome-thrift:latest
####

# FROM node:latest

# # OPTIONAL: Install dumb-init (Very handy for easier signal handling of SIGINT/SIGTERM/SIGKILL etc.)
# RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb
# RUN dpkg -i dumb-init_*.deb
# ENTRYPOINT ["dumb-init"]

# # Install Google Chrome
# RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
# RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# RUN apt-get update && apt install -y ./google-chrome-stable_current_amd64.deb

# RUN apt-get install -y libboost-dev

# # Install Thrift
# WORKDIR /opt/thrift
# RUN wget http://mirror.cc.columbia.edu/pub/software/apache/thrift/0.12.0/thrift-0.12.0.tar.gz && \
#     tar xvfz thrift-0.12.0.tar.gz
# WORKDIR /opt/thrift/thrift-0.12.0
# RUN ./configure --with-js --without-nodejs --without-c_glib --without-cpp --without-python --without-py3 && \
#     make && \
#     make install

###


# Install Concrete Thrift files to $HOME
WORKDIR /root
RUN git clone https://github.com/hltcoe/concrete


WORKDIR /opt/concrete-js
RUN mkdir dist

COPY Gruntfile.js /opt/concrete-js/
COPY jsdoc.conf.json /opt/concrete-js/
COPY karma.conf.js /opt/concrete-js/
COPY package.json /opt/concrete-js/
COPY src /opt/concrete-js/src/
COPY test /opt/concrete-js/test/

# Force git to use https to work around JHU firewall settings,
RUN git config --global url."https://github.com/".insteadOf git@github.com:
RUN git config --global url."https://".insteadOf git://

RUN npm install
RUN node_modules/grunt/bin/grunt shell:DownloadThriftJS
RUN node_modules/grunt/bin/grunt
RUN node_modules/karma/bin/karma start karma.conf.js --single-run --browsers ChromeCustom --reporters spec
