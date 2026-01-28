#!/usr/bin/zsh
# File: scripts/fetch_og_images.sh

# Base URLs for local Songbird API and production Songbird API.
# These should be provided via environment variables so we don't hardcode domains:
#   - NEXT_PUBLIC_V2_API_URL

if [ -z "$NEXT_PUBLIC_V2_API_URL" ]; then
  echo "ERROR: Please set NEXT_PUBLIC_V2_API_URL before running this script."
  exit 1
fi

LOCAL_BASE="$NEXT_PUBLIC_V2_API_URL"
PROD_BASE="$NEXT_PUBLIC_V2_API_URL"

curl "${LOCAL_BASE%/}/api/preview?q=isobel+björk" --output preview-isobel.png
curl "${PROD_BASE%/}/api/preview?q=isobel+björk" --output preview-isobel-url.png

curl -G "${LOCAL_BASE%/}/api/preview" --data-urlencode "q=isobel björk" --output preview-isobel-encoded.png
curl -G "${PROD_BASE%/}/api/preview" --data-urlencode "q=isobel björk" --output preview-isobel-url-encoded.png

curl "${LOCAL_BASE%/}/api/preview?q=isobel%20bj%C3%B6rk" --output preview-isobel-fd.png
curl "${PROD_BASE%/}/api/preview?q=isobel%20bj%C3%B6rk" --output preview-isobel-url-fd.png

curl "${LOCAL_BASE%/}/api/preview" --output preview-default.png
curl "${PROD_BASE%/}/api/preview" --output preview-default-url.png

