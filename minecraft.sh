#!/bin/bash
# start the minecraft server

NAME=minecraft-paper
#VOLUME=$HOME/Containers/data/minecraft
VOLUME=$HOME/Containers/minecraft_paper/data/minecraft

#do nothing if the container is already running
docker ps | grep $NAME && exit

#TAG=latest
TAG=java21

#removed: --rm for autoremove
docker run -d -it -p 26565:25565 -p 26575:25575\
    -e EULA=TRUE \
    -e MEMORY=2G \
    -e TYPE=PAPER \
    -e SPAWN_PROTECTION=0 \
    -e PLUGINS=https://github.com/ViaVersion/ViaVersion/releases/download/5.0.3/ViaVersion-5.0.3.jar,https://github.com/ViaVersion/ViaBackwards/releases/download/5.0.3/ViaBackwards-5.0.3.jar \
    --name $NAME \
    --restart=always \
    -v $VOLUME:/data docker.io/itzg/minecraft-server:$TAG