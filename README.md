# 🌴 Les Bungalows de Sainte-Cécile — Déploiement Netlify

## 📦 Contenu du projet

```
├── index.html                          ← Le site web
├── vue_bungalow.png                    ← Photo aérienne (hero + cartes)
├── Terrasse.png                        ← Photo terrasse
├── netlify.toml                        ← Configuration Netlify
├── netlify/
│   └── functions/
│       └── lodgify-data.mjs            ← Fonction API (proxy Lodgify)
└── README.md                           ← Ce fichier
```

## 🚀 Déploiement en 5 étapes

### Étape 1 — Créer un compte Netlify (gratuit)

1. Va sur **https://app.netlify.com/signup**
2. Crée un compte (avec GitHub, Google ou email)

### Étape 2 — Déployer le site

1. Sur le dashboard Netlify, clique **"Add new site"** → **"Deploy manually"**
2. **Glisse-dépose le dossier complet** de ce projet dans la zone de drop
3. Netlify déploie en 30 secondes et te donne une URL temporaire (ex: `sunny-bungalow-123.netlify.app`)

### Étape 3 — Configurer la clé API Lodgify

**C'est l'étape cruciale pour que les photos se mettent à jour automatiquement.**

1. Dans Netlify, va dans **Site configuration** → **Environment variables**
2. Clique **"Add a variable"**
3. Ajoute :
   - **Key** : `LODGIFY_API_KEY`
   - **Value** : ta clé API Lodgify (celle de Settings → Public API dans Lodgify)
4. Clique **Save**
5. Va dans **Deploys** → clique **"Trigger deploy"** → **"Deploy site"**

### Étape 4 — Vérifier que ça marche

1. Ouvre ton site Netlify (l'URL `.netlify.app`)
2. Ouvre la console du navigateur (F12 → Console)
3. Tu devrais voir : `✅ Données Lodgify mises à jour (12 logements, ...)`
4. Si tu vois `ℹ️ API indisponible` → vérifie ta clé API (étape 3)

### Étape 5 — Connecter ton domaine (optionnel)

1. Dans Netlify → **Domain management** → **Add a custom domain**
2. Entre ton domaine (ex: `lesbungalowsdesaintececile.com`)
3. Suis les instructions pour configurer les DNS
4. Netlify fournit un certificat SSL gratuit automatiquement

---

## 🔄 Comment ça marche ?

```
Visiteur ouvre ton site
        ↓
Le site s'affiche IMMÉDIATEMENT (données en dur = fallback)
        ↓
En arrière-plan, appel à /api/data
        ↓
Netlify Function → appelle l'API Lodgify avec ta clé (protégée)
        ↓
Lodgify renvoie : photos, descriptions, prix, équipements
        ↓
Le site se met à jour silencieusement (photos fraîches, prix à jour)
```

**Résultat :** tu changes une photo dans Lodgify → dans l'heure, elle apparaît sur ton site. Zéro code à toucher.

---

## 📸 Changer les photos

1. Va dans **Lodgify** → ta propriété → onglet **Photos**
2. Ajoute/supprime/réorganise les photos
3. **C'est tout !** Ton site se met à jour automatiquement (cache de 1h)

## 💰 Changer les prix

Même chose — modifie les tarifs dans Lodgify, le site suit.

## 📝 Changer les descriptions

Idem — tout vient de Lodgify en temps réel.

---

## ⚠️ Important

- **Ne jamais mettre ta clé API Lodgify dans le code HTML** (elle est protégée dans les variables d'environnement Netlify)
- **Régénère ta clé API** dans Lodgify si elle a été exposée (Settings → Public API)
- Le site fonctionne même si l'API est indisponible (les données en dur prennent le relais)
- Le cache est de 1 heure — après un changement dans Lodgify, il faut attendre max 1h pour voir le résultat sur le site
