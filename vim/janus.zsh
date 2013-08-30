if command -v wget >/dev/null 2>&1; then
  wget -q -O - "https://bit.ly/janus-bootstrap" | bash
else
  curl -Lo- "https://bit.ly/janus-bootstrap" | bash
fi
