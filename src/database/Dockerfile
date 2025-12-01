FROM mongo:7.0

# Default credentials for development; override in compose or environment when needed.
ENV MONGO_INITDB_ROOT_USERNAME=absent \
    MONGO_INITDB_ROOT_PASSWORD=absent \
    MONGO_INITDB_DATABASE=absent

EXPOSE 27017

CMD ["mongod", "--bind_ip_all"]
