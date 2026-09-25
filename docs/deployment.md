# Deployment runbook

Fresh VPS setup for brendatama.dev (Sumopod, Ubuntu 24.04, 2 vCPU / 2 GB / 40 GB).

## Architecture

```
Browser ──HTTPS──▶ Cloudflare edge ──Cloudflare Tunnel (outbound from VPS)──▶ cloudflared container
                                                                                  │ docker network
                        www.brendatama.dev / brendatama.dev ──▶ web:3000  (Astro SSR)
                        api.brendatama.dev                  ──▶ server:3001 (Hono + SQLite)
                        admin.brendatama.dev                ──▶ admin:3000 (SvelteKit)
```

- **No inbound ports except SSH.** The VPS dials out to Cloudflare, so there's no nginx, no certbot and no ports 80/443 open. The origin IP is never exposed through DNS.
- **Images are built in GitHub Actions** and pushed to GHCR (`ghcr.io/brendatamaar/portfolio-{server,web,admin}`). The VPS only pulls them, so there are no builds on 2 GB of RAM and no source checkout on the server.
- **State** lives in two host folders: `~/portfolio/data` (SQLite) and `~/portfolio/uploads` (images). Back up those two folders.

Replace `VPS_IP` below with your server's IP. Commands marked **(local)** run on your Windows machine in PowerShell. Everything else runs on the VPS.

---

## 1. First login and SSH key

**(local)** Create an SSH key if you don't have one yet, then copy it to the server:

```powershell
ssh-keygen -t ed25519            # press Enter to accept defaults
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@VPS_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
ssh root@VPS_IP
```

Check the CPU architecture. The images are built for `x86_64`:

```bash
uname -m
```

## 2. System update and `deploy` user

```bash
apt update && apt -y full-upgrade
timedatectl set-timezone Asia/Jakarta

adduser --gecos "" deploy                # set a password (used for sudo)
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
```

**(local)**: in a **new** terminal, confirm `ssh deploy@VPS_IP` works **before** continuing.

## 3. Harden SSH

The file is named `00-…` on purpose. sshd uses the _first_ value it reads, and Ubuntu's `50-cloud-init.conf` may turn password login back on.

```bash
cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
sshd -t && systemctl restart ssh
```

Keep the root session open. **(local)** Check that `ssh deploy@VPS_IP` still works and `ssh root@VPS_IP` is refused. Then close the root session and do everything from here on as `deploy`.

## 4. Firewall, fail2ban, automatic security updates

```bash
sudo ufw allow OpenSSH
sudo ufw --force enable
sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades   # answer "Yes"
```

## 5. Swap (2 GB RAM needs it)

```bash
swapon --show                      # skip this section if swap already exists
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl --system
```

## 6. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
exit                               # log out and back in so the docker group applies
```

```bash
docker run --rm hello-world
docker compose version
```

## 7. App directory

The containers run as uid/gid `1000`, so the data folders must belong to it:

```bash
mkdir -p ~/portfolio/data ~/portfolio/uploads
sudo chown -R 1000:1000 ~/portfolio/data ~/portfolio/uploads
```

Create `~/portfolio/.env` (same content as `.env.example` in the repo). You'll get the tunnel token in step 8:

```bash
cat > ~/portfolio/.env <<'EOF'
CLOUDFLARE_TUNNEL_TOKEN=PASTE_TOKEN_HERE
CORS_ORIGINS=https://www.brendatama.dev,https://admin.brendatama.dev
COOKIE_DOMAIN=.brendatama.dev
ADMIN_ORIGIN=https://admin.brendatama.dev
EOF
chmod 600 ~/portfolio/.env
```

## 8. Cloudflare

1. **Check the domain is on Cloudflare.** In the dashboard, `brendatama.dev` should show as _Active_. If it doesn't, add the site and switch the nameservers at your registrar to the ones Cloudflare gives you.
2. **Delete the old DNS records** (DNS → Records): the `A`/`AAAA`/`CNAME` records for `@`, `www`, `api` and `admin` that point at the dead VPS. The tunnel creates new ones.
3. **Create the tunnel**: Zero Trust → Networks → Tunnels → _Create a tunnel_ → _Cloudflared_ → name it `portfolio` → on the install screen pick _Docker_, and copy the long token after `--token`. Put it in `~/portfolio/.env` as `CLOUDFLARE_TUNNEL_TOKEN` (`nano ~/portfolio/.env`).
4. **Add public hostnames** (the tunnel's _Public Hostname_ / _Published application routes_ tab). Service type is **HTTP** for all four:

   | Subdomain | Domain         | Service URL   |
   | --------- | -------------- | ------------- |
   | `www`     | brendatama.dev | `web:3000`    |
   | _(empty)_ | brendatama.dev | `web:3000`    |
   | `api`     | brendatama.dev | `server:3001` |
   | `admin`   | brendatama.dev | `admin:3000`  |

5. **Redirect apex → www**: Rules → _Redirect Rules_ → _Create from template_ → "Redirect from root to WWW" (301, preserve query string).
6. **SSL/TLS** → Edge Certificates: turn on _Always Use HTTPS_, set _Minimum TLS_ to 1.2.
7. _(Recommended)_ **Protect the admin login page**: Zero Trust → Access → Applications → _Self-hosted_ → `admin.brendatama.dev`, with a policy allowing only your email (one-time PIN). This is free and puts a second login in front of the CMS.

## 9. GitHub Actions

**(local)** Create a dedicated deploy key and install its public half on the VPS:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\portfolio_deploy -N '""' -C "github-actions-deploy"
type $env:USERPROFILE\.ssh\portfolio_deploy.pub | ssh deploy@VPS_IP "cat >> ~/.ssh/authorized_keys"
```

