# crawler videos

## install ffmpeg (recommend debian or ubuntu)
sudo apt  install ffmpeg -y

## install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash

## install node.js
nvm install v18.12.1

## clone this repo
git clone https://github.com/smilence86/downloadVideos.git
## install packages
cd downloadVideos

mkdir -p videoList/Adult

npm install

## start download
node index.js

or 

```
cd /path/downloadVideos && nohup node index.js > ~/crawler.log 2>&1 &

tail -f ~/crawler.log

watch -n 1 ls -lh videoList/Adult/
```

## warning
For download speeding up, I recommend you use vpn to download them. please note that your traffic of vpn and your health.
