#!/bin/bash
FQDN="*"

# Create a private key
openssl genrsa \
    -out server-key.pem \
    2048

# Create a certificate signing request
openssl req \
    -new \
    -key server-key.pem \
    -out certificate-signing-request.csr \
    -subj "/C=US/ST=StateL=City/O=Full Name/CN=${FQDN}"

# Sign the certificate signing request to create the server certificate
openssl x509 \
    -req -in certificate-signing-request.csr \
    -signkey server-key.pem \
    -out server-certificate.pem \
    -days 36159
