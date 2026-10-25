# Run Workin Cove on your local machine

This app must run on **your computer**. Opening `http://127.0.0.1:43127` only works after `npm run dev` is running in a terminal on that same computer.

## 1. Get the code onto your PC

The project was built in a Cursor Cloud Agent. It is **not** on GitHub until you create a repo and push (or use Cursor’s **Create repo**).

### Recommended: create GitHub repo, then clone

1. On GitHub, create an empty repo, e.g.  
   `https://github.com/asadsandyapp/workin-cove`
2. In the Cursor agent UI, use **Create repo** / connect that GitHub repo (or push the branch yourself once the remote is linked).
3. On your laptop:

```bash
cd ~
git clone https://github.com/asadsandyapp/workin-cove.git
cd workin-cove
git checkout cursor/workin-cove-crm-40fd
```

If the default branch already has the app code, you can skip the checkout.

### Project directory after clone

```text
~/workin-cove
```

(or wherever you cloned it — that folder is the project directory)

## 2. Requirements

- Node.js 20+ (22 is fine)
- npm

```bash
node -v
npm -v
```

## 3. Install and run locally

```bash
cd ~/workin-cove          # your project directory
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open in Chrome on **the same PC**:

- URL: http://127.0.0.1:43127
- Username: `admin@workincove.local`
- Password: `1122`

## 4. Why Chrome showed ERR_CONNECTION_REFUSED

`127.0.0.1` means “this computer.” The Cloud Agent’s server is another machine, so your laptop Chrome cannot reach it. Local Chrome works only after you run `npm run dev` locally.