In the repo: Settings → Secrets and variables → Actions → set these **repository secrets**:

| Secret        | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| `VPS_HOST`    | the VPS IP                                                           |
| `VPS_USER`    | `deploy`                                                             |
| `VPS_SSH_KEY` | full contents of `%USERPROFILE%\.ssh\portfolio_deploy` (private key) |

Then deploy: push to `main`, or go to Actions → _CI & Deploy_ → _Run workflow_ on `main`. The workflow:

1. validates (typecheck + build),
2. builds the 3 images and pushes them to GHCR tagged `latest` and `<commit sha>`,
3. copies `docker-compose.yml` to `~/portfolio`, backs up the DB, pulls, restarts, and waits for health checks.

GHCR login on the VPS uses the workflow's short-lived `GITHUB_TOKEN`, so no long-lived registry credentials are stored on the server.

## 10. Initialize the data

The old server's data is gone, so start clean:

```bash
cd ~/portfolio
docker compose ps                                                # all services "healthy"/"running"
docker compose exec -it server bun run server/scripts/setup.ts   # create the admin user
docker compose exec server bun run server/scripts/seed-resume.ts # resume/profile/projects
```

⚠️ `seed-resume.ts` **deletes and re-inserts** the resume tables. Run it once, and don't run it again after you've edited the resume in the admin.

**If you find an old backup** (`app.db` and/or an `uploads` folder), restore it instead of running the two commands above:

```powershell
# (local)
scp .\app.db deploy@VPS_IP:~/portfolio/
scp -r .\uploads\* deploy@VPS_IP:~/portfolio/uploads/
```

```bash
cd ~/portfolio
docker compose stop server
rm -f data/app.db-wal data/app.db-shm
sudo mv app.db data/app.db
sudo chown -R 1000:1000 data uploads
docker compose up -d --wait
```

## 11. Verify

```bash
curl -sI https://www.brendatama.dev | head -1          # 200
curl -sI https://brendatama.dev | grep -i location     # → https://www.brendatama.dev/
curl -s  https://api.brendatama.dev/api/health         # {"ok":true}
curl -sI https://admin.brendatama.dev/login | head -1  # 200 (or Access login if enabled)
```

In a browser: home page, blog, dark-mode toggle, **admin login** (the cookie must be set on `.brendatama.dev`), create a draft post, upload an image and check it shows up on the site.

## 12. Backups

The database gets snapshotted on every deploy and should also be backed up nightly. `crontab -e` as `deploy`:

```cron
0 3 * * * cd ~/portfolio && docker compose exec -T server bun run server/scripts/backup-db.ts >> ~/portfolio/backup.log 2>&1
```

That keeps the last 7 snapshots in `~/portfolio/data/backups/`, **on the same disk**. The last server died with its data, so also keep an off-server copy.

**Option A: Cloudflare R2** (free tier: 10 GB). Create an R2 bucket `portfolio-backups` and an R2 API token, then:

```bash
sudo apt install -y rclone
rclone config    # n → name "r2" → type "s3" → provider "Cloudflare" → access key/secret → endpoint https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

```cron
30 3 * * * rclone sync ~/portfolio/data/backups r2:portfolio-backups/db && rclone copy ~/portfolio/uploads r2:portfolio-backups/uploads
```

**Option B: pull a copy to your laptop now and then** (local):

```powershell
scp -r deploy@VPS_IP:~/portfolio/data/backups .\portfolio-backups\
scp -r deploy@VPS_IP:~/portfolio/uploads .\portfolio-backups\
```

---

## Day-to-day operations

```bash
cd ~/portfolio
docker compose ps                         # status + health
docker compose logs -f --tail=100 server  # logs (server | web | admin | cloudflared)
docker compose restart web                # restart one service
docker stats --no-stream                  # memory usage
```

**Roll back** to an earlier build: find the commit SHA on GitHub, then re-run that commit's workflow (Actions → run → _Re-run all jobs_). Alternatively, on the VPS (needs a GitHub PAT with `read:packages` if the image is no longer cached locally):

```bash
echo <PAT> | docker login ghcr.io -u brendatamaar --password-stdin
IMAGE_TAG=<sha> docker compose up -d --wait
sed -i '/^IMAGE_TAG=/d' .env && echo "IMAGE_TAG=<sha>" >> .env
docker logout ghcr.io
```

**Reset the admin password**: `docker compose exec -it server bun run server/scripts/setup.ts` (use the same username).

**Update cloudflared**: `docker compose pull cloudflared && docker compose up -d cloudflared`.

**Local image build** (no GHCR): `docker compose -f docker-compose.yml -f docker-compose.build.yml up --build`.
