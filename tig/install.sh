#!/bin/sh

sudo apt-get install -y libncurses5-dev libncursesw5-dev
git clone https://github.com/jonas/tig.git /tmp/tig
cd /tmp/tig
make
make install
rm -rf /tmp/tig
