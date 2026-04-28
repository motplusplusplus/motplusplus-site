export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // /residents/* → /artists/*
    if (path === '/residents' || path.startsWith('/residents/')) {
      url.pathname = path.replace(/^\/residents/, '/artists');
      return Response.redirect(url.toString(), 301);
    }

    // Old WordPress URLs: /YYYY/MM/DD/slug → /events/slug
    const wpMatch = path.match(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)$/);
    if (wpMatch) {
      url.pathname = `/events/${wpMatch[1]}`;
      return Response.redirect(url.toString(), 301);
    }

    // Serve static assets (respects _redirects, _headers, etc.)
    return env.ASSETS.fetch(request);
  },
};
