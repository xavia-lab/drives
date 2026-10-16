# Use a specific version instead of latest for production stability
FROM ghcr.io/cerbos/cerbos:0.53.0

# Copy your configuration file
COPY ./drives-policy/cerbos.yaml /etc/cerbos/config.yaml

# Copy your policies directory
COPY ./drives-policy/policies /policies

# Cerbos expects the config via the --config flag
ENTRYPOINT ["/cerbos", "server", "--config=/etc/cerbos/config.yaml"]
