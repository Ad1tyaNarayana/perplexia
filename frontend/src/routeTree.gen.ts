/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SplatImport } from './routes/$'
import { Route as IndexImport } from './routes/index'
import { Route as RegisterIndexImport } from './routes/register/index'
import { Route as LoginIndexImport } from './routes/login/index'
import { Route as ChatIndexImport } from './routes/chat/index'
import { Route as RegisterSplatImport } from './routes/register/$'
import { Route as LoginSsoCallbackImport } from './routes/login/sso-callback'
import { Route as LoginFactorOneImport } from './routes/login/factor-one'
import { Route as LoginSplatImport } from './routes/login/$'
import { Route as ChatSessionIdImport } from './routes/chat/$sessionId'

// Create/Update Routes

const SplatRoute = SplatImport.update({
  id: '/$',
  path: '/$',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const RegisterIndexRoute = RegisterIndexImport.update({
  id: '/register/',
  path: '/register/',
  getParentRoute: () => rootRoute,
} as any)

const LoginIndexRoute = LoginIndexImport.update({
  id: '/login/',
  path: '/login/',
  getParentRoute: () => rootRoute,
} as any)

const ChatIndexRoute = ChatIndexImport.update({
  id: '/chat/',
  path: '/chat/',
  getParentRoute: () => rootRoute,
} as any)

const RegisterSplatRoute = RegisterSplatImport.update({
  id: '/register/$',
  path: '/register/$',
  getParentRoute: () => rootRoute,
} as any)

const LoginSsoCallbackRoute = LoginSsoCallbackImport.update({
  id: '/login/sso-callback',
  path: '/login/sso-callback',
  getParentRoute: () => rootRoute,
} as any)

const LoginFactorOneRoute = LoginFactorOneImport.update({
  id: '/login/factor-one',
  path: '/login/factor-one',
  getParentRoute: () => rootRoute,
} as any)

const LoginSplatRoute = LoginSplatImport.update({
  id: '/login/$',
  path: '/login/$',
  getParentRoute: () => rootRoute,
} as any)

const ChatSessionIdRoute = ChatSessionIdImport.update({
  id: '/chat/$sessionId',
  path: '/chat/$sessionId',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/$': {
      id: '/$'
      path: '/$'
      fullPath: '/$'
      preLoaderRoute: typeof SplatImport
      parentRoute: typeof rootRoute
    }
    '/chat/$sessionId': {
      id: '/chat/$sessionId'
      path: '/chat/$sessionId'
      fullPath: '/chat/$sessionId'
      preLoaderRoute: typeof ChatSessionIdImport
      parentRoute: typeof rootRoute
    }
    '/login/$': {
      id: '/login/$'
      path: '/login/$'
      fullPath: '/login/$'
      preLoaderRoute: typeof LoginSplatImport
      parentRoute: typeof rootRoute
    }
    '/login/factor-one': {
      id: '/login/factor-one'
      path: '/login/factor-one'
      fullPath: '/login/factor-one'
      preLoaderRoute: typeof LoginFactorOneImport
      parentRoute: typeof rootRoute
    }
    '/login/sso-callback': {
      id: '/login/sso-callback'
      path: '/login/sso-callback'
      fullPath: '/login/sso-callback'
      preLoaderRoute: typeof LoginSsoCallbackImport
      parentRoute: typeof rootRoute
    }
    '/register/$': {
      id: '/register/$'
      path: '/register/$'
      fullPath: '/register/$'
      preLoaderRoute: typeof RegisterSplatImport
      parentRoute: typeof rootRoute
    }
    '/chat/': {
      id: '/chat/'
      path: '/chat'
      fullPath: '/chat'
      preLoaderRoute: typeof ChatIndexImport
      parentRoute: typeof rootRoute
    }
    '/login/': {
      id: '/login/'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginIndexImport
      parentRoute: typeof rootRoute
    }
    '/register/': {
      id: '/register/'
      path: '/register'
      fullPath: '/register'
      preLoaderRoute: typeof RegisterIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/$': typeof SplatRoute
  '/chat/$sessionId': typeof ChatSessionIdRoute
  '/login/$': typeof LoginSplatRoute
  '/login/factor-one': typeof LoginFactorOneRoute
  '/login/sso-callback': typeof LoginSsoCallbackRoute
  '/register/$': typeof RegisterSplatRoute
  '/chat': typeof ChatIndexRoute
  '/login': typeof LoginIndexRoute
  '/register': typeof RegisterIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/$': typeof SplatRoute
  '/chat/$sessionId': typeof ChatSessionIdRoute
  '/login/$': typeof LoginSplatRoute
  '/login/factor-one': typeof LoginFactorOneRoute
  '/login/sso-callback': typeof LoginSsoCallbackRoute
  '/register/$': typeof RegisterSplatRoute
  '/chat': typeof ChatIndexRoute
  '/login': typeof LoginIndexRoute
  '/register': typeof RegisterIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/$': typeof SplatRoute
  '/chat/$sessionId': typeof ChatSessionIdRoute
  '/login/$': typeof LoginSplatRoute
  '/login/factor-one': typeof LoginFactorOneRoute
  '/login/sso-callback': typeof LoginSsoCallbackRoute
  '/register/$': typeof RegisterSplatRoute
  '/chat/': typeof ChatIndexRoute
  '/login/': typeof LoginIndexRoute
  '/register/': typeof RegisterIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/$'
    | '/chat/$sessionId'
    | '/login/$'
    | '/login/factor-one'
    | '/login/sso-callback'
    | '/register/$'
    | '/chat'
    | '/login'
    | '/register'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/$'
    | '/chat/$sessionId'
    | '/login/$'
    | '/login/factor-one'
    | '/login/sso-callback'
    | '/register/$'
    | '/chat'
    | '/login'
    | '/register'
  id:
    | '__root__'
    | '/'
    | '/$'
    | '/chat/$sessionId'
    | '/login/$'
    | '/login/factor-one'
    | '/login/sso-callback'
    | '/register/$'
    | '/chat/'
    | '/login/'
    | '/register/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  SplatRoute: typeof SplatRoute
  ChatSessionIdRoute: typeof ChatSessionIdRoute
  LoginSplatRoute: typeof LoginSplatRoute
  LoginFactorOneRoute: typeof LoginFactorOneRoute
  LoginSsoCallbackRoute: typeof LoginSsoCallbackRoute
  RegisterSplatRoute: typeof RegisterSplatRoute
  ChatIndexRoute: typeof ChatIndexRoute
  LoginIndexRoute: typeof LoginIndexRoute
  RegisterIndexRoute: typeof RegisterIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  SplatRoute: SplatRoute,
  ChatSessionIdRoute: ChatSessionIdRoute,
  LoginSplatRoute: LoginSplatRoute,
  LoginFactorOneRoute: LoginFactorOneRoute,
  LoginSsoCallbackRoute: LoginSsoCallbackRoute,
  RegisterSplatRoute: RegisterSplatRoute,
  ChatIndexRoute: ChatIndexRoute,
  LoginIndexRoute: LoginIndexRoute,
  RegisterIndexRoute: RegisterIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/$",
        "/chat/$sessionId",
        "/login/$",
        "/login/factor-one",
        "/login/sso-callback",
        "/register/$",
        "/chat/",
        "/login/",
        "/register/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/$": {
      "filePath": "$.tsx"
    },
    "/chat/$sessionId": {
      "filePath": "chat/$sessionId.tsx"
    },
    "/login/$": {
      "filePath": "login/$.tsx"
    },
    "/login/factor-one": {
      "filePath": "login/factor-one.tsx"
    },
    "/login/sso-callback": {
      "filePath": "login/sso-callback.tsx"
    },
    "/register/$": {
      "filePath": "register/$.tsx"
    },
    "/chat/": {
      "filePath": "chat/index.tsx"
    },
    "/login/": {
      "filePath": "login/index.tsx"
    },
    "/register/": {
      "filePath": "register/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
