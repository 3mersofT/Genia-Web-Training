# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e7]:
          - button "previous" [disabled] [ref=e8]:
            - img "previous" [ref=e9]
          - button "next" [disabled] [ref=e11]:
            - img "next" [ref=e12]
          - generic [ref=e14]: 1 of 1 error
        - button "Close" [ref=e15] [cursor=pointer]:
          - img [ref=e17]
      - heading "Unhandled Runtime Error" [level=1] [ref=e20]
      - paragraph [ref=e21]: "ChunkLoadError: Loading chunk _app-pages-browser_src_components_pwa_InstallPWA_tsx failed. (error: http://localhost:3000/_next/static/chunks/_app-pages-browser_src_components_pwa_InstallPWA_tsx.js)"
    - generic [ref=e22]:
      - heading "Source" [level=2] [ref=e23]
      - generic [ref=e24]:
        - link "src\\components\\providers\\PWAProvider.tsx (7:34) @ InstallPWA.loadableGenerated.modules [as loader]" [ref=e26] [cursor=pointer]:
          - generic [ref=e27]: src\components\providers\PWAProvider.tsx (7:34) @ InstallPWA.loadableGenerated.modules [as loader]
          - img [ref=e28]
        - generic [ref=e32]: "5 | 6 | // Import dynamique pour éviter les erreurs SSR > 7 | const InstallPWA = dynamic(() => import('@/components/pwa/InstallPWA'), { | ^ 8 | ssr: false 9 | }); 10 |"
      - heading "Call Stack" [level=2] [ref=e33]
      - button "Show collapsed frames" [ref=e34] [cursor=pointer]
```