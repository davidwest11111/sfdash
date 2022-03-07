set -e

npm run build

rsync -vrz --delete ./build/ <username>@<host>:<dir>

open <live_url>
