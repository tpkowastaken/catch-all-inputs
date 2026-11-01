// Sends http:// and https://www to the HTTPS root domain in a single redirect, keeping the path and query.
export default {
  fetch(request) {
    const { pathname, search } = new URL(request.url);
    return Response.redirect(`https://catchallinputs.com${pathname}${search}`, 301);
  },
};
