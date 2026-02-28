# Page snapshot

```yaml
- generic [active]:
  - img [ref=e3]
  - alert [ref=e6]
  - dialog "Server Error" [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - navigation [ref=e13]:
          - button "previous" [disabled] [ref=e14]:
            - img "previous" [ref=e15]
          - button "next" [disabled] [ref=e17]:
            - img "next" [ref=e18]
          - generic [ref=e20]: 1 of 1 error
        - heading "Server Error" [level=1] [ref=e21]
        - paragraph [ref=e22]: "Error: Cannot find module 'F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\.next\\server\\app\\(auth)\\login\\page.js' Require stack: - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\require.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\load-components.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\build\\utils.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\dev\\hot-middleware.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\dev\\hot-reloader-webpack.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\lib\\router-utils\\setup-dev-bundler.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\lib\\router-server.js - F:\\GitHub\\Claude\\genia-web-training\\.auto-claude\\worktrees\\tasks\\011-optimiser-le-chargement-des-donn-es-json-lazy-load\\node_modules\\next\\dist\\server\\lib\\start-server.js"
        - generic [ref=e23]: This error happened while generating the page. Any console logs will be displayed in the terminal window.
      - generic [ref=e24]:
        - heading "Call Stack" [level=2] [ref=e25]
        - group [ref=e26]:
          - generic "Next.js" [ref=e27] [cursor=pointer]:
            - img [ref=e28]
            - img [ref=e30]
            - text: Next.js
        - generic [ref=e35]:
          - heading "TracingChannel.traceSync" [level=3] [ref=e36]
          - generic [ref=e38]: node:diagnostics_channel (322:14)
        - group [ref=e39]:
          - generic "Next.js" [ref=e40] [cursor=pointer]:
            - img [ref=e41]
            - img [ref=e43]
            - text: Next.js
```