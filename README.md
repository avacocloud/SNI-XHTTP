# SNI-XHTTP


> ⚠️ **هشدار مهم:** دوستان لطفاً این پروژه رو فورک نکنید. دفعه‌ی قبل روی فورک پروژه لو رفتیم. لطفاً فقط استفاده کنید و فورک نکنید.

### 🇮🇷 راهنمای کامل فارسی — Complete Persian Setup Guide

[![Telegram Channel](https://img.shields.io/badge/Telegram-%40avaco__cloud-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/avaco_cloud)

> 📢 **کانال تلگرام Avaco Cloud** — برای آموزش‌های بیشتر، آپدیت‌ها، روش‌های دور زدن سانسور و کانفیگ‌های جدید عضو شو:
> 
> 👉 **[https://t.me/avaco_cloud](https://t.me/avaco_cloud)**

A minimal relay running on **Vercel Edge Functions** that forwards **XHTTP** traffic from your Xray/V2Ray client to your backend Xray server. The goal: use Vercel's global edge network and the `*.vercel.app` domain as a front to hide the real IP of your origin server.

> **v1.0 — Edge Runtime:** uses Vercel Edge Runtime (V8 isolates) with native streaming support. Lightweight, low cold-start latency.

---

## فهرست

- [این پروژه برای کیه؟](#این-پروژه-برای-کیه)
- [نحوه‌ی کار (معماری)](#نحوه‌ی-کار-معماری)
- [محدودیت‌ها و هشدارها](#محدودیت‌ها-و-هشدارها)
- [پیش‌نیازها](#پیش‌نیازها)
- [مرحله ۱ — خرید VPS](#مرحله-۱--خرید-vps)
- [مرحله ۲ — تنظیم دامنه و DNS](#مرحله-۲--تنظیم-دامنه-و-dns)
- [مرحله ۳ — اتصال SSH به VPS](#مرحله-۳--اتصال-ssh-به-vps)
- [مرحله ۴ — نصب Xray](#مرحله-۴--نصب-xray)
- [مرحله ۵ — گرفتن TLS Certificate](#مرحله-۵--گرفتن-tls-certificate)
- [مرحله ۶ — کانفیگ Xray با XHTTP](#مرحله-۶--کانفیگ-xray-با-xhttp)
- [مرحله ۷ — Deploy روی Vercel](#مرحله-۷--deploy-روی-vercel)
- [مرحله ۸ — کانفیگ کلاینت](#مرحله-۸--کانفیگ-کلاینت)
- [محدودیت‌های Vercel](#محدودیت‌های-vercel)
- [نکته درباره بهینه‌سازی هزینه](#نکته-درباره-بهینه‌سازی-هزینه)
- [عیب‌یابی](#عیب‌یابی)
- [سوالات متداول](#سوالات-متداول)

---

## این پروژه برای کیه؟

این پروژه فقط زمانی به دردت می‌خوره که **خودت یک سرور Xray با XHTTP داری** و می‌خوای IP اون رو با Vercel استتار کنی.

❌ **به دردت نمی‌خوره** اگر:
- فقط یه کانفیگ آماده (vless/vmess) از فروشنده گرفتی
- کانفیگت WebSocket / gRPC / Reality / Trojan / TCP هست
- می‌خوای بدون VPS فقط با Vercel پروکسی بسازی
- **ترافیک سنگین** داری (استریم 4K، دانلود حجیم، torrent، چندکاربره) — چون **Fast Origin Transfer در Hobby خیلی زود تموم می‌شه** و حساب Pause می‌شه

✅ **به دردت می‌خوره** اگر:
- VPS داری یا می‌خوای بگیری
- می‌خوای transport رو **XHTTP** بذاری
- می‌خوای IP سرورت پنهان بمونه
- استفاده‌ی **شخصی و سبک** می‌کنی (چت، مرور وب، ویدیو تا 1080p، موزیک)
- یا حاضری برای ترافیک سنگین پلن **Pro** بگیری

---

## نحوه‌ی کار (معماری)

```
┌──────────┐  TLS, SNI=vercel.com   ┌──────────────┐  HTTP/2   ┌──────────────┐
│  کلاینت   │ ─────────────────────► │ Vercel Edge  │ ────────► │  سرور Xray   │
│ (v2rayN/  │      XHTTP request     │  (relay)     │  forward  │ XHTTP inbound│
│  Hiddify) │                        │              │           │              │
└──────────┘                        └──────────────┘            └──────────────┘
```

1. کلاینت با SNI=`vercel.com` به دامنه‌ی Vercel وصل می‌شه. برای سانسورچی شبیه ترافیک عادی Vercel به‌نظر می‌رسه.
2. Vercel Serverless Function بدنه‌ی request رو **stream** می‌کنه به سرور Xray.
3. پاسخ هم به همون صورت stream می‌شه برمی‌گرده.

---

## محدودیت‌ها و هشدارها

🔴 **هشدار مهم — Fast Origin Transfer:** در پلن Hobby هر بایت ترافیک **دو بار** شمرده می‌شه (یک‌بار کلاینت↔Vercel و یک‌بار Vercel↔سرور). اگه سهمیه تموم بشه، Vercel اکانتت رو **Pause می‌کنه**، کاربرا دیگه نمی‌تونن وصل بشن و **۳۰ روز** باید صبر کنی یا Pro بخری. جزئیات در بخش [محدودیت‌های Vercel](#محدودیت‌های-vercel).

⚠️ **فقط XHTTP**: WebSocket, gRPC, TCP, mKCP, QUIC و Reality روی Vercel Edge کار **نمی‌کنه** (محدودیت runtime).

⚠️ **TOS Vercel**: استفاده‌ی proxy ممکنه TOS رو نقض کنه. اگه ترافیک بالا باشه، اکانتت ممکنه suspend بشه. ترافیک رو متعادل نگه دار.

⚠️ **آموزشی**: این repo برای آموزش و تست شخصیه، نه production. هیچ SLA و پشتیبانی نداره.

### 💡 توصیه‌های مصرف پایدار

برای جلوگیری از قطع شدن اتصال در وسط ماه:

- 📊 **Dashboard → Usage** رو **هفتگی** چک کن (Vercel هنگام ۸۰٪ و ۱۰۰٪ ایمیل می‌فرسته)
- 🔄 **چند پروژه Hobby** با چند اکانت Gmail بساز و در کلاینت به‌صورت **Load Balance / Failover** تنظیم کن
- ⏸ ویدیوهای 4K و دانلودهای حجیم رو از پروکسی **خارج** کن (مستقیم یا از پروکسی دیگه)
- 💳 اگه ترافیک زیاد داری، **Pro ($20/ماه)** بگیر و با **Spend Management** سقف هزینه بذار

---

## پیش‌نیازها

| مورد | توضیح |
|---|---|
| **VPS** | یک سرور لینوکس خارج از ایران با IP عمومی (ترجیحاً Ubuntu 22.04 یا 24.04) |
| **دامنه** | یک دامنه (پولی یا رایگان مثل DuckDNS) که A record اون به IP سرور اشاره کنه |
| **اکانت Vercel** | رایگان از [vercel.com](https://vercel.com) |
| **Node.js + npm** | روی سیستم محلی برای Vercel CLI (می‌تونی از داشبورد هم deploy کنی) |
| **اکانت GitHub** | اختیاری، اگه از روش Dashboard استفاده می‌کنی |

### ابزارهای لازم بر اساس سیستم‌عامل

این راهنما هم برای **ویندوز** و هم **مک/لینوکس** نوشته شده. در هر مرحله بسته به OS خودت دستورات معادل رو می‌بینی.

#### 🪟 ویندوز (Windows 10/11)

همه‌ی ابزارهای زیر **رایگان** هستن:

| ابزار | لینک نصب | کاربرد |
|---|---|---|
| **PowerShell** | از قبل نصبه (در منوی Start جستجو کن) | اجرای دستورات |
| **OpenSSH Client** | از قبل در Win10/11 نصبه ([راهنما](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse)) | اتصال SSH |
| **Git for Windows** | [git-scm.com/download/win](https://git-scm.com/download/win) | git + Git Bash |
| **Node.js LTS** | [nodejs.org](https://nodejs.org) — installer رو دانلود و Next-Next-Finish | برای Vercel CLI |
| **PuTTY** (اختیاری) | [putty.org](https://www.putty.org/) | جایگزین SSH با GUI |

> 💡 **توصیه:** بعد از نصب Git for Windows از **Git Bash** استفاده کن، چون دستورات یونیکسی (مثل `curl`, `ssh`, `cat`) داخلش طبیعی کار می‌کنن. این راهنما رو راحت‌تر می‌کنه.

#### 🍎 مک / 🐧 لینوکس

| ابزار | روش نصب |
|---|---|
| **Terminal** | از قبل نصبه |
| **ssh, curl, dig** | از قبل نصبن |
| **Homebrew** (Mac) | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| **Node.js** | `brew install node` (Mac) یا `apt install nodejs npm` (Linux) |
| **Git** | `brew install git` (Mac) یا `apt install git` (Linux) |

---

## مرحله ۱ — خرید VPS

### پیشنهادها

| ارائه‌دهنده | قیمت ماهانه | لوکیشن پیشنهادی |
|---|---|---|
| **Hetzner** | ~€4.5 | Frankfurt / Helsinki |
| **Contabo** | ~$4.5 | EU / US |
| **Vultr** | $5-6 | EU / US |
| **DigitalOcean** | $6 | متعدد |

### مشخصات حداقلی
- RAM: ۱ GB
- CPU: ۱ vCPU
- Disk: ۲۰ GB SSD
- Bandwidth: حداقل ۱ TB/ماه
- OS: **Ubuntu 22.04** یا **24.04**

پس از خرید، **IP عمومی** و **رمز SSH** رو از داشبورد بگیر.

---

## مرحله ۲ — تنظیم دامنه و DNS

### اگه دامنه نداری
- پولی: [Namecheap](https://www.namecheap.com), [Porkbun](https://porkbun.com), [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)
- رایگان: [DuckDNS](https://www.duckdns.org/)

### تنظیم A Record (در Cloudflare)

1. وارد [dash.cloudflare.com](https://dash.cloudflare.com) شو
2. روی دامنه‌ت کلیک کن → منوی **DNS → Records**
3. **Add record**:

| فیلد | مقدار |
|---|---|
| **Type** | `A` |
| **Name** | `xray` (یا هر چیز دلخواه — می‌شه `xray.yourdomain.com`) |
| **IPv4 address** | IP عمومی VPS تو (مثلاً `203.0.113.45`) |
| **Proxy status** | ⚫ **DNS only** (خاکستری، **نه** نارنجی) |
| **TTL** | `Auto` |

> 🔴 **Proxy status حتماً DNS only باشه**. اگه Proxied بذاری، Cloudflare وسط ترافیک قرار می‌گیره و کار نمی‌کنه.

### تست DNS

**🍎 Mac / 🐧 Linux:**
```bash
dig @8.8.8.8 xray.yourdomain.com +short
```

**🪟 Windows (PowerShell):**
```powershell
Resolve-DnsName xray.yourdomain.com -Server 8.8.8.8 -Type A
```

یا با `nslookup`:
```powershell
nslookup xray.yourdomain.com 8.8.8.8
```

**🪟 Windows (Git Bash):**
```bash
nslookup xray.yourdomain.com 8.8.8.8
```

باید **IP سرور تو** رو برگردونه. ممکنه ۱-۵ دقیقه طول بکشه.

---

## مرحله ۳ — اتصال SSH به VPS

### 🍎 Mac / 🐧 Linux / 🪟 Windows (PowerShell یا Git Bash)

```bash
ssh root@YOUR_VPS_IP
```

اولین بار `yes` بزن. رمز رو وارد کن (هنگام تایپ نشون داده نمی‌شه — این طبیعیه).

### 🪟 Windows با PuTTY (اگه CLI سخته)

1. PuTTY رو باز کن
2. **Host Name (or IP address):** `YOUR_VPS_IP`
3. **Port:** `22`
4. **Connection type:** `SSH`
5. **Open** بزن
6. اولین بار **Accept** بزن
7. login: `root` + Enter، رمز رو وارد کن

> 💡 پس از این مرحله، تمام دستوراتی که با `#` (یا `root@vps:~#`) شروع می‌شن، **داخل سرور SSH** اجرا می‌شن — مهم نیست از Mac وصل شدی یا Windows.

### چک OS

```bash
cat /etc/os-release
```

باید Ubuntu 22.04 یا 24.04 رو ببینی.

---

## مرحله ۴ — نصب Xray

### آپدیت سیستم و نصب پکیج‌ها

```bash
apt update && apt upgrade -y
apt install -y curl socat cron ufw
```

### نصب Xray با اسکریپت رسمی

```bash
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install
```

پس از چند ثانیه:
```
info: Xray vXX.X.X is installed.
```

### چک نسخه

```bash
xray version
```

> ⚠️ نسخه باید **حداقل v1.8.16** باشه (برای XHTTP). نسخه‌های جدیدتر (مثل ۲۶.x) بهترن.

### تولید UUID

```bash
xray uuid
```

خروجی مثل:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**این UUID رو ذخیره کن** — بعداً تو کانفیگ سرور و کلاینت لازمه.

### فعال‌سازی سرویس

```bash
systemctl enable xray
```

### تنظیم فایروال

```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # برای صدور cert
ufw allow 443/tcp     # برای آینده
ufw allow 2096/tcp    # پورت Xray ما
ufw --force enable
ufw status
```

> ⚠️ قبل از `ufw --force enable` مطمئن شو پورت ۲۲ allow شده، وگرنه ارتباط SSH قطع می‌شه.

---

## مرحله ۵ — گرفتن TLS Certificate

از **acme.sh** + **Let's Encrypt** استفاده می‌کنیم (رایگان، خودکار).

### نصب acme.sh

```bash
curl https://get.acme.sh | sh -s email=your@email.com
source ~/.bashrc
```

### تنظیم CA پیش‌فرض

```bash
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
```

### اطمینان از خالی بودن پورت ۸۰

```bash
ss -tlnp | grep :80
```

اگه چیزی listen می‌کنه (مثل apache یا nginx)، خاموشش کن:
```bash
systemctl stop apache2 2>/dev/null
systemctl disable apache2 2>/dev/null
systemctl stop nginx 2>/dev/null
```

### صدور certificate

```bash
~/.acme.sh/acme.sh --issue -d xray.yourdomain.com --standalone -k ec-256
```

> جای `xray.yourdomain.com` دامنه‌ی واقعی خودت رو بذار.

خروجی موفق:
```
Cert success.
Your cert is in: /root/.acme.sh/xray.yourdomain.com_ecc/...
```

### نصب cert در مسیر Xray

```bash
mkdir -p /etc/xray

~/.acme.sh/acme.sh --install-cert -d xray.yourdomain.com --ecc \
  --fullchain-file /etc/xray/cert.pem \
  --key-file /etc/xray/key.pem \
  --reloadcmd "systemctl restart xray"

chown -R nobody:nogroup /etc/xray
chmod 644 /etc/xray/cert.pem
chmod 640 /etc/xray/key.pem
ls -la /etc/xray/
```

باید `cert.pem` و `key.pem` رو ببینی.

---

## مرحله ۶ — کانفیگ Xray با XHTTP

### آماده‌سازی لاگ‌ها

```bash
mkdir -p /var/log/xray
touch /var/log/xray/access.log /var/log/xray/error.log
chown -R nobody:nogroup /var/log/xray
cp /usr/local/etc/xray/config.json /usr/local/etc/xray/config.json.bak 2>/dev/null || true
```

### نوشتن کانفیگ

> 📝 **قبل از پیست**، این مقادیر رو در ذهن داشته باش:
> - `YOUR-UUID-HERE` → UUID که از `xray uuid` گرفتی
> - `xray.yourdomain.com` → دامنه‌ی واقعی خودت
> - `/yourpath` → یه path دلخواه (مثلاً `/myapppath`)

```bash
cat > /usr/local/etc/xray/config.json << 'EOF'
{
  "log": {
    "loglevel": "warning",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "inbounds": [
    {
      "tag": "xhttp-in",
      "listen": "0.0.0.0",
      "port": 2096,
      "protocol": "vless",
      "settings": {
        "clients": [
          { "id": "YOUR-UUID-HERE", "flow": "" }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "xhttp",
        "security": "tls",
        "tlsSettings": {
          "alpn": ["h2", "http/1.1"],
          "certificates": [
            {
              "certificateFile": "/etc/xray/cert.pem",
              "keyFile": "/etc/xray/key.pem"
            }
          ]
        },
        "xhttpSettings": {
          "path": "/yourpath",
          "host": "xray.yourdomain.com",
          "mode": "auto"
        }
      }
    }
  ],
  "outbounds": [
    { "protocol": "freedom", "tag": "direct" },
    { "protocol": "blackhole", "tag": "blocked" }
  ]
}
EOF
```

> ⚠️ بعد از پیست، فایل رو با `nano /usr/local/etc/xray/config.json` باز کن و سه مقدار `YOUR-UUID-HERE`, `/yourpath`, `xray.yourdomain.com` رو با مقادیر واقعی جایگزین کن.

### تست syntax کانفیگ

```bash
xray -test -config /usr/local/etc/xray/config.json
```

باید ببینی: `Configuration OK.`

### راه‌اندازی Xray

```bash
systemctl restart xray
systemctl status xray --no-pager
ss -tlnp | grep 2096
```

### تست محلی

```bash
curl -vk https://127.0.0.1:2096/yourpath
```

اگه `HTTP/2 404` گرفتی → عالیه! (404 طبیعیه چون UUID نفرستادی، یعنی Xray داره کار می‌کنه.)

---

## مرحله ۷ — Deploy روی Vercel

دو روش: **CLI** (سریع‌تر) یا **Dashboard** (با GitHub).

### روش A: Vercel CLI

#### نصب Node.js و Vercel CLI

**🍎 Mac:**
```bash
# اگه Homebrew نداری
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node
sudo npm i -g vercel
vercel --version
```

**🐧 Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y nodejs npm
sudo npm i -g vercel
vercel --version
```

**🪟 Windows:**

1. **نصب Node.js:**
   - برو [nodejs.org](https://nodejs.org)
   - نسخه‌ی **LTS** رو دانلود کن (فایل `.msi`)
   - دابل‌کلیک کن، Next تا Finish
   - حتماً تیک **Add to PATH** فعال باشه

2. **نصب Vercel CLI** (در PowerShell یا Git Bash):
   ```powershell
   npm i -g vercel
   vercel --version
   ```
   
   اگه permission error داد، PowerShell رو **As Administrator** باز کن و دوباره بزن.

#### لاگین به Vercel

**در هر سیستم‌عاملی:**
```bash
vercel login
```

با فلش `Continue with Email` رو انتخاب کن، ایمیلت رو بزن، روی لینک تأیید کلیک کن.

#### دانلود فایل‌های پروژه

**روش ۱: clone از گیت‌هاب (پیشنهادی)**
```bash
git clone https://github.com/YOUR-USERNAME/vercel-xhttp-relay.git
cd vercel-xhttp-relay
```

**روش ۲: دانلود ZIP**

از صفحه‌ی Release آخرین نسخه رو دانلود کن، unzip کن، و وارد پوشه شو:
```bash
cd path/to/vercel-xhttp-relay
```

داخل پوشه باید این فایل‌ها باشن:
```
api/index.js
vercel.json
package.json
```

#### Link پروژه به Vercel

```bash
vercel link
```

سؤالات و جواب‌های پیشنهادی:

| سؤال | جواب |
|---|---|
| `Set up "~/path/to/folder"?` | `yes` |
| `Which scope should contain your project?` | اکانت خودت رو انتخاب کن |
| `Link to existing project?` | `no` (برای پروژه‌ی جدید) |
| `What's your project's name?` | اسم دلخواه (مثلاً `myrelay`) |
| `In which directory is your code located?` | `./` |
| `Want to modify these settings?` | `no` |
| `Do you want to change additional project settings?` | `no` |

✅ پیغام موفقیت: `Linked to ACCOUNT/PROJECT (created .vercel)`

#### تنظیم Environment Variable

```bash
vercel env add TARGET_DOMAIN
```

سؤالات و جواب‌ها:

| سؤال | جواب |
|---|---|
| `What's the value of TARGET_DOMAIN?` | `https://xray.yourdomain.com:2096` (دامنه و پورت سرور خودت) |
| `Add TARGET_DOMAIN to which Environments?` | با Space روی **Production** بزن، بعد Enter |
| `Make it sensitive?` | `no` |

✅ پیغام موفقیت: `Added Environment Variable TARGET_DOMAIN to Project`

#### Deploy به Production

```bash
vercel --prod
```

✅ خروجی موفق:
```
Production: https://YOUR-PROJECT.vercel.app
Aliased: https://YOUR-PROJECT-ACCOUNT.vercel.app
```

URL رو یادداشت کن — ازش در کانفیگ کلاینت استفاده می‌کنی.

#### دستورات کاربردی Vercel CLI

| دستور | کار |
|---|---|
| `vercel ls` | لیست deployment‌های پروژه |
| `vercel logs --follow` | دیدن لاگ زنده |
| `vercel env ls` | لیست environment variables |
| `vercel env rm TARGET_DOMAIN` | حذف یک env var |
| `vercel logout` | خروج از اکانت فعلی |
| `vercel login` | ورود (می‌تونی چند اکانت داشته باشی) |

### روش B: Dashboard (با GitHub)

1. ریپوی این پروژه رو fork یا clone کن و به GitHub خودت push کن.
2. در [vercel.com/new](https://vercel.com/new) ریپو رو **Import** کن.
3. در صفحه‌ی تنظیمات، بخش **Environment Variables**:
   - `TARGET_DOMAIN` = `https://xray.yourdomain.com:2096`
4. **Deploy** بزن.

### غیرفعال کردن Deployment Protection

اگه موقع setup گزینه‌ی **Vercel Authentication** رو روشن گذاشتی، باید خاموشش کنی وگرنه relay کار نمی‌کنه:

1. داشبورد Vercel → پروژه → **Settings → Deployment Protection**
2. **Vercel Authentication** رو روی **Disabled** بذار
3. **Save**

### تست relay

**🍎 Mac / 🐧 Linux / 🪟 Git Bash / 🪟 PowerShell (Win 10+):**
```bash
curl -I https://your-project.vercel.app/yourpath
```

**🪟 Windows PowerShell (نسخه‌ی native):**
```powershell
Invoke-WebRequest -Uri "https://your-project.vercel.app/yourpath" -Method Head
```

> 💡 در ویندوز ۱۰+ خود `curl.exe` نصبه و کار می‌کنه.

| خروجی | معنی |
|---|---|
| `HTTP/2 404` | ✅ همه چیز درسته |
| `HTTP/2 401` + HTML login | Deployment Protection روشنه |
| `HTTP/2 500` | env var ست نشده |
| `HTTP/2 502` | TARGET_DOMAIN غلطه |

---

## مرحله ۸ — کانفیگ کلاینت

### مقادیر کانفیگ

```
UUID:        UUID خودت
Address:     vercel.com
Port:        443
SNI:         vercel.com
Type:        xhttp
Path:        /yourpath
Host:        your-project.vercel.app
Mode:        auto
TLS:         on
ALPN:        h2
Fingerprint: chrome
```

### لینک VLESS share

```
vless://YOUR-UUID@vercel.com:443?encryption=none&security=tls&sni=vercel.com&alpn=h2&fp=chrome&type=xhttp&path=%2Fyourpath&host=your-project.vercel.app&mode=auto#Vercel-Relay
```

> توجه: `/` در path رو با `%2F` encode کن.

### کلاینت‌های پیشنهادی

| پلتفرم | کلاینت |
|---|---|
| Windows | **v2rayN** (v6.45+) |
| Android | **v2rayNG**, **Hiddify** |
| iOS | **V2Box**, **Streisand** |
| macOS | **V2Box**, **Hiddify** |
| Linux | **Hiddify**, **xray-core** |

### نکات تنظیم

- **Core**: حتماً `Xray-core` (نه V2Ray-core، چون XHTTP رو V2Ray ساپورت نمی‌کنه)
- **Mux**: خاموش (`OFF`)
- **Routing**: Bypass LAN/Iran رو روشن کن
- **Allow Insecure**: `OFF`

### تست بعد از اتصال

تو مرورگر برو:
```
https://ifconfig.me
```

باید **IP سرور VPS تو** رو نشون بده، نه IP ایران.

---

## محدودیت‌های Vercel

> ⚠️ این اعداد از مستندات رسمی Vercel در زمان نوشتن این README هستن. ممکنه تغییر کرده باشن — برای آخرین آپدیت [vercel.com/pricing](https://vercel.com/pricing) و [vercel.com/docs/limits](https://vercel.com/docs/limits) رو چک کن.

### اعداد عمومی

| محدودیت | Hobby (رایگان) | Pro |
|---|---|---|
| **Fast Data Transfer** (کلاینت ↔ Vercel) | ۱۰۰ GB / ماه | ۱ TB / ماه |
| **Fast Origin Transfer** (Vercel ↔ سرور پشتی) | **۱۰ GB / ماه** | ~۱۰۰ GB / ماه |
| **Edge Requests** | ۱M / ماه | ۱۰M / ماه |
| **Function Invocations** | ۱M / ماه | ۱۰M / ماه |
| **Fluid Active CPU** | ۴ ساعت / ماه | ۴۰ ساعت / ماه |
| **Fluid Provisioned Memory** | ۳۶۰ GB-hrs / ماه | بیشتر |
| **Max Duration (per invocation)** | ۶۰ ثانیه | ۳۰۰ ثانیه |

### قیمت و تفاوت پلن‌ها

| پلن | قیمت تقریبی | مناسب برای | رفتار هنگام اتمام سهمیه |
|---|---|---|---|
| **Hobby** | رایگان | استفاده شخصی سبک | معمولاً اکانت **pause** می‌شه و باید صبر کنی تا دوره بعدی |
| **Pro** | از حدود `20$` به‌ازای هر عضو در ماه | استفاده جدی‌تر / تیمی | روی مصرف اضافه، **overage** (هزینه اضافه) محاسبه می‌شه |
| **Enterprise** | سفارشی | سازمانی / SLA / امنیت پیشرفته | قرارداد و سیاست مصرف اختصاصی |

> 💡 اگر مصرفت نزدیک سقف Hobby می‌رسه (به‌خصوص `Fast Origin Transfer`)، برای پایداری بهتر به `Pro` مهاجرت کن یا چند relay جداگانه داشته باش.

> 📚 منبع رسمی: [Vercel Pricing](https://vercel.com/pricing)

### 🔴 نکته‌ی خیلی مهم: Fast Origin Transfer

برای استفاده‌ی **پروکسی/relay** این مورد بحرانی‌تر از Fast Data Transfer هست!

**هر بایت ترافیک شما دو بار شمرده می‌شه:**

```
┌─────────┐   Fast Data    ┌────────┐   Fast Origin   ┌───────────┐
│ کلاینت   │ ─────────────► │ Vercel │ ─────────────► │ Xray سرور │
│         │   Transfer     │  Edge  │   Transfer      │           │
└─────────┘                └────────┘                 └───────────┘
            (سهمیه ۱ — کلاینت)        (سهمیه ۲ — origin)
```

- ۱ GB دانلود از سمت تو = ۱ GB Fast Data + ۱ GB Fast Origin مصرف می‌شه
- اگه Fast Origin Transfer به حدش برسه، حساب Hobby ت **pause می‌شه** و باید ۳۰ روز صبر کنی یا upgrade کنی

> 📚 [مستندات Fast Origin Transfer](https://vercel.com/docs/manage-cdn-usage)

### تخمین مصرف Hobby (محافظه‌کارانه)

با در نظر گرفتن **هر دو** Fast Data و Fast Origin:

| استفاده | تقریبی |
|---|---|
| چت / تلگرام / WhatsApp | عملاً نامحدود |
| استریم موزیک (Spotify) | عملاً نامحدود |
| مرور وب عادی | عملاً نامحدود |
| یوتیوب 720p | ~۵۰ ساعت / ماه |
| یوتیوب 1080p | ~۲۰-۳۰ ساعت / ماه |
| یوتیوب 4K / دانلود حجیم | ~۷ ساعت / ماه |

> 💡 برای استفاده‌ی روزمره (چت، مرور، موزیک، ویدیو 720p) Hobby کاملاً کافیه. برای استریم 4K یا دانلود سنگین، یا Pro بگیر یا چند پروژه‌ی Hobby بساز و بین‌شون load balance کن.

---

## نکته درباره بهینه‌سازی هزینه

> ⚠️ **این بهینه‌سازی فقط در نسخه‌ی v1.1 وجود داره — در v1.0 اعمال نشده.**
>
> در **v1.1** runtime به Node.js Serverless تغییر کرده + Fluid Compute concurrency فعال شده، که هزینه‌ی Provisioned Memory رو حدود **۸ برابر** کاهش میده. اگه می‌خوای از این بهینه‌سازی استفاده کنی، نسخه‌ی **v1.1** رو دانلود و deploy کن.
>
> در **v1.0** (Edge Runtime)، هر connection همزمان یک instance جدا با حدود **~1GB RAM رزرو‌شده** ایجاد می‌کنه.

### بهینه‌سازی اختیاری: محدود کردن XMUX (سمت کلاینت)

برای کاهش بیشتر تعداد instance‌ها، می‌تونی تو کانفیگ Xray کلاینت (Custom Config) تعداد connection‌های همزمان رو محدود کنی:

```json
"xhttpSettings": {
  "path": "/yourpath",
  "host": "your-project.vercel.app",
  "mode": "auto",
  "xmux": {
    "maxConnections": 2,
    "maxConcurrency": 16,
    "cMaxReuseTimes": 64
  }
}
```

- **`maxConnections: 2`** → حداکثر ۲ اتصال HTTP همزمان به Vercel
- **`maxConcurrency: 16`** → هر اتصال تا ۱۶ stream رو multiplex می‌کنه

> ⚠️ در **v2rayNG** و **Hiddify** معمولاً XMUX از GUI قابل تنظیم نیست — باید **Custom Config** استفاده کنی.

### خلاصه‌ی هزینه ماهانه v1.0 (Pro، 12h/روز استفاده)

| آیتم | نرخ | v1.0 |
|---|---|---|
| **Fluid Provisioned Memory** | $0.012/GB-hr | ~$6.75 |
| **Fluid Active CPU** | $0.14/hr | ~$1.50 |
| **Function Invocations** | $0.60/1M | ~$0.60 |
| **Fast Origin Transfer** | $0.06/GB | ~$0.57 |
| **جمع** | | **~$10.46** |

> 💡 برای دیدن هزینه‌ی v1.1 (~۷۰٪ ارزان‌تر)، به README نسخه‌ی v1.1 مراجعه کن.

---

## عیب‌یابی

### مرحله‌ی اول دیباگ — تست URL Vercel

```bash
curl -I https://YOUR-PROJECT.vercel.app/yourpath
```

| خروجی | معنی | راه‌حل |
|---|---|---|
| `HTTP/2 404` | ✅ همه چیز درسته (relay آماده‌ست) | کانفیگ کلاینت رو بساز |
| `HTTP/2 401` + HTML login | Deployment Protection روشنه | بخش بعدی |
| `HTTP/2 500` | env var ست نشده | بخش `500` |
| `HTTP/2 502` | TARGET_DOMAIN غلطه | بخش `502` |
| `ERR_TIMED_OUT` | شبکه به Vercel نمی‌رسه | بخش timeout |

---

### `404 Not Found` (همه چیز 404 می‌ده)
شاید:
1. **Rewrite rule مشکل داره.** `vercel.json` رو چک کن:
   ```json
   "rewrites": [
     { "source": "/(.*)", "destination": "/api/index" }
   ]
   ```
   ⚠️ `destination` باید **بدون `.js`** باشه.

2. **فایل `api/index.js` deploy نشده.** چک کن:
   ```bash
   vercel ls
   ```
   و در داشبورد → Deployments → Source ببین فایل آپلود شده.

3. **Redeploy کن:**
   ```bash
   vercel --prod
   ```

---

### `502 Bad Gateway: Tunnel Failed`
Vercel به سرور پشتی نمی‌رسه. چک کن:
- `TARGET_DOMAIN` دقیقاً درسته (`https://...:port`)
- Xray در سرور بالاست: `systemctl status xray`
- پورت در فایروال بازه: `ufw status`
- از روی VPS تست کن: `curl -I https://xray.yourdomain.com:2096`

---

### `500 Misconfigured: TARGET_DOMAIN is not set`
Env var ست نشده یا redeploy نشده. بزن:
```bash
vercel env ls
vercel --prod
```

اگه env var وجود داشت ولی هنوز خطا داد، حذف کن و دوباره اضافه کن:
```bash
vercel env rm TARGET_DOMAIN
vercel env add TARGET_DOMAIN
vercel --prod
```

---

### `401 Unauthorized` با HTML login
Vercel Authentication روشنه. در داشبورد → پروژه → **Settings** → **Deployment Protection** → **Vercel Authentication** رو **Disabled** کن → **Save**.

اگه گزینه رو ندیدی، مستقیم برو:
```
https://vercel.com/ACCOUNT/PROJECT/settings/deployment-protection
```

---

### `ERR_TIMED_OUT` (سایت اصلاً باز نمی‌شه)
شبکه‌ی محلی به Vercel نمی‌رسه. تست کن:

```bash
nslookup YOUR-PROJECT.vercel.app
```

اگه DNS جواب می‌ده ولی صفحه باز نمی‌شه:
1. **با VPN امتحان کن** — اگه با VPN کار کرد، ISP محلی فیلتر کرده.
2. **با دیتای موبایل امتحان کن** — اگه فقط رو Wi-Fi مشکل داره، router یا ISP اون شبکه فیلتر کرده.
3. **یه Custom Domain به Vercel وصل کن** (Settings → Domains) و در کلاینت همون رو استفاده کن.

---

### `Warning: Provided memory setting in vercel.json is ignored on Active CPU billing`
این یه warning هست، نه خطا. اکانتت روی **Active CPU billing** هست — Vercel خودش memory رو مدیریت می‌کنه و تنظیم `memory: 128` در `vercel.json` نادیده گرفته می‌شه.

این warning **بی‌ضرر** هست. می‌تونی:
- **نادیده بگیری** — کار می‌کنه
- یا تنظیم `memory` رو از `vercel.json` حذف کنی تا warning نیاد

---

### `Warning: Node.js functions are compiled from ESM to CommonJS`
این warning می‌گه `import` syntax داری ولی `package.json` `"type": "module"` نداره. اضافه کن:
```json
{
  "type": "module",
  ...
}
```

---

### کلاینت وصل می‌شه ولی ترافیک رد نمی‌شه
- Mux رو خاموش کن
- Core رو روی `Xray-core` بذار
- Routing → Bypass Iran رو فعال کن
- Path در کلاینت دقیقاً برابر path در سرور Xray باشه

---

### TLS handshake error در کلاینت
- SNI رو از `vercel.com` به `YOUR-PROJECT.vercel.app` عوض کن
- ALPN رو فقط `h2` بذار
- Fingerprint رو `chrome` بذار

---

### کلاینت فقط روی Wi-Fi کار می‌کنه نه دیتای موبایل
ISP موبایل ممکنه `*.vercel.app` رو bottleneck کنه. یه Custom Domain به Vercel وصل کن (Settings → Domains).

---

### `Configuration OK` ولی Xray کرش می‌کنه
لاگ خطا رو ببین:
```bash
tail -50 /var/log/xray/error.log
```
معمولاً مشکل دسترسی فایل cert/key. با این درست کن:
```bash
chown -R nobody:nogroup /etc/xray /var/log/xray
```

---

### دیدن لاگ‌های Vercel برای دیباگ زنده
```bash
vercel logs --follow
```
بعد از باز شدن، یه request از کلاینت بزن — هر خطا یا output در لاگ ظاهر می‌شه.

---

## سوالات متداول

### آیا می‌تونم با Cloudflare به‌جای Vercel این کار رو بکنم؟
بله، ولی با کد متفاوت (Cloudflare Workers). برای WebSocket، Cloudflare Workers بهتره. برای XHTTP، Vercel به‌خاطر streaming WebStreams پایدارتره.

### اگه `*.vercel.app` در ایران فیلتر بشه؟
یه دامنه‌ی شخصی به Vercel وصل کن (Settings → Domains → Add). بعد در کلاینت `host` و `address` رو همون بذار.

### چند کاربر می‌تونن همزمان وصل بشن؟
محدودیت سختی نیست، ولی برای هر کاربر یه UUID جدا بساز:
```json
"clients": [
  { "id": "uuid-1", "email": "user1@example.com" },
  { "id": "uuid-2", "email": "user2@example.com" }
]
```

### آیا می‌تونم پورت ۲۰۹۶ رو عوض کنم؟
بله. پورت دلخواه رو در `config.json` بذار، در ufw allow کن، و در `TARGET_DOMAIN` در Vercel همون پورت رو بذار.

### چطور لاگ Vercel رو ببینم؟
```bash
vercel logs --follow
```
یا در داشبورد → پروژه → **Logs**.

### بعد از تغییر کانفیگ Xray باید چی کار کنم؟
```bash
xray -test -config /usr/local/etc/xray/config.json
systemctl restart xray
```

### Certificate تمدید خودکار می‌شه؟
بله. acme.sh یه cron job می‌سازه و هر ۶۰ روز خودکار renew می‌کنه. می‌تونی manual تست کنی:
```bash
~/.acme.sh/acme.sh --renew -d xray.yourdomain.com --force --ecc
```

---

## License

MIT — مثل پروژه‌ی اصلی.

## Disclaimer

این پروژه برای آموزش و تست شخصیه. مسئولیت استفاده با خودته. قوانین کشور و TOS Vercel رو رعایت کن.

---

## 📢 ارتباط با ما

اگه این راهنما برات مفید بود، یا سوال/پیشنهاد داری، از طریق کانال تلگرام در ارتباط باش:

<div align="center">

[![Join Telegram](https://img.shields.io/badge/%D9%87%D9%85%D8%B1%D8%A7%D9%87%20%D9%85%D8%A7%20%D8%B4%D9%88-Avaco%20Cloud-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/avaco_cloud)

**[https://t.me/avaco_cloud](https://t.me/avaco_cloud)**

*آموزش‌های بیشتر • کانفیگ‌های آپدیت • روش‌های دور زدن سانسور • پشتیبانی*

</div>

---

⭐ اگه پروژه به دردت خورد، یه **Star** بذار تا بیشتر دیده بشه.
