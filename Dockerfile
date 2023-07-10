FROM ccmaymay/concrete-js-base:thrift-5674

RUN git clone https://github.com/hltcoe/concrete /opt/concrete

WORKDIR /opt/concrete-js
ADD . /opt/concrete-js

# Force git to use https to work around JHU firewall settings,
RUN git config --global url."https://github.com/".insteadOf git@github.com:
RUN git config --global url."https://".insteadOf git://

RUN npm ci
RUN npx grunt shell:DownloadThriftJS
RUN npx grunt
