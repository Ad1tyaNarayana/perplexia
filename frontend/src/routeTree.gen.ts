/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoginImport } from './routes/login'
import { Route as IndexImport } from './routes/index'
import { Route as ChatIndexImport } from './routes/chat/index'
import { Route as ChatSessionIdImport } from './routes/chat/$sessionId'

// Create/Update Routes

const LoginRoute = LoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ChatIndexRoute = ChatIndexImport.update({
  id: '/chat/',
  path: '/chat/',
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
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/chat/$sessionId': {
      id: '/chat/$sessionId'
      path: '/chat/$sessionId'
      fullPath: '/chat/$sessionId'
      preLoaderRoute: typeof ChatSessionIdImport
      parentRoute: typeof rootRoute
    }
    '/chat/': {
      id: '/chat/'
      path: '/chat'
      fullPath: '/chat'
      preLoaderRoute: typeof ChatIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/chat/$sessionId': typeof ChatSessionIdRoute
  '/chat': typeof ChatIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/chat/$sessionId': typeof ChatSessionIdRoute
  '/chat': typeof ChatIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/chat/$sessionId': typeof ChatSessionIdRoute
  '/chat/': typeof ChatIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/login' | '/chat/$sessionId' | '/chat'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/login' | '/chat/$sessionId' | '/chat'
  id: '__root__' | '/' | '/login' | '/chat/$sessionId' | '/chat/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LoginRoute: typeof LoginRoute
  ChatSessionIdRoute: typeof ChatSessionIdRoute
  ChatIndexRoute: typeof ChatIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  LoginRoute: LoginRoute,
  ChatSessionIdRoute: ChatSessionIdRoute,
  ChatIndexRoute: ChatIndexRoute,
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
        "/login",
        "/chat/$sessionId",
        "/chat/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/chat/$sessionId": {
      "filePath": "chat/$sessionId.tsx"
    },
    "/chat/": {
      "filePath": "chat/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
