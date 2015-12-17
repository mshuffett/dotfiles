#!/bin/sh

curl -sLo /tmp/hub.tgz https://github.com/github/hub/releases/download/v2.2.2/hub-linux-amd64-2.2.2.tgz
tar -xzf hub.tgz -C /tmp
cd /tmp/hub-linux-amd64-2.2.2/
sudo ./install
