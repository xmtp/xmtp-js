FROM ghcr.io/shopify/toxiproxy:2.12.0

COPY dev/toxiproxy/config.json /etc/toxiproxy/config.json

ENTRYPOINT [ "/toxiproxy"]
CMD ["-host=0.0.0.0", "-config=/etc/toxiproxy/config.json"]
