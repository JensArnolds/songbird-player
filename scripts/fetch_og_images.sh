#!/usr/bin/zsh
# File: scripts/fetch_og_images.sh

curl "http://localhost:3333/api/preview?q=isobel+björk" --output preview-isobel.png 
curl "https://darkfloor.one/api/preview?q=isobel+björk" --output preview-isobel-url.png 

curl -G "http://localhost:3333/api/preview" --data-urlencode "q=isobel björk" --output preview-isobel-encoded.png 
curl -G "https://darkfloor.one/api/preview" --data-urlencode "q=isobel björk" --output preview-isobel-url-encoded.png 


curl "http://localhost:3333/api/preview?q=isobel%20bj%C3%B6rk" --output preview-isobel-fd.png 
curl "https://darkfloor.one/api/preview?q=isobel%20bj%C3%B6rk" --output preview-isobel-url-fd.png 

curl "http://localhost:3333/api/preview" --output preview-default.png 
curl "https://darkfloor.one/api/preview" --output preview-default-url.png 


