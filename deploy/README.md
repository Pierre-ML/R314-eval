# Déploiement sur le VPS

Remplacer `USER`, `VPS_IP` et `DOMAINE.TLD` par vos valeurs.

## 1. Récupérer le code depuis GitHub

```bash
sudo mkdir -p /var/www/R314-eval && sudo chown USER:USER /var/www/R314-eval
git clone https://github.com/<compte>/R314-eval.git /var/www/R314-eval
cd /var/www/R314-eval
curl -fsSL https://bun.sh/install | bash   # si Bun n'est pas installé
bun install
```

## 2. Transférer la BDD locale (depuis le PC)

```bash
ssh USER@VPS_IP "mkdir -p /var/www/R314-eval/data"
scp data/clients.db USER@VPS_IP:/var/www/R314-eval/data/clients.db
```

## 3. Fichier `.env` côté VPS

```bash
cp .env.example .env
```

```env
SQLITE_DB_PATH=./data/clients.db
HOST=127.0.0.1
PORT=3344
```

## 4. Build

```bash
bun run build
```

## 5. Service systemd

```bash
sudo cp deploy/clients.service /etc/systemd/system/clients.service
sudo nano /etc/systemd/system/clients.service     # remplacer USER
sudo systemctl daemon-reload
sudo systemctl enable --now clients
systemctl status clients
curl -I http://127.0.0.1:3344
```

## 6. Apache + certificat

```bash
sudo a2enmod proxy proxy_http headers rewrite
sudo cp deploy/clients.conf /etc/apache2/sites-available/clients.conf
sudo nano /etc/apache2/sites-available/clients.conf   # remplacer DOMAINE.TLD
sudo a2ensite clients
sudo apachectl configtest && sudo systemctl reload apache2
sudo certbot --apache -d clients.DOMAINE.TLD
```

L'enregistrement DNS `clients.DOMAINE.TLD` doit pointer vers l'IP du VPS avant de lancer certbot.

## 7. CI/CD GitHub Actions

Le workflow `.github/workflows/deploy.yml` build le projet puis se connecte au VPS en SSH à chaque push sur `main`.

Secrets à créer dans GitHub (Settings → Secrets and variables → Actions) :

| Secret        | Valeur                                   |
|---------------|------------------------------------------|
| `VPS_HOST`    | IP ou domaine du VPS                     |
| `VPS_USER`    | utilisateur SSH                          |
| `VPS_SSH_KEY` | clé privée SSH (la clé publique dans `~/.ssh/authorized_keys` du VPS) |
| `VPS_PORT`    | port SSH (optionnel, 22 par défaut)      |

Autoriser le redémarrage du service sans mot de passe (`sudo visudo -f /etc/sudoers.d/clients`) :

```
USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart clients
```
