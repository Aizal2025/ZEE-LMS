# Zee Job Portal (Firebase + GitHub Pages)

HTML, CSS, JavaScript aur Firebase (Authentication + Firestore) se bana job portal.
Candidate jobs dekh ke apply kar sakta hai, admin jobs add / edit / delete karta hai.

## Files

```
index.html   about.html   admin.html   login.html
style.css    script.js    firestore.rules
```

## Step 1: Firebase project banao

1. https://console.firebase.google.com pe jao, **Add project** dabao, naam do (jaise `zee-job-portal`).
2. **Build > Authentication > Get started > Sign-in method** me **Email/Password** enable karo.
3. **Build > Firestore Database > Create database** karo (production mode, apna region chuno).
4. Firestore ke **Rules** tab me `firestore.rules` file ka poora code paste karke **Publish** karo.

## Step 2: Config `script.js` me paste karo

1. **Project settings (gear icon) > Your apps > Web (`</>`)** pe app register karo.
2. Jo `firebaseConfig` dikhe, uski values `script.js` ke upar wale `firebaseConfig` me paste karo.

## Step 3: Pehla admin banao

Public signup se koi admin nahi ban sakta, isliye pehla admin tumhe khud banana hai:

1. Website pe **Candidate** tab me Sign up karke apna account banao.
2. Firebase console > **Firestore Database > users** me apna document kholo.
3. `role` field ki value `candidate` se badal ke `admin` kar do.
4. Ab website pe **Admin** tab se login karo, Admin Desk khul jayega.

Uske baad koi aur banda Admin tab me Sign up karega to uski request **Admin access requests** me dikhegi. Wahan se Approve / Reject karo.

## Step 4: GitHub pe upload karo

1. GitHub pe naya repository banao (jaise `zee-job-portal`).
2. Saari files **repository ke root me** upload karo (kisi folder ke andar nahi).
3. **Settings > Pages > Branch: `main` / `(root)` > Save**.
4. Kuch der baad site is link pe chalegi: `https://<tumhara-username>.github.io/zee-job-portal/`

## Step 5: Login ke liye domain allow karo

Firebase console > **Authentication > Settings > Authorized domains > Add domain**
me `<tumhara-username>.github.io` add karo. Ye na karne par GitHub pe login nahi chalega.

## Dhyan rakhne wali baatein

- `firebaseConfig` ki values public hoti hain, ye normal hai. Data ki safety `firestore.rules` se hoti hai, isliye rules zaroor publish karna.
- Pages sirf `http://` ya `https://` pe chalte hain. File double-click karke khologe to Firebase module load nahi hoga. Local test ke liye VS Code ka **Live Server** use karo.
- Jobs pehle khali hongi. Admin se login karke jobs add karo.
