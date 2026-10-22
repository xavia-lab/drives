# syntax=docker/dockerfile:1.7

FROM ghcr.io/cerbos/cerbos:0.56.0

# Production images should not send anonymous telemetry.
ENV CERBOS_NO_TELEMETRY=1

COPY ./drives-policy/cerbos.yaml /etc/cerbos/config.yaml
COPY ./drives-policy/policies /policies

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/cerbos", "healthcheck", "--config=/etc/cerbos/config.yaml"]

ENTRYPOINT ["/cerbos", "server", "--config=/etc/cerbos/config.yaml"]
