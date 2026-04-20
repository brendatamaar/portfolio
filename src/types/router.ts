export interface RouteWithHead {
  options?: {
    head?: (ctx: {
      loaderData: unknown
      params: Record<string, string>
      context: unknown
    }) => { meta?: Array<Record<string, string>> } | void
  }
}
