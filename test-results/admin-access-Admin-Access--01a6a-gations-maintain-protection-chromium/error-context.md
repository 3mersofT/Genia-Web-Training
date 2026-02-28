# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Bon retour ! 👋" [level=1] [ref=e6]
    - paragraph [ref=e7]: Connectez-vous pour continuer votre apprentissage
  - generic [ref=e8]:
    - generic [ref=e9]:
      - text: Email ou Nom d'utilisateur
      - textbox "Email ou Nom d'utilisateur" [ref=e10]:
        - /placeholder: vous@exemple.com ou mon_username
    - generic [ref=e11]:
      - text: Mot de passe
      - textbox "Mot de passe" [ref=e12]:
        - /placeholder: ••••••••
    - generic [ref=e13]:
      - generic [ref=e14]:
        - checkbox "Se souvenir de moi" [ref=e15]
        - text: Se souvenir de moi
      - link "Mot de passe oublié ?" [ref=e16] [cursor=pointer]:
        - /url: /forgot-password
    - button "Se connecter" [ref=e17]
  - paragraph [ref=e18]:
    - text: Pas encore de compte ?
    - link "Inscrivez-vous" [ref=e19] [cursor=pointer]:
      - /url: /register
```