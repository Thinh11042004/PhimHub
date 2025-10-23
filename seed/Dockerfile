FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    unzip \
    libunwind8 \
    libicu70 \
    libssl3 \
    krb5-user \
    libkrb5-3 \
    libgssapi-krb5-2 \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install sqlpackage
ENV SQLPACKAGE_VERSION=latest \
    SQLPACKAGE_DIR=/opt/sqlpackage

RUN mkdir -p ${SQLPACKAGE_DIR} \
    && curl -fsSL https://aka.ms/sqlpackage-linux -o /tmp/sqlpackage.zip \
    && unzip /tmp/sqlpackage.zip -d ${SQLPACKAGE_DIR} \
    && chmod +x ${SQLPACKAGE_DIR}/sqlpackage \
    && ln -s ${SQLPACKAGE_DIR}/sqlpackage /usr/local/bin/sqlpackage \
    && rm -f /tmp/sqlpackage.zip

# Install Microsoft mssql-tools18 (sqlcmd)
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/ubuntu/22.04/prod.list \
      | sed 's#^deb \(.*\) https://packages.microsoft.com/#deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/#' \
      | tee /etc/apt/sources.list.d/mssql-release.list > /dev/null \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends mssql-tools18 unixodbc-dev \
    && ln -s /opt/mssql-tools18/bin/sqlcmd /usr/local/bin/sqlcmd \
    && rm -rf /var/lib/apt/lists/*

# Add script
COPY import.sh /usr/local/bin/import.sh
RUN chmod +x /usr/local/bin/import.sh

ENTRYPOINT ["/usr/local/bin/import.sh"]
