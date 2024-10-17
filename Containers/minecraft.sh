#!/bin/bash
# start the minecraft server

#get the current directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

NAME=minecraft-paper-test
VOLUME=$DIR/minecraft_paper/data

#do nothing if the container is already running
docker ps | grep $NAME && exit

#TAG=latest
TAG=java21

#removed: --rm for autoremove
#    -e VERSION=1.20.1 \


docker run -d -it -p 26565:25565 -p 26575:25575\
    -e EULA=TRUE \
    -e MEMORY=2G \
    -e ONLINE_MODE=FALSE \
    -e SPAWN_PROTECTION=0 \
    -e MODE=creative \
    -e OPS=aibot,dzikapantera \
    -e TYPE=PAPER \
    -e PLUGINS=https://github.com/ViaVersion/ViaVersion/releases/download/5.0.5/ViaVersion-5.0.5.jar,https://github.com/ViaVersion/ViaBackwards/releases/download/5.0.4/ViaBackwards-5.0.4.jar \
    --name $NAME \
    --restart=always \
    -v $VOLUME:/data docker.io/itzg/minecraft-server:$TAG